use std::time::Duration;

use tokio::sync::mpsc;
use tokio::time::sleep;
use tracing::{error, warn};
use uuid::Uuid;

use crate::streams::source::CapturedFrame;

/// Captures frames by performing a periodic HTTP GET on a snapshot URL.
/// Most IP cameras expose a `/snapshot.jpg` or similar endpoint.
pub struct SnapshotCapturer {
    pub stream_id: Uuid,
    pub stream_name: String,
    pub url: String,
    pub interval: Duration,
}

impl SnapshotCapturer {
    /// Runs until the sender is dropped (i.e. the stream is disabled/removed).
    pub async fn run(self, tx: mpsc::Sender<CapturedFrame>) {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .expect("Failed to build HTTP client");

        loop {
            match client.get(&self.url).send().await {
                Ok(resp) if resp.status().is_success() => {
                    match resp.bytes().await {
                        Ok(bytes) => {
                            let frame = CapturedFrame {
                                stream_id: self.stream_id,
                                stream_name: self.stream_name.clone(),
                                data: bytes.to_vec(),
                                captured_at: chrono::Utc::now(),
                            };
                            if tx.send(frame).await.is_err() {
                                // Receiver dropped – stop.
                                break;
                            }
                        }
                        Err(e) => error!(stream = %self.stream_name, "Failed to read snapshot bytes: {e}"),
                    }
                }
                Ok(resp) => {
                    warn!(stream = %self.stream_name, status = %resp.status(), "Snapshot HTTP error");
                }
                Err(e) => {
                    error!(stream = %self.stream_name, "Snapshot request failed: {e}");
                }
            }

            sleep(self.interval).await;
        }
    }
}
