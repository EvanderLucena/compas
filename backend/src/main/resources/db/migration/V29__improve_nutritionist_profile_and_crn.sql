-- V29: Expand crn_regional, add professional_name and email verification fields to nutritionist
ALTER TABLE nutritionist
    ALTER COLUMN crn_regional TYPE VARCHAR(10);

ALTER TABLE nutritionist
    ADD COLUMN IF NOT EXISTS professional_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64),
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_nutritionist_email_verification_token ON nutritionist(email_verification_token);

-- Existing accounts (including demo admin) are considered verified
UPDATE nutritionist SET email_verified = true WHERE email_verified = false;
