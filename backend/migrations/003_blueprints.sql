-- Blueprint: one image (floor plan) per record; image stored directly as BYTEA.
CREATE TABLE IF NOT EXISTS blueprints (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL DEFAULT 'Blueprint',
    image_data  BYTEA,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
