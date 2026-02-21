-- Blueprint: one image (floor plan) per record; image stored directly as BYTEA.
CREATE TABLE IF NOT EXISTS blueprints (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL DEFAULT 'Blueprint',
    image_data  BYTEA,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Cameras placed on a blueprint: position (x,y), rotation (degrees), each belongs to one blueprint.
CREATE TABLE IF NOT EXISTS blueprint_cameras (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID        NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    label        VARCHAR(255) NOT NULL DEFAULT 'Camera',
    position_x   DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y   DOUBLE PRECISION NOT NULL DEFAULT 0,
    rotation     DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_cameras_blueprint_id ON blueprint_cameras (blueprint_id);
