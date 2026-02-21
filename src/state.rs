use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::broadcast;

use crate::{analysis::vlm::DynVlmClient, storage::models::AnalysisEvent};

/// Shared across every Axum handler via `axum::extract::State`.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub vlm: DynVlmClient,
    /// Broadcast channel – analysis workers publish; WS handlers subscribe.
    pub event_tx: broadcast::Sender<AnalysisEvent>,
}

impl AppState {
    pub fn new(
        db: PgPool,
        vlm: DynVlmClient,
        event_tx: broadcast::Sender<AnalysisEvent>,
    ) -> Arc<Self> {
        Arc::new(Self { db, vlm, event_tx })
    }
}
