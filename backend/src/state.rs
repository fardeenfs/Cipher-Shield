use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::broadcast;

use crate::{
    analysis::vlm::DynVlmClient,
    storage::models::AnalysisEvent,
    streams::frame_store::FrameStore,
};

/// Shared across every Axum handler via `axum::extract::State`.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub vlm: DynVlmClient,
    /// Broadcast channel – analysis workers publish; WS handlers subscribe.
    pub event_tx: broadcast::Sender<AnalysisEvent>,
    /// Latest frame per stream + per-stream live MJPEG channels.
    pub frame_store: Arc<FrameStore>,
}

impl AppState {
    pub fn new(
        db: PgPool,
        vlm: DynVlmClient,
        event_tx: broadcast::Sender<AnalysisEvent>,
        frame_store: Arc<FrameStore>,
    ) -> Arc<Self> {
        Arc::new(Self { db, vlm, event_tx, frame_store })
    }
}
