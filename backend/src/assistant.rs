//! AI assistant with Ollama tool calling. Handles arbitrary time ranges and questions.

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{error::Result, storage::{db, models::EventQuery}};

const TOOLS: &str = r#"[
  {"type":"function","function":{"name":"list_events","description":"List security events. Use for any question about what happened, threats, summaries, counts.","parameters":{"type":"object","properties":{"from":{"type":"string","description":"Start date ISO8601 e.g. 2024-01-01 or 2024-01-01T00:00:00Z"}, "to":{"type":"string","description":"End date ISO8601"}, "stream_id":{"type":"string","description":"Stream UUID filter"}, "risk_level":{"type":"string","description":"none|low|medium|high"}, "limit":{"type":"integer","description":"Max events, default 1000"}}}}},
  {"type":"function","function":{"name":"list_streams","description":"List camera streams.","parameters":{"type":"object","properties":{}}}},
  {"type":"function","function":{"name":"resolve_events","description":"Mark unresolved events as resolved.","parameters":{"type":"object","properties":{"from":{"type":"string"}, "to":{"type":"string"}, "stream_id":{"type":"string"}, "risk_level":{"type":"string"}}}}}
]"#;

fn parse_opt_datetime(s: &str) -> Option<DateTime<Utc>> {
    let s = s.trim();
    if s.is_empty() { return None; }
    DateTime::parse_from_rfc3339(s).ok().map(|d| d.with_timezone(&Utc))
        .or_else(|| chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S").ok().map(|n| n.and_utc()))
        .or_else(|| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok().map(|d| d.and_hms_opt(0,0,0).unwrap().and_utc()))
}

pub async fn chat(db: &PgPool, message: &str) -> Result<String> {
    let base_url = std::env::var("OLLAMA_BASE_URL").unwrap_or_else(|_| "http://localhost:11434".into());
    let model = std::env::var("OLLAMA_ASSISTANT_MODEL").unwrap_or_else(|_| std::env::var("OLLAMA_MODEL").unwrap_or_else(|_| "qwen3".into()));
    let client = reqwest::Client::new();
    let url = format!("{}/api/chat", base_url.trim_end_matches('/'));
    let tools: serde_json::Value = serde_json::from_str(TOOLS).unwrap();
    let system = "You are an assistant for Cipher-Shield, a security camera app. Use the tools to answer. Be concise.";

    let mut messages: Vec<serde_json::Value> = vec![
        serde_json::json!({"role":"system","content":system}),
        serde_json::json!({"role":"user","content":message}),
    ];

    for _ in 0..5 {
        let body = serde_json::json!({
            "model": model,
            "messages": messages,
            "stream": false,
            "tools": tools
        });
        let resp = client.post(&url).json(&body).send().await
            .map_err(|e| crate::error::AppError::Vlm(format!("Ollama: {e}")))?;
        let status = resp.status();
        if !status.is_success() {
            let t = resp.text().await.unwrap_or_default();
            return Err(crate::error::AppError::Vlm(format!("Ollama HTTP {}: {}", status, t)).into());
        }
        let j: serde_json::Value = resp.json().await
            .map_err(|e| crate::error::AppError::Vlm(format!("Ollama JSON: {e}")))?;
        let msg = j.get("message").ok_or_else(|| crate::error::AppError::Vlm("no message".into()))?;
        let content = msg.get("content").and_then(|c| c.as_str()).unwrap_or("").to_string();
        let tool_calls = msg.get("tool_calls").and_then(|t| t.as_array());

        messages.push(serde_json::json!({"role":"assistant","content":content,"tool_calls":msg.get("tool_calls")}));

        let Some(calls) = tool_calls else {
            return Ok(if content.is_empty() { "No response.".to_string() } else { content });
        };

        for tc in calls {
            let f = tc.get("function").and_then(|f| f.get("name")).and_then(|n| n.as_str()).unwrap_or("");
            let args = tc.get("function").and_then(|f| f.get("arguments")).cloned().unwrap_or(serde_json::json!({}));
            let args_obj = args.as_object().map(|o| o.clone()).unwrap_or_default();
            let get = |k: &str| args_obj.get(k).and_then(|v| v.as_str()).unwrap_or("").to_string();

            let result = match f {
                "list_events" => {
                    let from = parse_opt_datetime(&get("from"));
                    let to = parse_opt_datetime(&get("to"));
                    let sid_s = get("stream_id");
                    let sid = if sid_s.trim().is_empty() { None } else { Uuid::parse_str(sid_s.trim()).ok() };
                    let rl_s = get("risk_level");
                    let risk_level = if rl_s.trim().is_empty() { None } else { Some(rl_s.trim().to_string()) };
                    let limit = args_obj.get("limit").and_then(|v| v.as_i64()).unwrap_or(1000).min(2000);
                    let query = EventQuery {
                        stream_id: sid,
                        risk_level,
                        from,
                        to,
                        limit,
                        offset: 0,
                    };
                    let events = db::list_events(db, &query).await?;
                    let txt: String = events.iter()
                        .map(|e| format!("- {} | {} | {} | {} | {} | {}", e.captured_at.format("%Y-%m-%d %H:%M"), e.risk_level, e.title.as_deref().unwrap_or("-"), e.description, e.status, e.stream_id))
                        .collect::<Vec<_>>().join("\n");
                    if txt.is_empty() { "No events.".to_string() } else { format!("{} events:\n{}", events.len(), txt) }
                }
                "list_streams" => {
                    let streams = db::list_streams(db, None).await?;
                    streams.iter().map(|s| format!("{} | {} | {}", s.id, s.name, s.source_type)).collect::<Vec<_>>().join("\n")
                }
                "resolve_events" => {
                    let from = parse_opt_datetime(&get("from"));
                    let to = parse_opt_datetime(&get("to"));
                    let sid_s = get("stream_id");
                    let sid = if sid_s.trim().is_empty() { None } else { Uuid::parse_str(sid_s.trim()).ok() };
                    let rl_s = get("risk_level");
                    let rl = if rl_s.trim().is_empty() { None } else { Some(rl_s.trim()) };
                    let n = db::resolve_events_by_filter(db, from, to, sid, rl).await?;
                    format!("Resolved {} events.", n)
                }
                _ => format!("Unknown tool: {}", f),
            };
            messages.push(serde_json::json!({"role":"tool","tool_name":f,"content":result}));
        }
    }
    Ok("Max tool rounds reached.".to_string())
}
