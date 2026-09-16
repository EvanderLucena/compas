-- V24: Enable PostgreSQL Row-Level Security (RLS) for multi-tenant isolation defense-in-depth

-- 1. Helper function for consistent RLS policy checks
-- Reads app.current_nutritionist_id and app.bypass_rls GUC variables.
-- If app.bypass_rls is 'on', allows access (e.g. system migrations, webhook patient resolution).
-- Otherwise, enforces nutritionist_id = app.current_nutritionist_id.

-- 2. Direct tenant tables (have nutritionist_id column)

-- 2.1 patient
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS patient_tenant_isolation ON patient;
CREATE POLICY patient_tenant_isolation ON patient
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.2 episode
ALTER TABLE episode ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS episode_tenant_isolation ON episode;
CREATE POLICY episode_tenant_isolation ON episode
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.3 episode_history_event
ALTER TABLE episode_history_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_history_event FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS episode_history_event_tenant_isolation ON episode_history_event;
CREATE POLICY episode_history_event_tenant_isolation ON episode_history_event
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.4 biometry_assessment
ALTER TABLE biometry_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometry_assessment FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS biometry_assessment_tenant_isolation ON biometry_assessment;
CREATE POLICY biometry_assessment_tenant_isolation ON biometry_assessment
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.5 biometry_skinfold
ALTER TABLE biometry_skinfold ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometry_skinfold FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS biometry_skinfold_tenant_isolation ON biometry_skinfold;
CREATE POLICY biometry_skinfold_tenant_isolation ON biometry_skinfold
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.6 biometry_perimetry
ALTER TABLE biometry_perimetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometry_perimetry FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS biometry_perimetry_tenant_isolation ON biometry_perimetry;
CREATE POLICY biometry_perimetry_tenant_isolation ON biometry_perimetry
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.7 food_catalog
ALTER TABLE food_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_catalog FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS food_catalog_tenant_isolation ON food_catalog;
CREATE POLICY food_catalog_tenant_isolation ON food_catalog
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.8 meal_plan
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meal_plan_tenant_isolation ON meal_plan;
CREATE POLICY meal_plan_tenant_isolation ON meal_plan
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.9 meal_extraction
ALTER TABLE meal_extraction ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_extraction FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meal_extraction_tenant_isolation ON meal_extraction;
CREATE POLICY meal_extraction_tenant_isolation ON meal_extraction
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.10 whatsapp_message
ALTER TABLE whatsapp_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_message_tenant_isolation ON whatsapp_message;
CREATE POLICY whatsapp_message_tenant_isolation ON whatsapp_message
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 2.11 whatsapp_response
ALTER TABLE whatsapp_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_response FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS whatsapp_response_tenant_isolation ON whatsapp_response;
CREATE POLICY whatsapp_response_tenant_isolation ON whatsapp_response
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

-- 3. Child tables (scoped via foreign key hierarchy)

-- 3.1 meal_slot (via meal_plan)
ALTER TABLE meal_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_slot FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meal_slot_tenant_isolation ON meal_slot;
CREATE POLICY meal_slot_tenant_isolation ON meal_slot
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_plan mp
            WHERE mp.id = meal_slot.plan_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_plan mp
            WHERE mp.id = meal_slot.plan_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    );

-- 3.2 meal_option (via meal_slot -> meal_plan)
ALTER TABLE meal_option ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_option FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meal_option_tenant_isolation ON meal_option;
CREATE POLICY meal_option_tenant_isolation ON meal_option
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_slot ms
            JOIN meal_plan mp ON mp.id = ms.plan_id
            WHERE ms.id = meal_option.meal_slot_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_slot ms
            JOIN meal_plan mp ON mp.id = ms.plan_id
            WHERE ms.id = meal_option.meal_slot_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    );

-- 3.3 meal_food (via meal_option -> meal_slot -> meal_plan)
ALTER TABLE meal_food ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_food FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS meal_food_tenant_isolation ON meal_food;
CREATE POLICY meal_food_tenant_isolation ON meal_food
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_option mo
            JOIN meal_slot ms ON ms.id = mo.meal_slot_id
            JOIN meal_plan mp ON mp.id = ms.plan_id
            WHERE mo.id = meal_food.option_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_option mo
            JOIN meal_slot ms ON ms.id = mo.meal_slot_id
            JOIN meal_plan mp ON mp.id = ms.plan_id
            WHERE mo.id = meal_food.option_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    );

-- 3.4 plan_extra (via meal_plan)
ALTER TABLE plan_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_extra FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plan_extra_tenant_isolation ON plan_extra;
CREATE POLICY plan_extra_tenant_isolation ON plan_extra
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_plan mp
            WHERE mp.id = plan_extra.plan_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_plan mp
            WHERE mp.id = plan_extra.plan_id
              AND mp.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    );

-- 3.5 extraction_item (via meal_extraction)
ALTER TABLE extraction_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_item FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS extraction_item_tenant_isolation ON extraction_item;
CREATE POLICY extraction_item_tenant_isolation ON extraction_item
    FOR ALL
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_extraction me
            WHERE me.id = extraction_item.extraction_id
              AND me.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR EXISTS (
            SELECT 1 FROM meal_extraction me
            WHERE me.id = extraction_item.extraction_id
              AND me.nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
        )
    );
