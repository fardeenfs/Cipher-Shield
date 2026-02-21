use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

/// Mirrors the `streams` table.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Stream {
    pub id: Uuid,
    pub name: String,
    pub source_type: String,
    pub source_url: String,
    pub capture_interval_sec: i32,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Payload for creating a new stream via the REST API.
#[derive(Debug, Deserialize)]
pub struct CreateStreamRequest {
    pub name: String,
    pub source_type: String,
    pub source_url: String,
    #[serde(default = "default_interval")]
    pub capture_interval_sec: i32,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_interval() -> i32 { 5 }
fn default_enabled() -> bool { true }

/// Payload for updating an existing stream.
#[derive(Debug, Deserialize)]
pub struct UpdateStreamRequest {
    pub name: Option<String>,
    pub source_type: Option<String>,
    pub source_url: Option<String>,
    pub capture_interval_sec: Option<i32>,
    pub enabled: Option<bool>,
}

/// Mirrors the `analysis_events` table.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AnalysisEvent {
    pub id: Uuid,
    pub stream_id: Uuid,
    pub captured_at: DateTime<Utc>,
    pub description: String,
    pub events: Value,
    pub risk_level: String,
    pub raw_response: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Query filters for listing analysis events.
#[derive(Debug, Deserialize)]
pub struct EventQuery {
    pub stream_id: Option<Uuid>,
    pub risk_level: Option<String>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
}

fn default_limit() -> i64 { 50 }
