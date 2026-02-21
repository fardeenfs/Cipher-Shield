-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Streams ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streams (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(255) NOT NULL,
    -- "rtsp" | "mjpeg" | "snapshot" | "usb"
    source_type          VARCHAR(50)  NOT NULL,
    -- RTSP URL, HTTP URL, or device identifier (e.g. "0" for /dev/video0)
    source_url           TEXT         NOT NULL,
    -- seconds between captured frames
    capture_interval_sec INTEGER      NOT NULL DEFAULT 5,
    enabled              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Analysis Events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_events (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id    UUID        NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    captured_at  TIMESTAMPTZ NOT NULL,
    description  TEXT        NOT NULL,
    -- [{"event_type": "person_detected", "details": null, "confidence": 0.95}]
    events       JSONB       NOT NULL DEFAULT '[]',
    -- "none" | "low" | "medium" | "high"
    risk_level   VARCHAR(20) NOT NULL DEFAULT 'none',
    -- raw model output, kept for debugging / reprocessing
    raw_response TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_stream_id   ON analysis_events (stream_id);
CREATE INDEX IF NOT EXISTS idx_events_captured_at ON analysis_events (captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_risk_level  ON analysis_events (risk_level);
-- Fast JSONB queries on event types
CREATE INDEX IF NOT EXISTS idx_events_jsonb       ON analysis_events USING GIN (events);
