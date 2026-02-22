mod analysis;
mod api;
mod assistant;
mod config;
mod error;
mod notifications;
mod state;
mod storage;
mod streams;

use std::sync::Arc;

use anyhow::Context;
use sqlx::postgres::PgPoolOptions;
use tokio::sync::{broadcast, mpsc};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::{
    analysis::{vlm::build_vlm_client, worker::AnalysisWorkerPool},
    config::AppConfig,
    state::AppState,
    storage::models::AnalysisEvent,
    streams::{frame_store::FrameStore, manager::StreamManager},
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ── Logging ───────────────────────────────────────────────────────────────
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // ── Config ────────────────────────────────────────────────────────────────
    let cfg = AppConfig::from_env().context("Failed to load config")?;
    info!("Starting Cipher-Shield Backend on {}:{}", cfg.server.host, cfg.server.port);

    // ── Database ──────────────────────────────────────────────────────────────
    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&cfg.database_url)
        .await
        .context("Failed to connect to PostgreSQL")?;

    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .context("Failed to run migrations")?;

    info!("Database connected and migrations applied");

    // ── VLM client ────────────────────────────────────────────────────────────
    let vlm = build_vlm_client(&cfg.vlm);
    info!("VLM client ready");

    // ── Channels ──────────────────────────────────────────────────────────────
    // Frame queue: capturers → analysis workers
    let (frame_tx, frame_rx) = mpsc::channel(cfg.frame_queue_size);

    // Event broadcast: analysis workers → WebSocket subscribers
    let (event_tx, _) = broadcast::channel::<AnalysisEvent>(256);

    // ── Frame store ───────────────────────────────────────────────────────────
    let frame_store = FrameStore::new();

    // ── App state ─────────────────────────────────────────────────────────────
    let state = AppState::new(db.clone(), Arc::clone(&vlm), event_tx.clone(), Arc::clone(&frame_store));

    // ── Analysis worker pool ──────────────────────────────────────────────────
    let worker_pool = AnalysisWorkerPool::new(
        cfg.analysis_workers,
        Arc::clone(&vlm),
        db.clone(),
        event_tx,
    );
    tokio::spawn(async move { worker_pool.run(frame_rx).await });

    // ── Stream manager ────────────────────────────────────────────────────────
    let stream_manager = StreamManager::new(db.clone(), frame_tx, Arc::clone(&frame_store));
    stream_manager.start_all().await?;
    let stream_manager = Arc::new(stream_manager);

    // ── HTTP server ───────────────────────────────────────────────────────────
    let addr = format!("{}:{}", cfg.server.host, cfg.server.port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .context(format!("Failed to bind to {}", addr))?;

    info!("Listening on http://{}", addr);

    axum::serve(listener, api::router(state, stream_manager))
        .await
        .context("HTTP server error")?;

    Ok(())
}
