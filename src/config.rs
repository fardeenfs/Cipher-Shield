use anyhow::{Context, Result};
use std::env;

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone)]
pub enum VlmBackend {
    Ollama(OllamaConfig),
    OpenAiCompat(OpenAiCompatConfig),
}

#[derive(Debug, Clone)]
pub struct OllamaConfig {
    pub base_url: String,
    pub model: String,
}

/// Works with HuggingFace TGI, OpenAI GPT-4o, or any /v1/chat/completions provider.
#[derive(Debug, Clone)]
pub struct OpenAiCompatConfig {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database_url: String,
    pub vlm: VlmBackend,
    pub analysis_workers: usize,
    pub frame_queue_size: usize,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let server = ServerConfig {
            host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8080".into())
                .parse()
                .context("SERVER_PORT must be a valid port number")?,
        };

        let database_url = env::var("DATABASE_URL").context("DATABASE_URL is required")?;

        let vlm_backend = env::var("VLM_BACKEND").unwrap_or_else(|_| "ollama".into());
        let vlm = match vlm_backend.as_str() {
            "ollama" => VlmBackend::Ollama(OllamaConfig {
                base_url: env::var("OLLAMA_BASE_URL")
                    .unwrap_or_else(|_| "http://localhost:11434".into()),
                model: env::var("OLLAMA_MODEL").unwrap_or_else(|_| "moondream".into()),
            }),
            "openai_compat" => VlmBackend::OpenAiCompat(OpenAiCompatConfig {
                base_url: env::var("OPENAI_COMPAT_BASE_URL")
                    .context("OPENAI_COMPAT_BASE_URL is required for openai_compat backend")?,
                api_key: env::var("OPENAI_COMPAT_API_KEY")
                    .context("OPENAI_COMPAT_API_KEY is required for openai_compat backend")?,
                model: env::var("OPENAI_COMPAT_MODEL")
                    .unwrap_or_else(|_| "Qwen/Qwen2-VL-7B-Instruct".into()),
            }),
            other => anyhow::bail!("Unknown VLM_BACKEND: '{}'. Use 'ollama' or 'openai_compat'.", other),
        };

        let analysis_workers = env::var("ANALYSIS_WORKERS")
            .unwrap_or_else(|_| "4".into())
            .parse()
            .context("ANALYSIS_WORKERS must be a positive integer")?;

        let frame_queue_size = env::var("FRAME_QUEUE_SIZE")
            .unwrap_or_else(|_| "64".into())
            .parse()
            .context("FRAME_QUEUE_SIZE must be a positive integer")?;

        Ok(AppConfig {
            server,
            database_url,
            vlm,
            analysis_workers,
            frame_queue_size,
        })
    }
}
