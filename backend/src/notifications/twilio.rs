//! Send SMS via Twilio when threats are detected (low, medium, or high risk).
//! Reads TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ALERT_PHONE_NUMBER from env.

use std::env;
use tracing::{error, info, warn};

/// Sends an SMS alert via Twilio. No-op if Twilio env vars are not set.
/// `risk_level` should be "low", "medium", or "high".
pub async fn send_alert(stream_name: &str, risk_level: &str, description: &str) {
    let account_sid = match env::var("TWILIO_ACCOUNT_SID") {
        Ok(s) if !s.is_empty() => s,
        _ => {
            warn!("TWILIO_ACCOUNT_SID not set, skipping Twilio alert");
            return;
        }
    };
    let auth_token = match env::var("TWILIO_AUTH_TOKEN") {
        Ok(s) if !s.is_empty() => s,
        _ => {
            warn!("TWILIO_AUTH_TOKEN not set, skipping Twilio alert");
            return;
        }
    };
    let from_number = match env::var("TWILIO_PHONE_NUMBER") {
        Ok(s) if !s.is_empty() => s,
        _ => {
            warn!("TWILIO_PHONE_NUMBER not set, skipping Twilio alert");
            return;
        }
    };
    let to_number = match env::var("ALERT_PHONE_NUMBER") {
        Ok(s) if !s.is_empty() => s,
        _ => {
            warn!("ALERT_PHONE_NUMBER not set, skipping Twilio alert");
            return;
        }
    };

    let body = format!(
        "Cipher-Shield: {} risk on stream \"{}\". {}",
        risk_level,
        stream_name,
        description.chars().take(100).collect::<String>()
    );
    let url = format!("https://api.twilio.com/2010-04-01/Accounts/{}/Messages.json", account_sid);

    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .basic_auth(&account_sid, Some(&auth_token))
        .form(&[
            ("To", to_number.as_str()),
            ("From", from_number.as_str()),
            ("Body", body.as_str()),
        ])
        .send()
        .await;

    match res {
        Ok(resp) if resp.status().is_success() => {
            info!("Twilio alert sent for stream {} ({} risk)", stream_name, risk_level);
        }
        Ok(resp) => {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            error!(
                "Twilio SMS failed status={} body={}",
                status,
                text.chars().take(200).collect::<String>()
            );
        }
        Err(e) => {
            error!("Twilio request error: {}", e);
        }
    }
}
