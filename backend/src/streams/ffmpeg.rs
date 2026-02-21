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
            info!(stream = %self.stream_name, "Starting ffmpeg capture process");

            let mut cmd = self.build_command();
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

    fn build_command(&self) -> Command {
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
                    "-i", &self.source_url,
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);
            }
            SourceType::Mjpeg => {
                cmd.args([
                    "-i", &self.source_url,
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
                    // Capture at the same rate we output so dshow's buffer never
                    // accumulates excess frames (fixes "rtbufsize too full" warnings).
                    "-framerate", &LIVE_FPS.to_string(),
                    // Give dshow a larger ring buffer (100 MB) as a safety net.
                    "-rtbufsize", "100M",
                    "-i", &format!("video={}", self.source_url),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);

                #[cfg(target_os = "linux")]
                cmd.args([
                    "-f", "v4l2",
                    "-i", &self.source_url,
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);

                #[cfg(target_os = "macos")]
                cmd.args([
                    "-f", "avfoundation",
                    "-i", &self.source_url,
                    "-vf", &format!("fps={LIVE_FPS}"),
                    "-strict", "unofficial",
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);
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
