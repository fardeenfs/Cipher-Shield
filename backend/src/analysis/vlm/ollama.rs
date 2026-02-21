use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::{Deserialize, Serialize};
use tracing::debug;

use crate::{
    config::OllamaConfig,
    error::{AppError, Result},
};

use super::{build_rules_prompt, parse_or_fallback, AnalysisResult, VlmRule, SYSTEM_PROMPT};

pub struct OllamaClient {
    client: reqwest::Client,
    base_url: String,
    model: String,
}

impl OllamaClient {
    pub fn new(cfg: &OllamaConfig) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: cfg.base_url.trim_end_matches('/').to_string(),
            model: cfg.model.clone(),
        }
    }
}

// ─── Ollama /api/generate request/response ───────────────────────────────────

#[derive(Serialize)]
struct GenerateRequest<'a> {
    model: &'a str,
    prompt: &'a str,
    system: &'a str,
    /// Base64-encoded images (no data URI prefix).
    images: Vec<String>,
    stream: bool,
}

#[derive(Deserialize)]
struct GenerateResponse {
    response: String,
}

// ─── VlmClient impl ───────────────────────────────────────────────────────────

#[async_trait::async_trait]
impl super::VlmClient for OllamaClient {
    async fn analyze(
        &self,
        image_jpeg: &[u8],
        stream_name: &str,
        rules: &[VlmRule],
    ) -> Result<AnalysisResult> {
        let b64 = B64.encode(image_jpeg);
        let prompt = format!(
            "Analyze this security camera frame from '{stream_name}'. Respond with the required JSON."
        );
        let system = format!("{SYSTEM_PROMPT}{}", build_rules_prompt(rules));

        let body = GenerateRequest {
            model: &self.model,
            prompt: &prompt,
            system: &system,
            images: vec![b64],
            stream: false,
        };

        let url = format!("{}/api/generate", self.base_url);
        debug!(model = %self.model, url = %url, "Calling Ollama");

        let resp = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Vlm(format!("Ollama request failed: {e}")))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(AppError::Vlm(format!("Ollama HTTP {status}: {text}")));
        }

        let gen: GenerateResponse = resp
            .json()
            .await
            .map_err(|e| AppError::Vlm(format!("Failed to deserialize Ollama response: {e}")))?;

        debug!(raw = %gen.response, "Ollama raw response");

        Ok(parse_or_fallback(&gen.response))
    }
}
