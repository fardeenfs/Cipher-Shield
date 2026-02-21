pub mod ollama;
pub mod openai_compat;

use std::sync::Arc;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::{
    config::VlmBackend,
    error::Result,
};

// ─── Analysis result types ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub description: String,
    pub events: Vec<DetectedEvent>,
    pub risk_level: RiskLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedEvent {
    pub event_type: String,
    #[serde(default)]
    pub details: Option<String>,
    /// 0.0 – 1.0
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    None,
    Low,
    Medium,
    High,
}

impl Default for RiskLevel {
    fn default() -> Self {
        Self::None
    }
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

/// System prompt sent to the VLM before the image.
pub const SYSTEM_PROMPT: &str = r#"You are a security camera analysis AI.
Analyze the provided camera frame and respond ONLY with a valid JSON object using this exact schema:

{
  "description": "Brief natural language description of the scene",
  "events": [
    {
      "event_type": "one of: person_detected, vehicle_detected, crowd_detected, fire_detected, smoke_detected, unusual_activity, empty_scene, animal_detected, package_left",
      "details": "optional string with additional details, or null",
      "confidence": 0.95
    }
  ],
  "risk_level": "one of: none, low, medium, high"
}

Return ONLY the JSON object. Do not include any other text, markdown, or explanation."#;

// ─── Per-stream rules ─────────────────────────────────────────────────────────

/// A lightweight rule passed to the VLM to customise its threat-level decision.
/// Constructed from `storage::models::StreamRule` by the analysis worker.
pub struct VlmRule {
    pub description: String,
    /// "none" | "low" | "medium" | "high"
    pub threat_level: String,
}

/// Builds the rules addendum that is appended to the base system prompt.
/// Returns an empty string when there are no rules.
pub fn build_rules_prompt(rules: &[VlmRule]) -> String {
    if rules.is_empty() {
        return String::new();
    }

    let mut out = String::from(
        "\n\nCustom threat assessment rules for this camera \
         (apply these strictly when setting risk_level — they override your default judgment):\n",
    );
    for rule in rules {
        out.push_str(&format!("- {}: {}\n", rule.threat_level.to_uppercase(), rule.description));
    }
    out.push_str(
        "\nIf a rule matches what you see, use its threat level. \
         If multiple rules match, use the highest level.",
    );
    out
}

// ─── Trait ────────────────────────────────────────────────────────────────────

#[async_trait]
pub trait VlmClient: Send + Sync {
    /// Analyze a JPEG image and return structured results.
    async fn analyze(
        &self,
        image_jpeg: &[u8],
        stream_name: &str,
        rules: &[VlmRule],
    ) -> Result<AnalysisResult>;
}

pub type DynVlmClient = Arc<dyn VlmClient>;

// ─── Factory ──────────────────────────────────────────────────────────────────

pub fn build_vlm_client(cfg: &VlmBackend) -> DynVlmClient {
    match cfg {
        VlmBackend::Ollama(c) => Arc::new(ollama::OllamaClient::new(c)),
        VlmBackend::OpenAiCompat(c) => Arc::new(openai_compat::OpenAiCompatClient::new(c)),
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Try to parse the VLM's raw text output as `AnalysisResult`.
/// Falls back to a minimal result with just the description if JSON is invalid.
pub fn parse_or_fallback(raw: &str) -> AnalysisResult {
    // Strip markdown code fences if the model wrapped the JSON
    let cleaned = raw
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    serde_json::from_str(cleaned).unwrap_or_else(|_| AnalysisResult {
        description: raw.to_string(),
        events: vec![],
        risk_level: RiskLevel::None,
    })
}
