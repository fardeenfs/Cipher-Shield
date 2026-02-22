-- Remove per-stream phone number; global alert number is in app_settings / env.
ALTER TABLE streams DROP COLUMN IF EXISTS phone_number;

-- Single global alert phone number (used when high risk is identified). Fallback: ALERT_PHONE_NUMBER env.
CREATE TABLE IF NOT EXISTS app_settings (
    key   VARCHAR(64) PRIMARY KEY,
    value TEXT
);
