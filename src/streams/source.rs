use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A single captured image from a stream.
#[derive(Debug, Clone)]
pub struct CapturedFrame {
    pub stream_id: Uuid,
    pub stream_name: String,
    /// Raw JPEG bytes.
    pub data: Vec<u8>,
    pub captured_at: DateTime<Utc>,
}

/// Supported stream source types, mirroring the `source_type` DB column.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SourceType {
    /// RTSP stream (IP cameras). Requires `ffmpeg` on PATH.
    Rtsp,
    /// HTTP MJPEG stream. Requires `ffmpeg` on PATH.
    Mjpeg,
    /// HTTP snapshot endpoint – just a periodic GET request.
    Snapshot,
    /// Local USB / webcam. Requires `ffmpeg` on PATH.
    Usb,
}

impl std::str::FromStr for SourceType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "rtsp" => Ok(Self::Rtsp),
            "mjpeg" => Ok(Self::Mjpeg),
            "snapshot" => Ok(Self::Snapshot),
            "usb" => Ok(Self::Usb),
            other => Err(format!("Unknown source_type: '{other}'")),
        }
    }
}

impl std::fmt::Display for SourceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Rtsp => write!(f, "rtsp"),
            Self::Mjpeg => write!(f, "mjpeg"),
            Self::Snapshot => write!(f, "snapshot"),
            Self::Usb => write!(f, "usb"),
        }
    }
}
