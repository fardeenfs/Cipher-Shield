pub mod routes;
pub mod ws;

use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

use crate::{state::AppState, streams::manager::StreamManager};

/// Build the full Axum router.
pub fn router(state: Arc<AppState>, stream_manager: Arc<StreamManager>) -> Router {
    Router::new()
        // Health
        .route("/api/health", get(routes::health))
        // Streams CRUD
        .route("/api/streams", get(routes::list_streams).post(routes::create_stream))
        .route(
            "/api/streams/:id",
            get(routes::get_stream)
                .put(routes::update_stream)
                .delete(routes::delete_stream),
        )
        .route("/api/streams/:id/enable", post(routes::enable_stream))
        .route("/api/streams/:id/disable", post(routes::disable_stream))
        // Events
        .route("/api/events", get(routes::list_events))
        .route("/api/events/:id", get(routes::get_event))
        // WebSocket
        .route("/ws/events", get(ws::ws_handler))
        // Shared state
        .with_state(state)
        .layer(axum::extract::Extension(stream_manager))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
}
