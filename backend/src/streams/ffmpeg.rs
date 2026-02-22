/// FFmpeg-based frame capturer for RTSP, MJPEG, and local USB cameras.
///
/// Strategy: spawn `ffmpeg` at LIVE_FPS for smooth live view, push every frame
/// to the FrameStore (served by the MJPEG live endpoint), and forward only one
/// frame per `interval` to the VLM analysis queue.
///
/// Prerequisites
/// ─────────────
/// • `ffmpeg` must be on PATH.
/// • Windows USB cameras: the source_url should be the DirectShow device name,
///   e.g. `"Integrated Camera"`.  Obtainable with:
///   `ffmpeg -list_devices true -f dshow -i dummy`
/// • Linux USB cameras: use `/dev/video0` (or similar).
use std::sync::Arc;
use std::time::Duration;

use tokio::{
    io::AsyncReadExt,
    process::Command,
    sync::mpsc,
    time::sleep,
};
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::streams::{
    frame_store::FrameStore,
    source::{CapturedFrame, SourceType},
};

/// Frames per second for live MJPEG view.
/// The analysis interval is enforced separately by throttling the analysis queue.
const LIVE_FPS: u32 = 15;

pub struct FfmpegCapturer {
    pub stream_id: Uuid,
    pub stream_name: String,
    pub source_type: SourceType,
    /// RTSP/MJPEG URL, or device identifier for USB cameras.
    pub source_url: String,
    /// How often to forward a frame to the VLM analysis queue.
    pub interval: Duration,
    /// Live frame store – every captured frame is pushed here for the MJPEG endpoint.
    pub frame_store: Arc<FrameStore>,
}

impl FfmpegCapturer {
    pub async fn run(self, tx: mpsc::Sender<CapturedFrame>) {
        loop {
            // For Mock sources, resolve the effective URL (yt-dlp for web, passthrough for local).
            let effective_url = if self.source_type == SourceType::Mock {
                match resolve_mock_url(&self.stream_name, &self.source_url).await {
                    Some(u) => u,
                    None => {
                        sleep(Duration::from_secs(10)).await;
                        continue;
                    }
                }
            } else {
                self.source_url.clone()
            };

            info!(stream = %self.stream_name, "Starting ffmpeg capture process");

            let mut cmd = self.build_command(&effective_url);
            let child = match cmd.spawn() {
                Ok(c) => c,
                Err(e) => {
                    error!(stream = %self.stream_name, "Failed to spawn ffmpeg: {e}. Is ffmpeg on PATH?");
                    sleep(Duration::from_secs(5)).await;
                    continue;
                }
            };

            if let Err(e) = Self::pipe_frames(
                child,
                &self.stream_id,
                &self.stream_name,
                &self.interval,
                &self.frame_store,
                &tx,
            )
            .await
            {
                warn!(stream = %self.stream_name, "ffmpeg pipe ended: {e}. Restarting in 3 s…");
                sleep(Duration::from_secs(3)).await;
            } else {
                // Receiver dropped – stop gracefully.
                break;
            }
        }
    }

    /// `url` is the effective source URL (already resolved for Mock/YouTube sources).
    fn build_command(&self, url: &str) -> Command {
        let mut cmd = Command::new("ffmpeg");
        cmd.stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::inherit())
            // overwrite without prompt
            .arg("-y");

        // -strict unofficial must be placed AFTER -i (as an output option) so it
        // actually reaches the mjpeg encoder. Placing it before -i as a global
        // flag is silently ignored by some ffmpeg builds.
        match &self.source_type {
            SourceType::Rtsp => {
                cmd.args([
                    "-rtsp_transport", "tcp",
                    "-i", url,
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);
            }
            SourceType::Mjpeg => {
                cmd.args([
                    "-i", url,
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);
            }
            SourceType::Usb => {
                #[cfg(target_os = "windows")]
                cmd.args([
                    "-f", "dshow",
                    // Large ring buffer to handle cameras that capture faster than
                    // our output rate (fixes "rtbufsize too full" warnings).
                    "-rtbufsize", "100M",
                    "-i", &format!("video={}", url),
                    // Throttle output to LIVE_FPS on the output side so we don't
                    // force the camera into a specific capture rate (avoids
                    // "Could not set video options" on cameras that don't support
                    // the exact requested framerate via the dshow input flag).
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);

                #[cfg(target_os = "linux")]
                cmd.args([
                    "-f", "v4l2",
                    "-i", url,
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);

                #[cfg(target_os = "macos")]
                cmd.args([
                    "-f", "avfoundation",
                    "-i", url,
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);
            }
            SourceType::Mock => {
                let is_web = url.starts_with("http://") || url.starts_with("https://");
                if is_web {
                    // Web URL resolved by yt-dlp: play once at native speed; the
                    // run() loop will re-resolve and restart when it finishes.
                    cmd.args([
                        "-re",
                        "-i", url,
                        "-vf", &format!("fps={LIVE_FPS}"),
                        "-strict", "unofficial",
                        "-f", "image2pipe",
                        "-vcodec", "mjpeg",
                        "pipe:1",
                    ]);
                } else {
                    // Local file: loop indefinitely with -stream_loop -1.
                    // -re reads at native frame rate so we don't flood the queue.
                    // -stream_loop must come before -i.
                    cmd.args([
                        "-re",
                        "-stream_loop", "-1",
                        "-i", url,
                        "-vf", &format!("fps={LIVE_FPS}"),
                        "-strict", "unofficial",
                        "-f", "image2pipe",
                        "-vcodec", "mjpeg",
                        "pipe:1",
                    ]);
                }
            }
            SourceType::Snapshot => {
                // Should not reach here; use SnapshotCapturer instead.
                unreachable!("FfmpegCapturer does not handle Snapshot sources");
            }
        }

        cmd
    }

    async fn pipe_frames(
        mut child: tokio::process::Child,
        stream_id: &Uuid,
        stream_name: &str,
        interval: &Duration,
        frame_store: &Arc<FrameStore>,
        tx: &mpsc::Sender<CapturedFrame>,
    ) -> anyhow::Result<()> {
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| anyhow::anyhow!("No stdout on ffmpeg child"))?;

        let mut reader = tokio::io::BufReader::new(stdout);
        let mut buf = Vec::with_capacity(512 * 1024);
        let mut chunk = vec![0u8; 65536];

        // Initialise so the very first frame triggers an analysis send immediately.
        let mut last_analysis = std::time::Instant::now() - *interval;

        loop {
            let n = reader.read(&mut chunk).await?;
            if n == 0 {
                // ffmpeg closed stdout
                break;
            }
            buf.extend_from_slice(&chunk[..n]);

            // Extract complete JPEG frames from the accumulated buffer.
            let (frames, remainder) = extract_jpeg_frames(&buf);
            buf = remainder;

            for frame_data in frames {
                // Always push to FrameStore for smooth live MJPEG view.
                frame_store.push(*stream_id, frame_data.clone()).await;

                // Only forward to the analysis queue at the configured interval.
                if last_analysis.elapsed() >= *interval {
                    last_analysis = std::time::Instant::now();
                    let frame = CapturedFrame {
                        stream_id: *stream_id,
                        stream_name: stream_name.to_string(),
                        data: frame_data,
                        captured_at: chrono::Utc::now(),
                    };
                    // try_send: if the analysis queue is full (VLM still busy),
                    // drop this frame rather than blocking or building a backlog.
                    use tokio::sync::mpsc::error::TrySendError;
                    match tx.try_send(frame) {
                        Ok(()) => {}
                        Err(TrySendError::Full(_)) => {
                            // VLM is still processing; skip frame, try again next interval.
                        }
                        Err(TrySendError::Closed(_)) => {
                            // Receiver dropped – stop gracefully.
                            child.kill().await.ok();
                            return Ok(());
                        }
                    }
                }
            }
        }

        anyhow::bail!("ffmpeg stdout closed");
    }
}

// ─── Mock source helpers ──────────────────────────────────────────────────────

/// Resolves the effective URL for a Mock source:
/// - Local file path → returned as-is.
/// - Web URL (http/https) → calls `yt-dlp -g` to get the direct CDN URL.
///
/// Returns `None` on failure (already logged); the caller should back off and retry.
async fn resolve_mock_url(stream_name: &str, source_url: &str) -> Option<String> {
    if !source_url.starts_with("http://") && !source_url.starts_with("https://") {
        // Local file — use directly.
        return Some(source_url.to_string());
    }

    // Web / YouTube URL — resolve to a direct streamable URL via yt-dlp.
    info!(stream = %stream_name, url = %source_url, "Resolving mock URL via yt-dlp");
    match tokio::process::Command::new("yt-dlp")
        .args([
            "-g",                     // print direct URL, do not download
            "--no-playlist",          // single video only
            "-f", "best[ext=mp4]/best", // prefer mp4 for broadest ffmpeg support
            source_url,
        ])
        .output()
        .await
    {
        Ok(out) if out.status.success() => {
            let resolved = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if resolved.is_empty() {
                error!(stream = %stream_name, "yt-dlp returned an empty URL");
                None
            } else {
                info!(stream = %stream_name, "yt-dlp resolved URL successfully");
                Some(resolved)
            }
        }
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            error!(
                stream = %stream_name,
                "yt-dlp failed (status {}): {}",
                out.status,
                stderr.chars().take(200).collect::<String>()
            );
            None
        }
        Err(e) => {
            error!(stream = %stream_name, "Failed to spawn yt-dlp: {e}. Is yt-dlp on PATH?");
            None
        }
    }
}

/// Splits a byte slice into complete JPEG images and a trailing remainder.
///
/// JPEG structure:
///   SOI = 0xFF 0xD8  (start of image)
///   EOI = 0xFF 0xD9  (end of image)
fn extract_jpeg_frames(data: &[u8]) -> (Vec<Vec<u8>>, Vec<u8>) {
    let mut frames = Vec::new();
    let mut start: Option<usize> = None;
    let mut i = 0;

    while i + 1 < data.len() {
        if data[i] == 0xFF && data[i + 1] == 0xD8 {
            // New SOI – discard any partial frame that started without SOI
            start = Some(i);
        }
        if data[i] == 0xFF && data[i + 1] == 0xD9 {
            if let Some(s) = start.take() {
                // +2 to include the EOI marker bytes
                frames.push(data[s..i + 2].to_vec());
            }
        }
        i += 1;
    }

    // Bytes after the last complete frame (may start a new frame)
    let remainder = match start {
        Some(s) => data[s..].to_vec(),
        None => Vec::new(),
    };

    (frames, remainder)
}
