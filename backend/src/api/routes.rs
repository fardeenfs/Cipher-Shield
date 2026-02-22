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

use base64::{engine::general_purpose::STANDARD as B64, Engine};

use crate::{
    error::{AppError, Result},
    state::AppState,
    storage::{
        db,
        models::{
            BlueprintResponse, CreateBlueprintRequest,
            CreateRuleRequest, CreateStreamRequest, EventQuery, StreamQuery,
            UpdateBlueprintRequest, UpdateEventRequest, UpdateRuleRequest, UpdateStreamRequest,
        },
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
    params(StreamQuery),
    responses(
        (status = 200, description = "List of streams (optionally filter by blueprint_id)", body = Vec<Stream>)
    )
)]
pub async fn list_streams(
    State(state): State<Arc<AppState>>,
    Query(query): Query<StreamQuery>,
) -> Result<impl IntoResponse> {
    let streams = db::list_streams(&state.db, query.blueprint_id).await?;
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
    axum::extract::Extension(manager): axum::extract::Extension<Arc<StreamManager>>,
    Json(req): Json<CreateStreamRequest>,
) -> Result<impl IntoResponse> {
    if let Some(bid) = req.blueprint_id {
        let _ = db::get_blueprint(&state.db, bid).await?;
    }
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
    if let Some(Some(bid)) = req.blueprint_id {
        let _ = db::get_blueprint(&state.db, bid).await?;
    }
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

#[utoipa::path(
    put,
    path = "/api/events/{id}",
    tag = "events",
    params(("id" = Uuid, Path, description = "Event ID")),
    request_body = UpdateEventRequest,
    responses(
        (status = 200, description = "Event updated", body = AnalysisEvent),
        (status = 404, description = "Event not found")
    )
)]
pub async fn update_event(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateEventRequest>,
) -> Result<impl IntoResponse> {
    let event = db::update_event_status(&state.db, id, &req.status).await?;
    Ok(Json(event))
}

// ─── Test Twilio alert (for development) ─────────────────────────────────────

#[utoipa::path(
    post,
    path = "/api/test-twilio",
    tag = "notifications",
    responses(
        (status = 200, description = "Test SMS triggered",
         body = serde_json::Value,
         example = json!({"message": "Test alert triggered. Check ALERT_PHONE_NUMBER for SMS (and backend logs if none)."}))
    )
)]
/// Sends one test SMS via Twilio. Use to verify Twilio env vars and ALERT_PHONE_NUMBER.
pub async fn test_twilio_alert() -> impl IntoResponse {
    tokio::spawn(crate::notifications::twilio::send_alert(
        "test-stream",
        "high",
        "This is a test alert from Cipher-Shield.",
    ));
    Json(serde_json::json!({
        "message": "Test alert triggered. Check ALERT_PHONE_NUMBER for SMS (and backend logs if none)."
    }))
}

// ─── Blueprints ───────────────────────────────────────────────────────────────

#[utoipa::path(
    get,
    path = "/api/blueprints",
    tag = "blueprints",
    responses(
        (status = 200, description = "List of blueprints (no image data)", body = Vec<BlueprintSummary>)
    )
)]
pub async fn list_blueprints(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse> {
    let list = db::list_blueprints(&state.db).await?;
    Ok(Json(list))
}

#[utoipa::path(
    get,
    path = "/api/blueprints/{id}",
    tag = "blueprints",
    params(("id" = Uuid, Path, description = "Blueprint ID")),
    responses(
        (status = 200, description = "Blueprint with image as base64", body = BlueprintResponse),
        (status = 404, description = "Blueprint not found")
    )
)]
pub async fn get_blueprint(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let bp = db::get_blueprint(&state.db, id).await?;
    let image_base64 = bp
        .image_data
        .as_ref()
        .map(|b| B64.encode(b));
    let resp = BlueprintResponse {
        id: bp.id,
        name: bp.name,
        image_base64,
        created_at: bp.created_at,
        updated_at: bp.updated_at,
    };
    Ok(Json(resp))
}

#[utoipa::path(
    post,
    path = "/api/blueprints",
    tag = "blueprints",
    request_body = CreateBlueprintRequest,
    responses(
        (status = 201, description = "Blueprint created", body = BlueprintResponse),
        (status = 400, description = "Invalid request (e.g. invalid base64)")
    )
)]
pub async fn create_blueprint(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateBlueprintRequest>,
) -> Result<impl IntoResponse> {
    let name = req.name.unwrap_or_else(|| "Blueprint".into());
    let image_data = match &req.image_base64 {
        Some(s) if !s.is_empty() => {
            let bytes = B64.decode(s.as_bytes())
                .map_err(|_| AppError::BadRequest("invalid image_base64".into()))?;
            Some(bytes)
        }
        _ => None,
    };
    let bp = db::create_blueprint(
        &state.db,
        &name,
        image_data.as_deref(),
    ).await?;
    let image_base64 = bp.image_data.as_ref().map(|b| B64.encode(b));
    let resp = BlueprintResponse {
        id: bp.id,
        name: bp.name,
        image_base64,
        created_at: bp.created_at,
        updated_at: bp.updated_at,
    };
    Ok((StatusCode::CREATED, Json(resp)))
}

#[utoipa::path(
    put,
    path = "/api/blueprints/{id}",
    tag = "blueprints",
    params(("id" = Uuid, Path, description = "Blueprint ID")),
    request_body = UpdateBlueprintRequest,
    responses(
        (status = 200, description = "Blueprint updated", body = BlueprintResponse),
        (status = 400, description = "Invalid request"),
        (status = 404, description = "Blueprint not found")
    )
)]
pub async fn update_blueprint(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateBlueprintRequest>,
) -> Result<impl IntoResponse> {
    let image_data = match &req.image_base64 {
        Some(s) if !s.is_empty() => {
            let bytes = B64.decode(s.as_bytes())
                .map_err(|_| AppError::BadRequest("invalid image_base64".into()))?;
            Some(bytes)
        }
        Some(_) => None,
        None => None,
    };
    let bp = db::update_blueprint(
        &state.db,
        id,
        req.name.as_deref(),
        image_data.as_ref().map(|v| v.as_slice()),
    ).await?;
    let image_base64 = bp.image_data.as_ref().map(|b| B64.encode(b));
    let resp = BlueprintResponse {
        id: bp.id,
        name: bp.name,
        image_base64,
        created_at: bp.created_at,
        updated_at: bp.updated_at,
    };
    Ok(Json(resp))
}

#[utoipa::path(
    delete,
    path = "/api/blueprints/{id}",
    tag = "blueprints",
    params(("id" = Uuid, Path, description = "Blueprint ID")),
    responses(
        (status = 204, description = "Blueprint deleted"),
        (status = 404, description = "Blueprint not found")
    )
)]
pub async fn delete_blueprint(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    db::delete_blueprint(&state.db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ─── Stream Rules ─────────────────────────────────────────────────────────────

#[utoipa::path(
    get,
    path = "/api/streams/{id}/rules",
    tag = "rules",
    params(("id" = Uuid, Path, description = "Stream ID")),
    responses(
        (status = 200, description = "Rules for the stream", body = Vec<StreamRule>)
    )
)]
pub async fn list_rules(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let rules = db::list_rules(&state.db, id).await?;
    Ok(Json(rules))
}

#[utoipa::path(
    post,
    path = "/api/streams/{id}/rules",
    tag = "rules",
    params(("id" = Uuid, Path, description = "Stream ID")),
    request_body = CreateRuleRequest,
    responses(
        (status = 201, description = "Rule created", body = StreamRule),
        (status = 404, description = "Stream not found")
    )
)]
pub async fn create_rule(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<CreateRuleRequest>,
) -> Result<impl IntoResponse> {
    // Ensure the stream exists first.
    db::get_stream(&state.db, id).await?;
    let rule = db::create_rule(&state.db, id, &req).await?;
    Ok((StatusCode::CREATED, Json(rule)))
}

#[utoipa::path(
    put,
    path = "/api/streams/{id}/rules/{rule_id}",
    tag = "rules",
    params(
        ("id" = Uuid, Path, description = "Stream ID"),
        ("rule_id" = Uuid, Path, description = "Rule ID"),
    ),
    request_body = UpdateRuleRequest,
    responses(
        (status = 200, description = "Rule updated", body = StreamRule),
        (status = 404, description = "Rule not found")
    )
)]
pub async fn update_rule(
    State(state): State<Arc<AppState>>,
    Path((id, rule_id)): Path<(Uuid, Uuid)>,
    Json(req): Json<UpdateRuleRequest>,
) -> Result<impl IntoResponse> {
    let rule = db::update_rule(&state.db, rule_id, id, &req).await?;
    Ok(Json(rule))
}

#[utoipa::path(
    delete,
    path = "/api/streams/{id}/rules/{rule_id}",
    tag = "rules",
    params(
        ("id" = Uuid, Path, description = "Stream ID"),
        ("rule_id" = Uuid, Path, description = "Rule ID"),
    ),
    responses(
        (status = 204, description = "Rule deleted"),
        (status = 404, description = "Rule not found")
    )
)]
pub async fn delete_rule(
    State(state): State<Arc<AppState>>,
    Path((id, rule_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse> {
    db::delete_rule(&state.db, rule_id, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
