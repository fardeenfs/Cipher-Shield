use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::{IntoParams, ToSchema};
use uuid::Uuid;

/// Mirrors the `streams` table. Stream = camera; belongs to at most one blueprint (blueprint_id).
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct Stream {
    pub id: Uuid,
    pub name: String,
    pub source_type: String,
    pub source_url: String,
    pub capture_interval_sec: i32,
    pub enabled: bool,
    pub position_x: f64,
    pub position_y: f64,
    pub rotation: f64,
    pub phone_number: Option<String>,
    /// Blueprint this stream is placed on (one stream → one blueprint).
    pub blueprint_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Payload for creating a new stream via the REST API.
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateStreamRequest {
    pub name: String,
    pub source_type: String,
    pub source_url: String,
    #[serde(default = "default_interval")]
    pub capture_interval_sec: i32,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    /// Optional blueprint to bind this stream to.
    pub blueprint_id: Option<Uuid>,
}

fn default_interval() -> i32 { 5 }
fn default_enabled() -> bool { true }

/// Query params for listing streams (e.g. filter by blueprint).
#[derive(Debug, Deserialize, IntoParams)]
pub struct StreamQuery {
    pub blueprint_id: Option<Uuid>,
}

/// Payload for updating an existing stream.
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateStreamRequest {
    pub name: Option<String>,
    pub source_type: Option<String>,
    pub source_url: Option<String>,
    pub capture_interval_sec: Option<i32>,
    pub enabled: Option<bool>,
    pub position_x: Option<f64>,
    pub position_y: Option<f64>,
    pub rotation: Option<f64>,
    pub phone_number: Option<String>,
    /// Set to null in JSON to unbind from blueprint; omit to leave unchanged.
    pub blueprint_id: Option<Option<Uuid>>,
}

/// Mirrors the `analysis_events` table.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct AnalysisEvent {
    pub id: Uuid,
    pub stream_id: Uuid,
    pub captured_at: DateTime<Utc>,
    pub description: String,
    pub events: Value,
    pub risk_level: String,
    /// The custom rule description that caused this risk level, or None if the
    /// VLM used its own judgment.
    pub triggered_rule: Option<String>,
    pub raw_response: Option<String>,
    pub title: Option<String>,
    pub frame: Option<Vec<u8>>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Payload for updating an event (e.g. resolve threat).
#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateEventRequest {
    pub status: String,
}

/// Query filters for listing analysis events.
#[derive(Debug, Deserialize, IntoParams)]
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

// ─── Stream Rules ─────────────────────────────────────────────────────────────

/// A per-stream rule the VLM uses to assign threat levels.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct StreamRule {
    pub id: Uuid,
    pub stream_id: Uuid,
    /// Human-readable description, e.g. "Person climbing the fence".
    pub description: String,
    /// "none" | "low" | "medium" | "high"
    pub threat_level: String,
    /// Display / prompt ordering (lower = earlier).
    pub position: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateRuleRequest {
    pub description: String,
    /// "none" | "low" | "medium" | "high"
    pub threat_level: String,
    #[serde(default)]
    pub position: i32,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateRuleRequest {
    pub description: Option<String>,
    pub threat_level: Option<String>,
    pub position: Option<i32>,
}

// ─── Blueprints (floor plan image + cameras) ─────────────────────────────────

/// Full blueprint with image data (for GET one).
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct Blueprint {
    pub id: Uuid,
    pub name: String,
    pub image_data: Option<Vec<u8>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Blueprint as returned by API (image as base64 string).
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BlueprintResponse {
    pub id: Uuid,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_base64: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Blueprint without image (for list).
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct BlueprintSummary {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateBlueprintRequest {
    #[serde(default)]
    pub name: Option<String>,
    /// Base64-encoded image (optional).
    pub image_base64: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateBlueprintRequest {
    pub name: Option<String>,
    pub image_base64: Option<String>,
}
