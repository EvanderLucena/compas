-- V32: Create meal plan templates table with RLS and seed system templates
CREATE TABLE plan_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutritionist_id UUID REFERENCES nutritionist(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'GERAL',
    is_system BOOLEAN NOT NULL DEFAULT false,
    kcal_target NUMERIC(10, 1) NOT NULL DEFAULT 1800.0,
    prot_target NUMERIC(10, 1) NOT NULL DEFAULT 90.0,
    carb_target NUMERIC(10, 1) NOT NULL DEFAULT 200.0,
    fat_target NUMERIC(10, 1) NOT NULL DEFAULT 60.0,
    structure_json TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_template_nutritionist ON plan_template(nutritionist_id);
CREATE INDEX idx_plan_template_category ON plan_template(category);
CREATE INDEX idx_plan_template_system ON plan_template(is_system);

-- 1. Seed System Templates (nutritionist_id = NULL, is_system = true) before enabling RLS
INSERT INTO plan_template (
    id, nutritionist_id, name, description, category, is_system,
    kcal_target, prot_target, carb_target, fat_target, structure_json
) VALUES
(
    '00000000-0000-0000-0000-000000000101',
    NULL,
    'Equilíbrio & Manutenção (2.000 kcal)',
    'Plano equilibrado com 6 refeições distribuídas ao longo do dia, ideal para manutenção do peso corporal e energia contínua.',
    'EQUILIBRIO',
    true,
    2000.0, 110.0, 240.0, 65.0,
    '{"meals":[{"label":"Café da manhã","time":"07:30","sortOrder":0,"options":[{"name":"Opção 1 · Ovos e Pão","sortOrder":0,"items":[{"foodName":"Ovo de galinha cozido","referenceAmount":100,"unit":"g","kcal":146.0,"prot":13.3,"carb":0.6,"fat":9.5,"prep":"Cozido"},{"foodName":"Pão de forma integral","referenceAmount":50,"unit":"g","kcal":125.0,"prot":4.5,"carb":22.0,"fat":1.8,"prep":"Fresco"}]}]},{"label":"Lanche da manhã","time":"10:30","sortOrder":1,"options":[{"name":"Opção 1 · Fruta com Aveia","sortOrder":0,"items":[{"foodName":"Banana prata crua","referenceAmount":100,"unit":"g","kcal":98.0,"prot":1.3,"carb":26.0,"fat":0.1,"prep":"In natura"},{"foodName":"Aveia em flocos","referenceAmount":30,"unit":"g","kcal":118.0,"prot":4.3,"carb":20.0,"fat":2.2,"prep":"Crua"}]}]},{"label":"Almoço","time":"13:00","sortOrder":2,"options":[{"name":"Opção 1 · Prato Tradicional","sortOrder":0,"items":[{"foodName":"Arroz branco cozido","referenceAmount":150,"unit":"g","kcal":192.0,"prot":3.8,"carb":42.0,"fat":0.3,"prep":"Cozido"},{"foodName":"Feijão carioca cozido","referenceAmount":100,"unit":"g","kcal":76.0,"prot":4.8,"carb":13.6,"fat":0.5,"prep":"Cozido"},{"foodName":"Frango filé grelhado","referenceAmount":120,"unit":"g","kcal":191.0,"prot":38.4,"carb":0.0,"fat":3.0,"prep":"Grelhado"}]}]},{"label":"Lanche da tarde","time":"16:30","sortOrder":3,"options":[{"name":"Opção 1 · Iogurte & Castanhas","sortOrder":0,"items":[{"foodName":"Iogurte natural desnatado","referenceAmount":170,"unit":"g","kcal":86.0,"prot":6.8,"carb":10.2,"fat":0.5,"prep":"Natural"},{"foodName":"Castanha-de-caju torrada","referenceAmount":15,"unit":"g","kcal":87.0,"prot":2.8,"carb":4.5,"fat":6.9,"prep":"Torrada"}]}]},{"label":"Jantar","time":"19:30","sortOrder":4,"options":[{"name":"Opção 1 · Leve e Nutritivo","sortOrder":0,"items":[{"foodName":"Batata doce cozida","referenceAmount":150,"unit":"g","kcal":115.0,"prot":0.9,"carb":27.3,"fat":0.2,"prep":"Cozida"},{"foodName":"Patinho bovino moído grelhado","referenceAmount":120,"unit":"g","kcal":263.0,"prot":43.1,"carb":0.0,"fat":8.8,"prep":"Grelhado"}]}]},{"label":"Ceia","time":"22:00","sortOrder":5,"options":[{"name":"Opção 1 · Chá & Fruta","sortOrder":0,"items":[{"foodName":"Maçã gala com casca","referenceAmount":130,"unit":"g","kcal":73.0,"prot":0.3,"carb":19.5,"fat":0.2,"prep":"Crua"}]}]}],"extras":[{"name":"Azeite de oliva extravirgem","quantity":"1 colher de sobremesa (5ml) no almoço","kcal":44.0,"prot":0.0,"carb":0.0,"fat":5.0,"sortOrder":0}]}'
),
(
    '00000000-0000-0000-0000-000000000102',
    NULL,
    'Low Carb Emagrecimento (1.600 kcal)',
    'Estratégia low carb moderada com 4 refeições, alta saciedade proteica e controle de carboidratos líquidos para redução de gordura.',
    'LOW_CARB',
    true,
    1600.0, 130.0, 80.0, 85.0,
    '{"meals":[{"label":"Café da manhã","time":"08:00","sortOrder":0,"options":[{"name":"Opção 1 · Omelete com Queijo","sortOrder":0,"items":[{"foodName":"Ovo de galinha cozido","referenceAmount":150,"unit":"g","kcal":219.0,"prot":20.0,"carb":0.9,"fat":14.3,"prep":"Omelete"},{"foodName":"Queijo minas frescal","referenceAmount":40,"unit":"g","kcal":96.0,"prot":6.8,"carb":1.2,"fat":7.1,"prep":"Fresco"}]}]},{"label":"Almoço","time":"12:30","sortOrder":1,"options":[{"name":"Opção 1 · Frango com Legumes","sortOrder":0,"items":[{"foodName":"Frango filé grelhado","referenceAmount":160,"unit":"g","kcal":254.0,"prot":51.2,"carb":0.0,"fat":4.0,"prep":"Grelhado"},{"foodName":"Brócolis cozido","referenceAmount":150,"unit":"g","kcal":37.0,"prot":3.1,"carb":6.6,"fat":0.6,"prep":"Cozido no vapor"},{"foodName":"Abóbora cabotian cozida","referenceAmount":100,"unit":"g","kcal":48.0,"prot":1.4,"carb":10.8,"fat":0.5,"prep":"Cozida"}]}]},{"label":"Lanche da tarde","time":"16:30","sortOrder":2,"options":[{"name":"Opção 1 · Whey & Pasta de Amendoim","sortOrder":0,"items":[{"foodName":"Iogurte natural desnatado","referenceAmount":170,"unit":"g","kcal":86.0,"prot":6.8,"carb":10.2,"fat":0.5,"prep":"Natural"},{"foodName":"Castanha-do-pará","referenceAmount":15,"unit":"g","kcal":98.0,"prot":2.2,"carb":1.8,"fat":9.5,"prep":"Crua"}]}]},{"label":"Jantar","time":"20:00","sortOrder":3,"options":[{"name":"Opção 1 · Salmão ou Peixe com Salada","sortOrder":0,"items":[{"foodName":"Tilápia filé grelhado","referenceAmount":180,"unit":"g","kcal":212.0,"prot":46.8,"carb":0.0,"fat":4.1,"prep":"Grelhada"},{"foodName":"Cenoura crua ralada","referenceAmount":100,"unit":"g","kcal":34.0,"prot":0.9,"carb":7.7,"fat":0.2,"prep":"Ralada crua"}]}]}],"extras":[{"name":"Azeite de oliva extravirgem","quantity":"1 colher de sopa (10ml) na salada","kcal":88.0,"prot":0.0,"carb":0.0,"fat":10.0,"sortOrder":0}]}'
),
(
    '00000000-0000-0000-0000-000000000103',
    NULL,
    'Hipertrofia & Força (2.600 kcal)',
    'Plano hipercalórico estruturado para ganho de massa magra, com alta oferta proteica e carboidratos complexos distribuídos em 6 refeições.',
    'HIPERTROFIA',
    true,
    2600.0, 160.0, 340.0, 65.0,
    '{"meals":[{"label":"Café da manhã","time":"07:00","sortOrder":0,"options":[{"name":"Opção 1 · Panqueca de Aveia e Ovos","sortOrder":0,"items":[{"foodName":"Ovo de galinha cozido","referenceAmount":150,"unit":"g","kcal":219.0,"prot":20.0,"carb":0.9,"fat":14.3,"prep":"Mexido"},{"foodName":"Aveia em flocos","referenceAmount":50,"unit":"g","kcal":197.0,"prot":7.2,"carb":33.3,"fat":3.7,"prep":"Crua"},{"foodName":"Banana prata crua","referenceAmount":100,"unit":"g","kcal":98.0,"prot":1.3,"carb":26.0,"fat":0.1,"prep":"Amassada"}]}]},{"label":"Lanche da manhã","time":"10:00","sortOrder":1,"options":[{"name":"Opção 1 · Sanduíche Natural","sortOrder":0,"items":[{"foodName":"Pão de forma integral","referenceAmount":50,"unit":"g","kcal":125.0,"prot":4.5,"carb":22.0,"fat":1.8,"prep":"Fresco"},{"foodName":"Frango filé grelhado","referenceAmount":80,"unit":"g","kcal":127.0,"prot":25.6,"carb":0.0,"fat":2.0,"prep":"Desfiado"}]}]},{"label":"Almoço","time":"13:00","sortOrder":2,"options":[{"name":"Opção 1 · Prato Reforçado","sortOrder":0,"items":[{"foodName":"Arroz branco cozido","referenceAmount":250,"unit":"g","kcal":320.0,"prot":6.3,"carb":70.0,"fat":0.5,"prep":"Cozido"},{"foodName":"Feijão carioca cozido","referenceAmount":120,"unit":"g","kcal":91.0,"prot":5.8,"carb":16.3,"fat":0.6,"prep":"Cozido"},{"foodName":"Patinho bovino moído grelhado","referenceAmount":150,"unit":"g","kcal":329.0,"prot":53.9,"carb":0.0,"fat":11.0,"prep":"Grelhado"}]}]},{"label":"Lanche pré-treino","time":"16:30","sortOrder":3,"options":[{"name":"Opção 1 · Batata Doce & Frango","sortOrder":0,"items":[{"foodName":"Batata doce cozida","referenceAmount":200,"unit":"g","kcal":154.0,"prot":1.2,"carb":36.4,"fat":0.2,"prep":"Cozida"},{"foodName":"Frango filé grelhado","referenceAmount":100,"unit":"g","kcal":159.0,"prot":32.0,"carb":0.0,"fat":2.5,"prep":"Grelhado"}]}]},{"label":"Jantar","time":"20:00","sortOrder":4,"options":[{"name":"Opção 1 · Macarrão com Carne","sortOrder":0,"items":[{"foodName":"Macarrão cozido","referenceAmount":200,"unit":"g","kcal":268.0,"prot":9.2,"carb":54.0,"fat":1.4,"prep":"Cozido"},{"foodName":"Patinho bovino moído grelhado","referenceAmount":130,"unit":"g","kcal":285.0,"prot":46.7,"carb":0.0,"fat":9.5,"prep":"Refogado"}]}]},{"label":"Ceia","time":"22:30","sortOrder":5,"options":[{"name":"Opção 1 · Iogurte com Fruta","sortOrder":0,"items":[{"foodName":"Iogurte natural desnatado","referenceAmount":200,"unit":"g","kcal":102.0,"prot":8.0,"carb":12.0,"fat":0.6,"prep":"Natural"},{"foodName":"Maçã gala com casca","referenceAmount":130,"unit":"g","kcal":73.0,"prot":0.3,"carb":19.5,"fat":0.2,"prep":"Picada"}]}]}],"extras":[{"name":"Azeite de oliva extravirgem","quantity":"1 colher de sopa (10ml) no almoço e jantar","kcal":88.0,"prot":0.0,"carb":0.0,"fat":10.0,"sortOrder":0}]}'
);

-- 2. Enable and Force Row Level Security (RLS) after seeding system templates
ALTER TABLE plan_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_template FORCE ROW LEVEL SECURITY;

CREATE POLICY plan_template_tenant_select ON plan_template
    FOR SELECT
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id IS NULL
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

CREATE POLICY plan_template_tenant_insert ON plan_template
    FOR INSERT
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY plan_template_tenant_update ON plan_template
    FOR UPDATE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY plan_template_tenant_delete ON plan_template
    FOR DELETE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );
