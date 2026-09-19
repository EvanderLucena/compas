-- Migration V28: Add Jev sanity fields to meal_extraction and adherence insight to patient
ALTER TABLE meal_extraction
    ADD COLUMN IF NOT EXISTS sanity_status VARCHAR(30) DEFAULT 'VERIFIED',
    ADD COLUMN IF NOT EXISTS sanity_note VARCHAR(255);

ALTER TABLE patient
    ADD COLUMN IF NOT EXISTS ai_adherence_insight VARCHAR(500),
    ADD COLUMN IF NOT EXISTS ai_adherence_updated_at TIMESTAMP;
