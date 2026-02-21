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
        models::{AnalysisEvent, CreateStreamRequest, EventQuery, Stream, UpdateStreamRequest},
    },
    streams::manager::{StreamManager, StreamRecord},
};

// ─── Health ───────────────────────────────────────────────────────────────────

#[utoipa::path(
    get,
    path = "/api/health",
    tag = "health",
    responses(
        (status = 200, description = "Service is healthy", body = serde_json::Value,
         example = json!({"status": "ok"}))
    )
)]
pub async fn health() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

// ─── Streams ──────────────────────────────────────────────────────────────────

#[utoipa::path(
    get,
    path = "/api/streams",
    tag = "streams",
    responses(
        (status = 200, description = "List of all streams", body = Vec<Stream>)
    )
)]
pub async fn list_streams(State(state): State<Arc<AppState>>) -> Result<impl IntoResponse> {
    let streams = db::list_streams(&state.db).await?;
    Ok(Json(streams))
}

#[utoipa::path(
    get,
    path = "/api/streams/{id}",
    tag = "streams",
    params(("id" = Uuid, Path, description = "Stream ID")),
    responses(
        (status = 200, description = "Stream found", body = Stream),
        (status = 404, description = "Stream not found")
    )
)]
pub async fn get_stream(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let stream = db::get_stream(&state.db, id).await?;
    Ok(Json(stream))
}

#[utoipa::path(
    post,
    path = "/api/streams",
    tag = "streams",
    request_body = CreateStreamRequest,
    responses(
        (status = 201, description = "Stream created", body = Stream),
        (status = 400, description = "Invalid request body")
    )
)]
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

#[utoipa::path(
    put,
    path = "/api/streams/{id}",
    tag = "streams",
    params(("id" = Uuid, Path, description = "Stream ID")),
    request_body = UpdateStreamRequest,
    responses(
        (status = 200, description = "Stream updated", body = Stream),
        (status = 404, description = "Stream not found")
    )
)]
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

#[utoipa::path(
    delete,
    path = "/api/streams/{id}",
    tag = "streams",
    params(("id" = Uuid, Path, description = "Stream ID")),
    responses(
        (status = 204, description = "Stream deleted"),
        (status = 404, description = "Stream not found")
    )
)]
pub async fn delete_stream(
    State(state): State<Arc<AppState>>,
    axum::extract::Extension(manager): axum::extract::Extension<Arc<StreamManager>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    manager.stop_stream(id).await;
    db::delete_stream(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    post,
    path = "/api/streams/{id}/enable",
    tag = "streams",
    params(("id" = Uuid, Path, description = "Stream ID")),
    responses(
        (status = 200, description = "Stream enabled", body = Stream),
        (status = 404, description = "Stream not found")
    )
)]
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

#[utoipa::path(
    post,
    path = "/api/streams/{id}/disable",
    tag = "streams",
    params(("id" = Uuid, Path, description = "Stream ID")),
    responses(
        (status = 200, description = "Stream disabled", body = Stream),
        (status = 404, description = "Stream not found")
    )
)]
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

#[utoipa::path(
    get,
    path = "/api/streams/{id}/snapshot",
    tag = "streams",
    params(("id" = Uuid, Path, description = "Stream ID")),
    responses(
        (status = 200, description = "Latest JPEG frame", content_type = "image/jpeg"),
        (status = 404, description = "No frame captured yet")
    )
)]
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

#[utoipa::path(
    get,
    path = "/api/streams/{id}/live",
    tag = "streams",
    params(("id" = Uuid, Path, description = "Stream ID")),
    responses(
        (status = 200, description = "Live MJPEG stream (multipart/x-mixed-replace)",
         content_type = "multipart/x-mixed-replace")
    )
)]
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

#[utoipa::path(
    get,
    path = "/api/events",
    tag = "events",
    params(EventQuery),
    responses(
        (status = 200, description = "List of analysis events", body = Vec<AnalysisEvent>)
    )
)]
pub async fn list_events(
    State(state): State<Arc<AppState>>,
    Query(query): Query<EventQuery>,
) -> Result<impl IntoResponse> {
    let events = db::list_events(&state.db, &query).await?;
    Ok(Json(events))
}

#[utoipa::path(
    get,
    path = "/api/events/{id}",
    tag = "events",
    params(("id" = Uuid, Path, description = "Event ID")),
    responses(
        (status = 200, description = "Analysis event found", body = AnalysisEvent),
        (status = 404, description = "Event not found")
    )
)]
pub async fn get_event(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let event = db::get_event(&state.db, id).await?;
    Ok(Json(event))
}
