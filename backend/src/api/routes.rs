use std::sync::Arc;

use axum::{
    body::Body,
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use bytes::Bytes;
use futures::StreamExt;
use tokio_stream::wrappers::BroadcastStream;
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
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

// ─── Live frame endpoints ─────────────────────────────────────────────────────

/// Returns the most recently captured JPEG frame for a stream.
pub async fn snapshot(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let frame = state
        .frame_store
        .get_latest(id)
        .await
        .ok_or_else(|| AppError::NotFound("No frame captured yet".into()))?;

    Ok(([(header::CONTENT_TYPE, "image/jpeg")], frame))
}

/// Streams live MJPEG frames for a stream.
/// Use as `<img src="/api/streams/:id/live">` — browsers handle MJPEG natively.
pub async fn stream_live(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let rx = state.frame_store.subscribe(id).await;

    let frame_stream = BroadcastStream::new(rx).filter_map(|result| async move {
        let frame: std::sync::Arc<Vec<u8>> = result.ok()?;
        let header = format!(
            "--frame\r\nContent-Type: image/jpeg\r\nContent-Length: {}\r\n\r\n",
            frame.len()
        );
        let mut part = header.into_bytes();
        part.extend_from_slice(&frame);
        part.extend_from_slice(b"\r\n");
        Some(Ok::<Bytes, std::convert::Infallible>(Bytes::from(part)))
    });

    Response::builder()
        .header(header::CONTENT_TYPE, "multipart/x-mixed-replace; boundary=frame")
        .header(header::CACHE_CONTROL, "no-cache")
        .body(Body::from_stream(frame_stream))
        .unwrap()
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
