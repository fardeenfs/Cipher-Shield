-- One stream belongs to one blueprint; one blueprint can have many streams.
ALTER TABLE streams
  ADD COLUMN IF NOT EXISTS blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_streams_blueprint_id ON streams (blueprint_id);
