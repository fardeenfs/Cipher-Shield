use sqlx::PgPool;
use tokio::sync::{broadcast, mpsc};
use tracing::{error, info};
use uuid::Uuid;

use crate::{
    analysis::vlm::{DynVlmClient, RiskLevel, VlmRule},
    storage::{db, models::AnalysisEvent},
    streams::source::CapturedFrame,
};

/// A pool of async workers that consume frames, call the VLM, persist results,
/// and broadcast the resulting event to WebSocket subscribers.
pub struct AnalysisWorkerPool {
    worker_count: usize,
    vlm: DynVlmClient,
    db: PgPool,
    event_tx: broadcast::Sender<AnalysisEvent>,
}

impl AnalysisWorkerPool {
    pub fn new(
        worker_count: usize,
        vlm: DynVlmClient,
        db: PgPool,
        event_tx: broadcast::Sender<AnalysisEvent>,
    ) -> Self {
        Self { worker_count, vlm, db, event_tx }
    }

    /// Consumes from `frame_rx` using `worker_count` concurrent tasks.
    pub async fn run(self, frame_rx: mpsc::Receiver<CapturedFrame>) {
        // Wrap receiver in an Arc<Mutex> so workers can share it.
        let rx = std::sync::Arc::new(tokio::sync::Mutex::new(frame_rx));

        let mut handles = Vec::new();
        for i in 0..self.worker_count {
            let rx = std::sync::Arc::clone(&rx);
            let vlm = std::sync::Arc::clone(&self.vlm);
            let db = self.db.clone();
            let event_tx = self.event_tx.clone();

            let handle = tokio::spawn(async move {
                info!(worker = i, "Analysis worker started");
                loop {
                    let frame = {
                        let mut guard = rx.lock().await;
                        guard.recv().await
                    };

                    match frame {
                        Some(frame) => {
                            if let Err(e) =
                                process_frame(&frame, &vlm, &db, &event_tx).await
                            {
                                error!(
                                    worker = i,
                                    stream = %frame.stream_name,
                                    "Frame processing error: {e}"
                                );
                            }
                        }
                        None => {
                            // Channel closed
                            info!(worker = i, "Frame channel closed, worker exiting");
                            break;
                        }
                    }
                }
            });

            handles.push(handle);
        }

        for h in handles {
            h.await.ok();
        }
    }
}

async fn process_frame(
    frame: &CapturedFrame,
    vlm: &DynVlmClient,
    db: &PgPool,
    event_tx: &broadcast::Sender<AnalysisEvent>,
) -> anyhow::Result<()> {
    info!(stream = %frame.stream_name, "Analyzing frame");

    // Fetch per-stream rules and convert to VlmRule for prompt injection.
    let stream_rules = db::list_rules(db, frame.stream_id).await.unwrap_or_default();
    let vlm_rules: Vec<VlmRule> = stream_rules
        .into_iter()
        .map(|r| VlmRule { description: r.description, threat_level: r.threat_level })
        .collect();

    let result = vlm.analyze(&frame.data, &frame.stream_name, &vlm_rules).await?;

    let event_id = Uuid::new_v4();
    let risk_str = match result.risk_level {
        RiskLevel::None => "none",
        RiskLevel::Low => "low",
        RiskLevel::Medium => "medium",
        RiskLevel::High => "high",
    };

    let events_json = serde_json::to_value(&result.events)?;
    let title: Option<&str> = result.title.as_deref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() { None } else { Some(t) }
    });
    let triggered_rule: Option<&str> = result.triggered_rule.as_deref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() { None } else { Some(t) }
    });

    // Persist to DB
    let event = db::insert_event(
        db,
        event_id,
        frame.stream_id,
        frame.captured_at,
        &result.description,
        events_json,
        risk_str,
        triggered_rule,
        title,
        Some(&frame.data),
        "unresolved",
    )
    .await?;

    info!(
        stream = %frame.stream_name,
        risk = %risk_str,
        description = %result.description,
        "Analysis complete"
    );

    // Broadcast to WebSocket subscribers (ignore if no subscribers)
    let _ = event_tx.send(event);

    // High risk only: send Twilio SMS to global alert number (DB then env)
    if result.risk_level == RiskLevel::High {
        let db = db.clone();
        let stream_name = frame.stream_name.clone();
        let description = result.description.clone();
        tokio::spawn(async move {
            let to_number = db::get_alert_phone_number(&db).await.ok().flatten();
            crate::notifications::twilio::send_alert(to_number.as_deref(), &stream_name, "high", &description).await;
        });
    }

    Ok(())
}
