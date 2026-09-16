-- V23: Add missing foreign key and frequent lookup indexes
-- Performance optimization for WhatsApp routing, meal extractions, and cascades

-- 1. Patient WhatsApp lookup indexes for webhook routing
CREATE INDEX IF NOT EXISTS idx_patient_whatsapp ON patient(whatsapp);
CREATE INDEX IF NOT EXISTS idx_patient_nutritionist_whatsapp ON patient(nutritionist_id, whatsapp);

-- 2. WhatsApp response lookup & FK indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_response_message ON whatsapp_response(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_response_patient ON whatsapp_response(patient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_response_nutritionist ON whatsapp_response(nutritionist_id);

-- 3. Meal extraction message lookup
CREATE INDEX IF NOT EXISTS idx_meal_extraction_message ON meal_extraction(message_id);

-- 4. Extraction item CASCADE delete & foreign key lookup
CREATE INDEX IF NOT EXISTS idx_extraction_item_extraction ON extraction_item(extraction_id);
