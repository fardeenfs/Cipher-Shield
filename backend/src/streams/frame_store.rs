use std::{collections::HashMap, sync::Arc};

use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

/// How many frames to buffer in each per-stream broadcast channel.
/// Live MJPEG clients will drop frames if they fall behind — that is fine.
const LIVE_CHANNEL_CAPACITY: usize = 2;

struct Inner {
    latest: HashMap<Uuid, Vec<u8>>,
    channels: HashMap<Uuid, broadcast::Sender<Arc<Vec<u8>>>>,
}

/// Holds the most-recent JPEG frame for every active stream and provides
/// per-stream broadcast channels for live MJPEG viewers.
pub struct FrameStore {
    inner: RwLock<Inner>,
}

impl FrameStore {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            inner: RwLock::new(Inner {
                latest: HashMap::new(),
                channels: HashMap::new(),
            }),
        })
    }

    /// Store the latest frame and broadcast it to any live viewers.
    pub async fn push(&self, stream_id: Uuid, frame: Vec<u8>) {
        let mut inner = self.inner.write().await;
        let arc_frame = Arc::new(frame.clone());
        inner.latest.insert(stream_id, frame);
        // Create the broadcast channel lazily on first push.
        let tx = inner
            .channels
            .entry(stream_id)
            .or_insert_with(|| broadcast::channel(LIVE_CHANNEL_CAPACITY).0);
        // Ignore send errors — no subscribers is fine.
        let _ = tx.send(arc_frame);
    }

    /// Return the most recently captured JPEG for a stream, if any.
    pub async fn get_latest(&self, stream_id: Uuid) -> Option<Vec<u8>> {
        self.inner.read().await.latest.get(&stream_id).cloned()
    }

    /// Subscribe to the live JPEG stream for a specific camera.
    pub async fn subscribe(&self, stream_id: Uuid) -> broadcast::Receiver<Arc<Vec<u8>>> {
        let mut inner = self.inner.write().await;
        let tx = inner
            .channels
            .entry(stream_id)
            .or_insert_with(|| broadcast::channel(LIVE_CHANNEL_CAPACITY).0);
        tx.subscribe()
    }
}
