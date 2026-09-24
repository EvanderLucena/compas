-- V33: Create prescription and prescription items tables with RLS

CREATE TABLE prescription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL DEFAULT 'Prescrição & Suplementação',
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescription_patient ON prescription(patient_id, nutritionist_id);
CREATE INDEX idx_prescription_nutritionist ON prescription(nutritionist_id);
CREATE INDEX idx_prescription_status ON prescription(status);

CREATE TABLE prescription_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescription(id) ON DELETE CASCADE,
    nutritionist_id UUID NOT NULL REFERENCES nutritionist(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'SUPPLEMENT',
    dosage VARCHAR(80) NOT NULL,
    form VARCHAR(50) NOT NULL DEFAULT 'Pó',
    timing VARCHAR(150) NOT NULL,
    duration VARCHAR(60) NOT NULL DEFAULT 'Uso contínuo',
    is_continuous BOOLEAN NOT NULL DEFAULT true,
    instructions TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescription_item_prescription ON prescription_item(prescription_id, nutritionist_id);
CREATE INDEX idx_prescription_item_nutritionist ON prescription_item(nutritionist_id);

-- Enable and Force Row Level Security (RLS)
ALTER TABLE prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription FORCE ROW LEVEL SECURITY;

CREATE POLICY prescription_tenant_select ON prescription
    FOR SELECT
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

CREATE POLICY prescription_tenant_insert ON prescription
    FOR INSERT
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY prescription_tenant_update ON prescription
    FOR UPDATE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY prescription_tenant_delete ON prescription
    FOR DELETE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

ALTER TABLE prescription_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_item FORCE ROW LEVEL SECURITY;

CREATE POLICY prescription_item_tenant_select ON prescription_item
    FOR SELECT
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

CREATE POLICY prescription_item_tenant_insert ON prescription_item
    FOR INSERT
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY prescription_item_tenant_update ON prescription_item
    FOR UPDATE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY prescription_item_tenant_delete ON prescription_item
    FOR DELETE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );
