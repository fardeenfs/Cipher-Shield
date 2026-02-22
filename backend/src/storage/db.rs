use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    storage::models::{
        AnalysisEvent, Blueprint, BlueprintSummary, CreateRuleRequest,
        CreateStreamRequest, EventQuery, Stream, StreamRule, UpdateRuleRequest,
        UpdateStreamRequest,
    },
};

// ─── Streams ──────────────────────────────────────────────────────────────────

pub async fn list_streams(db: &PgPool, blueprint_id: Option<Uuid>) -> Result<Vec<Stream>> {
    let rows = if let Some(bid) = blueprint_id {
        sqlx::query_as!(
            Stream,
            r#"SELECT id, name, source_type, source_url, capture_interval_sec,
                      enabled, position_x, position_y, rotation, phone_number,
                      blueprint_id, created_at, updated_at
               FROM streams
               WHERE blueprint_id = $1
               ORDER BY created_at ASC"#,
            bid
        )
    } else {
        sqlx::query_as!(
            Stream,
            r#"SELECT id, name, source_type, source_url, capture_interval_sec,
                      enabled, position_x, position_y, rotation, phone_number,
                      blueprint_id, created_at, updated_at
               FROM streams
               ORDER BY created_at ASC"#
        )
    }
    .fetch_all(db)
    .await?;
    Ok(rows)
}

pub async fn get_stream(db: &PgPool, id: Uuid) -> Result<Stream> {
    sqlx::query_as!(
        Stream,
        r#"SELECT id, name, source_type, source_url, capture_interval_sec,
                  enabled, position_x, position_y, rotation, phone_number,
                  blueprint_id, created_at, updated_at
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
        r#"INSERT INTO streams (name, source_type, source_url, capture_interval_sec, enabled, blueprint_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, name, source_type, source_url, capture_interval_sec,
                     enabled, position_x, position_y, rotation, phone_number,
                     blueprint_id, created_at, updated_at"#,
        req.name,
        req.source_type,
        req.source_url,
        req.capture_interval_sec,
        req.enabled,
        req.blueprint_id,
    )
    .fetch_one(db)
    .await?;
    Ok(row)
}

pub async fn update_stream(db: &PgPool, id: Uuid, req: &UpdateStreamRequest) -> Result<Stream> {
    let current = get_stream(db, id).await?;
    let blueprint_id = match req.blueprint_id {
        None => current.blueprint_id,
        Some(opt) => opt,
    };

    let row = sqlx::query_as!(
        Stream,
        r#"UPDATE streams
           SET name                 = $2,
               source_type          = $3,
               source_url           = $4,
               capture_interval_sec = $5,
               enabled              = $6,
               position_x           = $7,
               position_y           = $8,
               rotation             = $9,
               phone_number         = $10,
               blueprint_id         = $11,
               updated_at           = NOW()
           WHERE id = $1
           RETURNING id, name, source_type, source_url, capture_interval_sec,
                     enabled, position_x, position_y, rotation, phone_number,
                     blueprint_id, created_at, updated_at"#,
        id,
        req.name.as_deref().unwrap_or(&current.name),
        req.source_type.as_deref().unwrap_or(&current.source_type),
        req.source_url.as_deref().unwrap_or(&current.source_url),
        req.capture_interval_sec.unwrap_or(current.capture_interval_sec),
        req.enabled.unwrap_or(current.enabled),
        req.position_x.unwrap_or(current.position_x),
        req.position_y.unwrap_or(current.position_y),
        req.rotation.unwrap_or(current.rotation),
        match &req.phone_number {
            None => current.phone_number.clone(),
            Some(s) if s.is_empty() => None,
            Some(s) => Some(s.clone()),
        },
        blueprint_id,
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
                     enabled, position_x, position_y, rotation, phone_number,
                     blueprint_id, created_at, updated_at"#,
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

// ─── Stream Rules ─────────────────────────────────────────────────────────────

pub async fn list_rules(db: &PgPool, stream_id: Uuid) -> Result<Vec<StreamRule>> {
    let rows = sqlx::query_as!(
        StreamRule,
        r#"SELECT id, stream_id, description, threat_level, position, created_at, updated_at
           FROM stream_rules
           WHERE stream_id = $1
           ORDER BY position ASC, created_at ASC"#,
        stream_id
    )
    .fetch_all(db)
    .await?;
    Ok(rows)
}

pub async fn create_rule(
    db: &PgPool,
    stream_id: Uuid,
    req: &CreateRuleRequest,
) -> Result<StreamRule> {
    let row = sqlx::query_as!(
        StreamRule,
        r#"INSERT INTO stream_rules (stream_id, description, threat_level, position)
           VALUES ($1, $2, $3, $4)
           RETURNING id, stream_id, description, threat_level, position, created_at, updated_at"#,
        stream_id,
        req.description,
        req.threat_level,
        req.position,
    )
    .fetch_one(db)
    .await?;
    Ok(row)
}

pub async fn update_rule(
    db: &PgPool,
    rule_id: Uuid,
    stream_id: Uuid,
    req: &UpdateRuleRequest,
) -> Result<StreamRule> {
    let current = sqlx::query_as!(
        StreamRule,
        r#"SELECT id, stream_id, description, threat_level, position, created_at, updated_at
           FROM stream_rules WHERE id = $1 AND stream_id = $2"#,
        rule_id,
        stream_id,
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Rule {rule_id} not found")))?;

    let row = sqlx::query_as!(
        StreamRule,
        r#"UPDATE stream_rules
           SET description  = $3,
               threat_level = $4,
               position     = $5,
               updated_at   = NOW()
           WHERE id = $1 AND stream_id = $2
           RETURNING id, stream_id, description, threat_level, position, created_at, updated_at"#,
        rule_id,
        stream_id,
        req.description.as_deref().unwrap_or(&current.description),
        req.threat_level.as_deref().unwrap_or(&current.threat_level),
        req.position.unwrap_or(current.position),
    )
    .fetch_one(db)
    .await?;
    Ok(row)
}

pub async fn delete_rule(db: &PgPool, rule_id: Uuid, stream_id: Uuid) -> Result<()> {
    let result = sqlx::query!(
        "DELETE FROM stream_rules WHERE id = $1 AND stream_id = $2",
        rule_id,
        stream_id,
    )
    .execute(db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Rule {rule_id} not found")));
    }
    Ok(())
}

// ─── Blueprints ──────────────────────────────────────────────────────────────

pub async fn list_blueprints(db: &PgPool) -> Result<Vec<BlueprintSummary>> {
    let rows = sqlx::query_as!(
        BlueprintSummary,
        r#"SELECT id, name, created_at, updated_at FROM blueprints ORDER BY created_at ASC"#
    )
    .fetch_all(db)
    .await?;
    Ok(rows)
}

pub async fn get_blueprint(db: &PgPool, id: Uuid) -> Result<Blueprint> {
    sqlx::query_as!(
        Blueprint,
        r#"SELECT id, name, image_data, created_at, updated_at FROM blueprints WHERE id = $1"#,
        id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Blueprint {id} not found")))
}

pub async fn create_blueprint(
    db: &PgPool,
    name: &str,
    image_data: Option<&[u8]>,
) -> Result<Blueprint> {
    let row = sqlx::query_as!(
        Blueprint,
        r#"INSERT INTO blueprints (name, image_data) VALUES ($1, $2)
           RETURNING id, name, image_data, created_at, updated_at"#,
        name,
        image_data,
    )
    .fetch_one(db)
    .await?;
    Ok(row)
}

pub async fn update_blueprint(
    db: &PgPool,
    id: Uuid,
    name: Option<&str>,
    image_data: Option<&[u8]>,
) -> Result<Blueprint> {
    let current = get_blueprint(db, id).await?;
    let name = name.unwrap_or(&current.name);
    let image_data = match image_data {
        Some(b) => Some(b),
        None => current.image_data.as_deref(),
    };
    let row = sqlx::query_as!(
        Blueprint,
        r#"UPDATE blueprints SET name = $2, image_data = $3, updated_at = NOW()
           WHERE id = $1 RETURNING id, name, image_data, created_at, updated_at"#,
        id,
        name,
        image_data,
    )
    .fetch_one(db)
    .await?;
    Ok(row)
}

pub async fn delete_blueprint(db: &PgPool, id: Uuid) -> Result<()> {
    let result: sqlx::postgres::PgQueryResult =
        sqlx::query!("DELETE FROM blueprints WHERE id = $1", id)
            .execute(db)
            .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Blueprint {id} not found")));
    }
    Ok(())
}
