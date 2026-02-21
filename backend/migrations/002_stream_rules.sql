-- Per-stream threat assessment rules fed to the VLM as part of its system prompt.
CREATE TABLE IF NOT EXISTS stream_rules (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id    UUID         NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
    -- Human-readable rule description, e.g. "Person climbing the fence"
    description  TEXT         NOT NULL,
    -- "none" | "low" | "medium" | "high"
    threat_level VARCHAR(20)  NOT NULL DEFAULT 'low',
    -- Display / prompt ordering (lower = earlier in the prompt)
    position     INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_stream_id ON stream_rules (stream_id);
