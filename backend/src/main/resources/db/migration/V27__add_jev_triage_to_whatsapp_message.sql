-- V27: Add Jev AI (System One) triage and emotional analysis columns to whatsapp_message

ALTER TABLE whatsapp_message
    ADD COLUMN IF NOT EXISTS jev_intent VARCHAR(50),
    ADD COLUMN IF NOT EXISTS jev_intent_confidence DECIMAL(4,3),
    ADD COLUMN IF NOT EXISTS jev_sentiment VARCHAR(50),
    ADD COLUMN IF NOT EXISTS jev_sentiment_confidence DECIMAL(4,3),
    ADD COLUMN IF NOT EXISTS jev_attention_score DECIMAL(4,3),
    ADD COLUMN IF NOT EXISTS jev_requires_attention BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS jev_attention_resolved BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_wa_msg_nutri_attention
    ON whatsapp_message(nutritionist_id, jev_requires_attention, jev_attention_resolved);

CREATE INDEX IF NOT EXISTS idx_wa_msg_nutri_sentiment
    ON whatsapp_message(nutritionist_id, jev_sentiment);
