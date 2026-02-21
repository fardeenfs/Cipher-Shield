use std::{collections::HashMap, sync::Arc, time::Duration};

use anyhow::Result;
use sqlx::PgPool;
use tokio::{sync::mpsc, task::JoinHandle};
use tracing::{error, info};
use uuid::Uuid;

use crate::streams::{
    ffmpeg::FfmpegCapturer,
    snapshot::SnapshotCapturer,
    source::{CapturedFrame, SourceType},
};

/// A stream record loaded from the database.
#[derive(Debug)]
pub struct StreamRecord {
    pub id: Uuid,
    pub name: String,
    pub source_type: String,
    pub source_url: String,
    pub capture_interval_sec: i32,
    pub enabled: bool,
}

/// Manages all active capture tasks.
pub struct StreamManager {
    db: PgPool,
    frame_tx: mpsc::Sender<CapturedFrame>,
    /// Map of stream_id → running capture task handle.
    tasks: Arc<tokio::sync::Mutex<HashMap<Uuid, JoinHandle<()>>>>,
}

impl StreamManager {
    pub fn new(db: PgPool, frame_tx: mpsc::Sender<CapturedFrame>) -> Self {
        Self {
            db,
            frame_tx,
            tasks: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
        }
    }

    /// Load all enabled streams from the DB and start their capture tasks.
    pub async fn start_all(&self) -> Result<()> {
        let streams = sqlx::query_as!(
            StreamRecord,
            r#"SELECT id, name, source_type, source_url, capture_interval_sec, enabled
               FROM streams WHERE enabled = true"#
        )
        .fetch_all(&self.db)
        .await?;

        info!("Starting {} stream capture task(s)", streams.len());

        for stream in streams {
            self.start_stream(stream).await;
        }

        Ok(())
    }

    /// Spawn a capture task for a single stream.
    pub async fn start_stream(&self, stream: StreamRecord) {
        let id = stream.id;
        let tx = self.frame_tx.clone();
        let interval = Duration::from_secs(stream.capture_interval_sec.max(1) as u64);

        let source_type: SourceType = match stream.source_type.parse() {
            Ok(t) => t,
            Err(e) => {
                error!(stream = %stream.name, "Invalid source_type: {e}");
                return;
            }
        };

        info!(stream = %stream.name, source_type = %source_type, "Starting capture");

        let handle = if source_type == SourceType::Snapshot {
            let capturer = SnapshotCapturer {
                stream_id: id,
                stream_name: stream.name,
                url: stream.source_url,
                interval,
            };
            tokio::spawn(async move { capturer.run(tx).await })
        } else {
            let capturer = FfmpegCapturer {
                stream_id: id,
                stream_name: stream.name,
                source_type,
                source_url: stream.source_url,
                interval,
            };
            tokio::spawn(async move { capturer.run(tx).await })
        };

        self.tasks.lock().await.insert(id, handle);
    }

    /// Stop the capture task for a stream.
    pub async fn stop_stream(&self, stream_id: Uuid) {
        if let Some(handle) = self.tasks.lock().await.remove(&stream_id) {
            handle.abort();
        }
    }

    /// Restart a stream (e.g. after an update).
    pub async fn restart_stream(&self, stream: StreamRecord) {
        self.stop_stream(stream.id).await;
        self.start_stream(stream).await;
    }

    pub fn frame_sender(&self) -> mpsc::Sender<CapturedFrame> {
        self.frame_tx.clone()
    }
}
