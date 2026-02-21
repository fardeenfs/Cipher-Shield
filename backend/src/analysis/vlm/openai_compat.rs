/// OpenAI-compatible `/v1/chat/completions` client with vision support.
///
/// Works with:
/// • HuggingFace Text Generation Inference (TGI) – set base_url to
///   `https://api-inference.huggingface.co/v1` and model to e.g.
///   `Qwen/Qwen2-VL-7B-Instruct`.
/// • OpenAI – set base_url to `https://api.openai.com/v1` and model to
///   `gpt-4o` or `gpt-4-turbo`.
/// • Any other /v1/chat/completions provider.
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::Deserialize;
use serde_json::json;
use tracing::debug;

use crate::{
    config::OpenAiCompatConfig,
    error::{AppError, Result},
};

use super::{parse_or_fallback, AnalysisResult, SYSTEM_PROMPT};

pub struct OpenAiCompatClient {
    client: reqwest::Client,
    base_url: String,
    api_key: String,
    model: String,
}

impl OpenAiCompatClient {
    pub fn new(cfg: &OpenAiCompatConfig) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: cfg.base_url.trim_end_matches('/').to_string(),
            api_key: cfg.api_key.clone(),
            model: cfg.model.clone(),
        }
    }
}

// ─── Request / Response types ─────────────────────────────────────────────────

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: AssistantMessage,
}

#[derive(Deserialize)]
struct AssistantMessage {
    content: String,
}

// ─── VlmClient impl ───────────────────────────────────────────────────────────

#[async_trait::async_trait]
impl super::VlmClient for OpenAiCompatClient {
    async fn analyze(&self, image_jpeg: &[u8], stream_name: &str) -> Result<AnalysisResult> {
        let b64 = B64.encode(image_jpeg);
        let data_uri = format!("data:image/jpeg;base64,{b64}");

        let body = json!({
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": { "url": data_uri }
                        },
                        {
                            "type": "text",
                            "text": format!(
                                "Analyze this security camera frame from '{stream_name}'. Respond with the required JSON."
                            )
                        }
                    ]
                }
            ],
            "max_tokens": 512,
            "stream": false
        });

        let url = format!("{}/chat/completions", self.base_url);
        debug!(model = %self.model, url = %url, "Calling OpenAI-compat API");

        let resp = self
            .client
            .post(&url)
            .bearer_auth(&self.api_key)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Vlm(format!("OpenAI-compat request failed: {e}")))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(AppError::Vlm(format!("OpenAI-compat HTTP {status}: {text}")));
        }

        let chat: ChatResponse = resp
            .json()
            .await
            .map_err(|e| AppError::Vlm(format!("Failed to deserialize chat response: {e}")))?;

        let content = chat
            .choices
            .into_iter()
            .next()
            .map(|c| c.message.content)
            .unwrap_or_default();

        debug!(raw = %content, "OpenAI-compat raw response");

        Ok(parse_or_fallback(&content))
    }
}
