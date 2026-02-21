use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    storage::models::{AnalysisEvent, CreateStreamRequest, EventQuery, Stream, UpdateStreamRequest},
};

// ─── Streams ──────────────────────────────────────────────────────────────────

pub async fn list_streams(db: &PgPool) -> Result<Vec<Stream>> {
    let rows = sqlx::query_as!(
        Stream,
        r#"SELECT id, name, source_type, source_url, capture_interval_sec,
                  enabled, created_at, updated_at
           FROM streams
           ORDER BY created_at ASC"#
    )
    .fetch_all(db)
    .await?;
    Ok(rows)
}

pub async fn get_stream(db: &PgPool, id: Uuid) -> Result<Stream> {
    sqlx::query_as!(
        Stream,
        r#"SELECT id, name, source_type, source_url, capture_interval_sec,
                  enabled, created_at, updated_at
           FROM streams WHERE id = $1"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Stream {id} not found")))
}

pub async fn create_stream(db: &PgPool, req: &CreateStreamRequest) -> Result<Stream> {
    let row = sqlx::query_as!(
        Stream,
        r#"INSERT INTO streams (name, source_type, source_url, capture_interval_sec, enabled)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, source_type, source_url, capture_interval_sec,
                     enabled, created_at, updated_at"#,
        req.name,
        req.source_type,
        req.source_url,
        req.capture_interval_sec,
        req.enabled,
    )
    .fetch_one(db)
    .await?;
    Ok(row)
}

pub async fn update_stream(db: &PgPool, id: Uuid, req: &UpdateStreamRequest) -> Result<Stream> {
    // Fetch current values and apply patches
    let current = get_stream(db, id).await?;

    let row = sqlx::query_as!(
        Stream,
        r#"UPDATE streams
           SET name                 = $2,
               source_type          = $3,
               source_url           = $4,
               capture_interval_sec = $5,
               enabled              = $6,
               updated_at           = NOW()
           WHERE id = $1
           RETURNING id, name, source_type, source_url, capture_interval_sec,
                     enabled, created_at, updated_at"#,
        id,
        req.name.as_deref().unwrap_or(&current.name),
        req.source_type.as_deref().unwrap_or(&current.source_type),
        req.source_url.as_deref().unwrap_or(&current.source_url),
        req.capture_interval_sec.unwrap_or(current.capture_interval_sec),
        req.enabled.unwrap_or(current.enabled),
    )
    .fetch_one(db)
    .await?;

    Ok(row)
}

pub async fn delete_stream(db: &PgPool, id: Uuid) -> Result<()> {
    let result = sqlx::query!("DELETE FROM streams WHERE id = $1", id)
        .execute(db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Stream {id} not found")));
    }

    Ok(())
}

pub async fn set_stream_enabled(db: &PgPool, id: Uuid, enabled: bool) -> Result<Stream> {
    let row = sqlx::query_as!(
        Stream,
        r#"UPDATE streams SET enabled = $2, updated_at = NOW()
           WHERE id = $1
           RETURNING id, name, source_type, source_url, capture_interval_sec,
                     enabled, created_at, updated_at"#,
        id,
        enabled,
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Stream {id} not found")))?;

    Ok(row)
}

// ─── Analysis Events ──────────────────────────────────────────────────────────

pub async fn insert_event(
    db: &PgPool,
    id: Uuid,
    stream_id: Uuid,
    captured_at: DateTime<Utc>,
    description: &str,
    events: Value,
    risk_level: &str,
) -> Result<AnalysisEvent> {
    let row = sqlx::query_as!(
        AnalysisEvent,
        r#"INSERT INTO analysis_events
               (id, stream_id, captured_at, description, events, risk_level)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, stream_id, captured_at, description,
                     events, risk_level, raw_response, created_at"#,
        id,
        stream_id,
        captured_at,
        description,
        events,
        risk_level,
    )
    .fetch_one(db)
    .await?;

    Ok(row)
}

pub async fn list_events(db: &PgPool, query: &EventQuery) -> Result<Vec<AnalysisEvent>> {
    // Build the query dynamically based on which filters are set.
    // sqlx doesn't support fully dynamic queries with query_as!, so we use
    // QueryBuilder for optional filters.
    let mut qb = sqlx::QueryBuilder::new(
        "SELECT id, stream_id, captured_at, description, events, risk_level, raw_response, created_at FROM analysis_events WHERE 1=1",
    );

    if let Some(sid) = query.stream_id {
        qb.push(" AND stream_id = ").push_bind(sid);
    }
    if let Some(ref rl) = query.risk_level {
        qb.push(" AND risk_level = ").push_bind(rl.as_str());
    }
    if let Some(from) = query.from {
        qb.push(" AND captured_at >= ").push_bind(from);
    }
    if let Some(to) = query.to {
        qb.push(" AND captured_at <= ").push_bind(to);
    }

    qb.push(" ORDER BY captured_at DESC")
        .push(" LIMIT ")
        .push_bind(query.limit)
        .push(" OFFSET ")
        .push_bind(query.offset);

    let rows = qb
        .build_query_as::<AnalysisEvent>()
        .fetch_all(db)
        .await?;

    Ok(rows)
}

pub async fn get_event(db: &PgPool, id: Uuid) -> Result<AnalysisEvent> {
    sqlx::query_as!(
        AnalysisEvent,
        r#"SELECT id, stream_id, captured_at, description,
                  events, risk_level, raw_response, created_at
           FROM analysis_events WHERE id = $1"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Event {id} not found")))
}
