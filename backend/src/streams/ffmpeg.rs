/// FFmpeg-based frame capturer for RTSP, MJPEG, and local USB cameras.
///
/// Strategy: spawn `ffmpeg` as a subprocess, emit one JPEG frame every
/// `interval` seconds to stdout via `image2pipe`, and split the raw pipe
/// output into individual frames using JPEG SOI/EOI byte markers.
///
/// Prerequisites
/// ─────────────
/// • `ffmpeg` must be on PATH.
/// • Windows USB cameras: the source_url should be the DirectShow device name,
///   e.g. `"Integrated Camera"`.  Obtainable with:
///   `ffmpeg -list_devices true -f dshow -i dummy`
/// • Linux USB cameras: use `/dev/video0` (or similar).
use std::time::Duration;

use tokio::{
    io::AsyncReadExt,
    process::Command,
    sync::mpsc,
    time::sleep,
};
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::streams::source::{CapturedFrame, SourceType};

pub struct FfmpegCapturer {
    pub stream_id: Uuid,
    pub stream_name: String,
    pub source_type: SourceType,
    /// RTSP/MJPEG URL, or device identifier for USB cameras.
    pub source_url: String,
    pub interval: Duration,
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

            if let Err(e) = Self::pipe_frames(child, &self.stream_id, &self.stream_name, &tx).await
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
        // fps = 1 / interval_secs  → e.g. interval=5s → fps=0.2
        let fps = format!("1/{}", self.interval.as_secs().max(1));

        let mut cmd = Command::new("ffmpeg");
        cmd.stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null())
            // overwrite without prompt
            .arg("-y");

        match &self.source_type {
            SourceType::Rtsp => {
                cmd.args([
                    "-rtsp_transport", "tcp",
                    "-i", &self.source_url,
                    "-vf", &format!("fps={fps}"),
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);
            }
            SourceType::Mjpeg => {
                cmd.args([
                    "-i", &self.source_url,
                    "-vf", &format!("fps={fps}"),
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);
            }
            SourceType::Usb => {
                #[cfg(target_os = "windows")]
                cmd.args([
                    "-f", "dshow",
                    "-i", &format!("video={}", self.source_url),
                    "-vf", &format!("fps={fps}"),
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);

                #[cfg(target_os = "linux")]
                cmd.args([
                    "-f", "v4l2",
                    "-i", &self.source_url,  // e.g. /dev/video0
                    "-vf", &format!("fps={fps}"),
                    "-f", "image2pipe",
                    "-vcodec", "mjpeg",
                    "pipe:1",
                ]);

                #[cfg(target_os = "macos")]
                cmd.args([
                    "-f", "avfoundation",
                    "-i", &self.source_url,  // e.g. "0" for the first camera
                    "-vf", &format!("fps={fps}"),
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
        tx: &mpsc::Sender<CapturedFrame>,
    ) -> anyhow::Result<()> {
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| anyhow::anyhow!("No stdout on ffmpeg child"))?;

        let mut reader = tokio::io::BufReader::new(stdout);
        let mut buf = Vec::with_capacity(512 * 1024);
        let mut chunk = vec![0u8; 65536];

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
                let frame = CapturedFrame {
                    stream_id: *stream_id,
                    stream_name: stream_name.to_string(),
                    data: frame_data,
                    captured_at: chrono::Utc::now(),
                };

                if tx.send(frame).await.is_err() {
                    // Receiver dropped – signal caller to stop.
                    child.kill().await.ok();
                    return Ok(());
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
