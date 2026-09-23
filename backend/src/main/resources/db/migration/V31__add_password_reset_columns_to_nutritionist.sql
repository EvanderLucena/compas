ALTER TABLE nutritionist
    ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(64),
    ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_nutritionist_password_reset_token ON nutritionist(password_reset_token);
