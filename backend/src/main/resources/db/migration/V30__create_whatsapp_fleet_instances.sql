-- V30: Create WhatsApp fleet instances table and patient instance routing
-- Fleet management for multiple WhatsApp numbers / chips with sticky routing and load balancing

-- 1. whatsapp_instance — fleet of WhatsApp phone instances managed in Evolution API
CREATE TABLE IF NOT EXISTS whatsapp_instance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(30),
    description VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'DISCONNECTED',
    qr_code_base64 TEXT,
    max_patients INT NOT NULL DEFAULT 180,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_heartbeat_at TIMESTAMP,
    disconnected_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instance_status ON whatsapp_instance(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instance_active ON whatsapp_instance(active);

-- 2. Add whatsapp_instance_id to patient table for sticky affinity routing
ALTER TABLE patient
    ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID REFERENCES whatsapp_instance(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patient_whatsapp_instance_id ON patient(whatsapp_instance_id);

-- 3. Seed default instance so existing configuration works seamlessly
INSERT INTO whatsapp_instance (name, phone_number, description, status, max_patients, active)
VALUES ('compas', NULL, 'Instância Principal Evolution API', 'DISCONNECTED', 180, TRUE)
ON CONFLICT (name) DO NOTHING;
