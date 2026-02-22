pub mod openapi;
pub mod routes;
pub mod ws;

use std::sync::Arc;

use axum::{
    routing::{get, post, put},
    Router,
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::{state::AppState, streams::manager::StreamManager};

/// Build the full Axum router.
pub fn router(state: Arc<AppState>, stream_manager: Arc<StreamManager>) -> Router {
    Router::new()
        // Swagger UI
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", openapi::ApiDoc::openapi()))
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
        .route("/api/streams/:id/snapshot", get(routes::snapshot))
        .route("/api/streams/:id/live", get(routes::stream_live))
        // Stream rules
        .route(
            "/api/streams/:id/rules",
            get(routes::list_rules).post(routes::create_rule),
        )
        .route(
            "/api/streams/:id/rules/:rule_id",
            put(routes::update_rule).delete(routes::delete_rule),
        )
        // Assistant
        .route("/api/assistant/chat", post(routes::assistant_chat))
        // Events
        .route("/api/events", get(routes::list_events))
        .route("/api/events/:id", get(routes::get_event).put(routes::update_event))
        .route("/api/test-twilio", post(routes::test_twilio_alert))
        // Blueprints and cameras
        .route(
            "/api/blueprints",
            get(routes::list_blueprints).post(routes::create_blueprint),
        )
        .route(
            "/api/blueprints/:id",
            get(routes::get_blueprint)
                .put(routes::update_blueprint)
                .delete(routes::delete_blueprint),
        )
        // WebSocket
        .route("/ws/events", get(ws::ws_handler))
        // Shared state
        .with_state(state)
        .layer(axum::extract::Extension(stream_manager))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
}
