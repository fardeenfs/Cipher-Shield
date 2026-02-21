use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use uuid::Uuid;

use crate::{
    error::Result,
    state::AppState,
    storage::{
        db,
        models::{CreateStreamRequest, EventQuery, UpdateStreamRequest},
    },
    streams::manager::{StreamManager, StreamRecord},
};

// ─── Health ───────────────────────────────────────────────────────────────────

pub async fn health() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

// ─── Streams ──────────────────────────────────────────────────────────────────

pub async fn list_streams(State(state): State<Arc<AppState>>) -> Result<impl IntoResponse> {
    let streams = db::list_streams(&state.db).await?;
    Ok(Json(streams))
}

pub async fn get_stream(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let stream = db::get_stream(&state.db, id).await?;
    Ok(Json(stream))
}

pub async fn create_stream(
    State(state): State<Arc<AppState>>,
    // stream_manager is injected separately — see router
    axum::extract::Extension(manager): axum::extract::Extension<Arc<StreamManager>>,
    Json(req): Json<CreateStreamRequest>,
) -> Result<impl IntoResponse> {
    let stream = db::create_stream(&state.db, &req).await?;

    // Start capture task if enabled
    if stream.enabled {
        let record = StreamRecord {
            id: stream.id,
            name: stream.name.clone(),
            source_type: stream.source_type.clone(),
            source_url: stream.source_url.clone(),
            capture_interval_sec: stream.capture_interval_sec,
            enabled: stream.enabled,
        };
        manager.start_stream(record).await;
    }

    Ok((StatusCode::CREATED, Json(stream)))
}

pub async fn update_stream(
    State(state): State<Arc<AppState>>,
    axum::extract::Extension(manager): axum::extract::Extension<Arc<StreamManager>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateStreamRequest>,
) -> Result<impl IntoResponse> {
    let stream = db::update_stream(&state.db, id, &req).await?;

    // Restart capture task to apply new settings
    let record = StreamRecord {
        id: stream.id,
        name: stream.name.clone(),
        source_type: stream.source_type.clone(),
        source_url: stream.source_url.clone(),
        capture_interval_sec: stream.capture_interval_sec,
        enabled: stream.enabled,
    };
    manager.restart_stream(record).await;

    Ok(Json(stream))
}

pub async fn delete_stream(
    State(state): State<Arc<AppState>>,
    axum::extract::Extension(manager): axum::extract::Extension<Arc<StreamManager>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    manager.stop_stream(id).await;
    db::delete_stream(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn enable_stream(
    State(state): State<Arc<AppState>>,
    axum::extract::Extension(manager): axum::extract::Extension<Arc<StreamManager>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let stream = db::set_stream_enabled(&state.db, id, true).await?;
    let record = StreamRecord {
        id: stream.id,
        name: stream.name.clone(),
        source_type: stream.source_type.clone(),
        source_url: stream.source_url.clone(),
        capture_interval_sec: stream.capture_interval_sec,
        enabled: true,
    };
    manager.start_stream(record).await;
    Ok(Json(stream))
}

pub async fn disable_stream(
    State(state): State<Arc<AppState>>,
    axum::extract::Extension(manager): axum::extract::Extension<Arc<StreamManager>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let stream = db::set_stream_enabled(&state.db, id, false).await?;
    manager.stop_stream(id).await;
    Ok(Json(stream))
}

// ─── Events ───────────────────────────────────────────────────────────────────

pub async fn list_events(
    State(state): State<Arc<AppState>>,
    Query(query): Query<EventQuery>,
) -> Result<impl IntoResponse> {
    let events = db::list_events(&state.db, &query).await?;
    Ok(Json(events))
}

pub async fn get_event(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let event = db::get_event(&state.db, id).await?;
    Ok(Json(event))
}
