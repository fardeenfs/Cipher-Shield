ALTER TABLE analysis_events
    ADD COLUMN IF NOT EXISTS triggered_rule TEXT;
