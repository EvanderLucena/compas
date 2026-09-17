-- V25: Allow system foods with NULL nutritionist_id and seed Brazilian TACO catalog
-- 1. Make nutritionist_id nullable for system reference foods
ALTER TABLE food_catalog ALTER COLUMN nutritionist_id DROP NOT NULL;

-- 2. Update RLS policies to allow reading system foods (nutritionist_id IS NULL)
DROP POLICY IF EXISTS food_catalog_tenant_isolation ON food_catalog;
DROP POLICY IF EXISTS food_catalog_tenant_select ON food_catalog;
DROP POLICY IF EXISTS food_catalog_tenant_insert ON food_catalog;
DROP POLICY IF EXISTS food_catalog_tenant_update ON food_catalog;
DROP POLICY IF EXISTS food_catalog_tenant_delete ON food_catalog;

CREATE POLICY food_catalog_tenant_select ON food_catalog
    FOR SELECT
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR nutritionist_id IS NULL
        OR nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid
    );

CREATE POLICY food_catalog_tenant_insert ON food_catalog
    FOR INSERT
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY food_catalog_tenant_update ON food_catalog
    FOR UPDATE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    )
    WITH CHECK (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

CREATE POLICY food_catalog_tenant_delete ON food_catalog
    FOR DELETE
    USING (
        COALESCE(current_setting('app.bypass_rls', true), 'off') = 'on'
        OR (nutritionist_id IS NOT NULL AND nutritionist_id = NULLIF(current_setting('app.current_nutritionist_id', true), '')::uuid)
    );

-- 3. Seed standard TACO Brazilian foods (Unicamp / IBGE reference)
INSERT INTO food_catalog (id, nutritionist_id, name, category, unit, reference_amount, kcal, prot, carb, fat, fiber, prep, portion_label, used_count, created_at, updated_at) VALUES
(gen_random_uuid(), NULL, 'Arroz branco cozido', 'CARBOIDRATO', 'GRAMAS', 100, 130.0, 2.7, 28.2, 0.2, 0.4, 'cozido', '1 escumadeira cheia · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Arroz integral cozido', 'CARBOIDRATO', 'GRAMAS', 100, 124.0, 2.6, 25.8, 1.0, 2.7, 'cozido', '1 escumadeira cheia · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Feijão carioca cozido', 'CARBOIDRATO', 'GRAMAS', 100, 76.0, 4.8, 13.6, 0.5, 8.5, 'cozido com caldo', '1 concha média · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Feijão preto cozido', 'CARBOIDRATO', 'GRAMAS', 100, 77.0, 4.5, 14.0, 0.5, 8.4, 'cozido com caldo', '1 concha média · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Feijão fradinho cozido', 'CARBOIDRATO', 'GRAMAS', 100, 78.0, 5.1, 13.5, 0.6, 6.5, 'cozido', '1 concha média · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Feijão branco cozido', 'CARBOIDRATO', 'GRAMAS', 100, 90.0, 6.0, 16.0, 0.5, 6.3, 'cozido', '1 concha média · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Lentilha cozida', 'CARBOIDRATO', 'GRAMAS', 100, 93.0, 6.3, 16.3, 0.5, 7.9, 'cozida', '1 concha média · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Grão-de-bico cozido', 'CARBOIDRATO', 'GRAMAS', 100, 164.0, 8.9, 27.4, 2.6, 7.6, 'cozido', '3 colheres de sopa · 90g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Ervilha fresca cozida', 'CARBOIDRATO', 'GRAMAS', 100, 81.0, 5.4, 14.5, 0.4, 5.1, 'cozida', '2 colheres de sopa · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Batata inglesa cozida', 'CARBOIDRATO', 'GRAMAS', 100, 52.0, 1.2, 11.9, 0.0, 1.3, 'cozida sem casca', '1 unidade média · 140g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Batata doce cozida', 'CARBOIDRATO', 'GRAMAS', 100, 77.0, 0.6, 18.4, 0.1, 2.2, 'cozida com casca', '1 unidade média · 150g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Mandioca (aipim) cozida', 'CARBOIDRATO', 'GRAMAS', 100, 125.0, 0.6, 30.1, 0.3, 1.6, 'cozida', '1 pedaço médio · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Mandioquinha (batata-baroa) cozida', 'CARBOIDRATO', 'GRAMAS', 100, 80.0, 0.9, 18.9, 0.2, 1.8, 'cozida', '2 colheres de sopa cheias · 90g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Inhame cozido', 'CARBOIDRATO', 'GRAMAS', 100, 97.0, 1.5, 23.2, 0.2, 1.7, 'cozido', '1 fatia grossa · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pão francês', 'CARBOIDRATO', 'GRAMAS', 100, 300.0, 8.0, 58.7, 3.1, 2.3, 'assado', '1 unidade · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pão de forma tradicional', 'CARBOIDRATO', 'GRAMAS', 100, 260.0, 8.2, 52.0, 2.8, 2.5, 'fatiado', '2 fatias · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pão de forma integral', 'CARBOIDRATO', 'GRAMAS', 100, 253.0, 9.4, 49.9, 3.7, 6.9, 'fatiado', '2 fatias · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pão de queijo assado', 'CARBOIDRATO', 'GRAMAS', 100, 363.0, 5.1, 34.2, 22.8, 0.6, 'assado', '2 unidades médias · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Macarrão cozido', 'CARBOIDRATO', 'GRAMAS', 100, 102.0, 3.3, 21.0, 0.3, 1.1, 'cozido al dente', '1 pegador cheio · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Macarrão integral cozido', 'CARBOIDRATO', 'GRAMAS', 100, 124.0, 5.3, 26.5, 0.5, 3.9, 'cozido', '1 pegador cheio · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Tapioca (goma pronta hidratada)', 'CARBOIDRATO', 'GRAMAS', 100, 242.0, 0.1, 60.0, 0.1, 0.0, 'feita na frigideira', '2 colheres de sopa cheias · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Cuscuz de milho cozido', 'CARBOIDRATO', 'GRAMAS', 100, 112.0, 2.2, 25.4, 0.7, 2.0, 'no vapor', '1 fatia média · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Aveia em flocos', 'CARBOIDRATO', 'GRAMAS', 100, 394.0, 13.9, 66.6, 8.5, 9.1, 'crua em flocos', '2 colheres de sopa · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Farinha de aveia', 'CARBOIDRATO', 'GRAMAS', 100, 394.0, 14.0, 66.0, 8.0, 9.0, 'farinha fina', '2 colheres de sopa · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Granola tradicional', 'CARBOIDRATO', 'GRAMAS', 100, 421.0, 10.0, 69.5, 11.2, 7.5, 'pronta', '2 colheres de sopa · 40g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pipoca sem óleo (pipoca de ar)', 'CARBOIDRATO', 'GRAMAS', 100, 375.0, 12.0, 73.0, 4.5, 13.0, 'estourada sem óleo', '1 xícara cheia · 20g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Quinoa em grãos cozida', 'CARBOIDRATO', 'GRAMAS', 100, 120.0, 4.4, 21.3, 1.9, 2.8, 'cozida', '2 colheres de sopa · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Torrada integral', 'CARBOIDRATO', 'GRAMAS', 100, 378.0, 12.5, 72.0, 4.2, 8.0, 'assada', '2 unidades · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Biscoito de arroz integral', 'CARBOIDRATO', 'GRAMAS', 100, 387.0, 8.2, 81.5, 2.8, 3.6, 'pronto', '3 discos · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Peito de frango grelhado', 'PROTEINA', 'GRAMAS', 100, 165.0, 31.0, 0.0, 3.6, 0.0, 'grelhado sem óleo', '1 filé médio · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Peito de frango cozido desfiado', 'PROTEINA', 'GRAMAS', 100, 159.0, 30.5, 0.0, 3.2, 0.0, 'cozido na água', '3 colheres de sopa cheias · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Sobrecoxa de frango sem pele grelhada', 'PROTEINA', 'GRAMAS', 100, 167.0, 24.3, 0.0, 7.2, 0.0, 'grelhada', '1 unidade pequena · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Coxa de frango sem pele cozida', 'PROTEINA', 'GRAMAS', 100, 167.0, 26.9, 0.0, 5.9, 0.0, 'cozida', '1 unidade média · 90g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Patinho bovino grelhado', 'PROTEINA', 'GRAMAS', 100, 219.0, 35.9, 0.0, 7.3, 0.0, 'grelhado', '1 bife médio · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Patinho bovino moído refogado', 'PROTEINA', 'GRAMAS', 100, 215.0, 34.0, 0.0, 8.0, 0.0, 'refogado', '3 colheres de sopa cheias · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Filé mignon bovino grelhado', 'PROTEINA', 'GRAMAS', 100, 220.0, 32.8, 0.0, 8.8, 0.0, 'grelhado', '1 medalhão médio · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Alcatra bovina grelhada', 'PROTEINA', 'GRAMAS', 100, 241.0, 31.9, 0.0, 11.6, 0.0, 'grelhada', '1 bife médio · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Contrafilé bovino grelhado (sem capa)', 'PROTEINA', 'GRAMAS', 100, 236.0, 32.0, 0.0, 11.0, 0.0, 'grelhado', '1 bife médio · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Coxão mole bovino cozido', 'PROTEINA', 'GRAMAS', 100, 219.0, 32.4, 0.0, 8.9, 0.0, 'cozido', '1 fatia média · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Músculo bovino cozido', 'PROTEINA', 'GRAMAS', 100, 194.0, 31.2, 0.0, 6.7, 0.0, 'cozido na panela de pressão', '2 pedaços médios · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Lombo suíno assado/grelhado', 'PROTEINA', 'GRAMAS', 100, 210.0, 35.7, 0.0, 6.4, 0.0, 'assado', '1 fatia média · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Filé de tilápia grelhado', 'PROTEINA', 'GRAMAS', 100, 128.0, 26.2, 0.0, 2.7, 0.0, 'grelhado', '1 filé médio · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Filé de merluza cozido/assado', 'PROTEINA', 'GRAMAS', 100, 112.0, 24.0, 0.0, 1.5, 0.0, 'cozido', '1 filé médio · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Salmão grelhado', 'PROTEINA', 'GRAMAS', 100, 229.0, 24.0, 0.0, 14.0, 0.0, 'grelhado', '1 posta pequena · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Atum sólido em água (conserva)', 'PROTEINA', 'GRAMAS', 100, 116.0, 26.0, 0.0, 0.8, 0.0, 'drenado', '1/2 lata drenada · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Sardinha fresca grelhada', 'PROTEINA', 'GRAMAS', 100, 164.0, 24.0, 0.0, 7.0, 0.0, 'grelhada', '2 unidades pequenas · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Sardinha em óleo (drenada)', 'PROTEINA', 'GRAMAS', 100, 208.0, 24.6, 0.0, 11.5, 0.0, 'drenada', '1/2 lata drenada · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Camarão cozido', 'PROTEINA', 'GRAMAS', 100, 99.0, 20.9, 0.2, 1.1, 0.0, 'cozido no vapor', '1 pires de café · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Ovo de galinha cozido', 'PROTEINA', 'GRAMAS', 100, 146.0, 13.3, 0.6, 9.5, 0.0, 'cozido', '1 unidade média · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Ovo de galinha frito (com pouco óleo)', 'PROTEINA', 'GRAMAS', 100, 240.0, 15.6, 1.2, 18.6, 0.0, 'frito', '1 unidade média · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Clara de ovo cozida', 'PROTEINA', 'GRAMAS', 100, 52.0, 11.0, 0.7, 0.2, 0.0, 'cozida', '1 clara · 35g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Omelete simples (2 ovos com azeite)', 'PROTEINA', 'GRAMAS', 100, 170.0, 12.5, 1.0, 12.8, 0.0, 'na frigideira', '1 omelete · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Tofu tradicional', 'PROTEINA', 'GRAMAS', 100, 76.0, 8.1, 1.9, 4.8, 0.3, 'cru / drenado', '2 fatias médias · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Proteína de soja texturizada (hidratada)', 'PROTEINA', 'GRAMAS', 100, 110.0, 18.0, 7.5, 1.0, 5.0, 'hidratada e refogada', '3 colheres de sopa · 90g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Queijo minas frescal', 'PROTEINA', 'GRAMAS', 100, 264.0, 17.4, 3.2, 20.2, 0.0, 'fresco', '1 fatia média · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Queijo cottage', 'PROTEINA', 'GRAMAS', 100, 98.0, 11.1, 3.4, 4.3, 0.0, 'fresco', '2 colheres de sopa · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Queijo ricota fresca', 'PROTEINA', 'GRAMAS', 100, 140.0, 12.6, 3.8, 8.1, 0.0, 'fresca', '1 fatia média · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Queijo muçarela', 'PROTEINA', 'GRAMAS', 100, 280.0, 22.0, 2.2, 20.5, 0.0, 'fatiado', '1 fatia · 25g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Queijo prato', 'PROTEINA', 'GRAMAS', 100, 360.0, 23.0, 1.5, 29.0, 0.0, 'fatiado', '1 fatia · 25g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Iogurte natural desnatado', 'PROTEINA', 'GRAMAS', 100, 41.0, 4.1, 5.8, 0.3, 0.0, 'líquido / consistente', '1 pote · 170g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Iogurte natural integral', 'PROTEINA', 'GRAMAS', 100, 61.0, 3.5, 4.7, 3.3, 0.0, 'consistente', '1 pote · 170g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Requeijão cremoso light', 'PROTEINA', 'GRAMAS', 100, 160.0, 11.0, 3.5, 11.0, 0.0, 'cremoso', '1 colher de sopa · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Requeijão cremoso tradicional', 'PROTEINA', 'GRAMAS', 100, 257.0, 9.6, 2.4, 23.4, 0.0, 'cremoso', '1 colher de sopa · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Whey Protein concentrado 80%', 'PROTEINA', 'GRAMAS', 100, 390.0, 78.0, 8.0, 6.0, 0.0, 'pó', '1 dosador · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Whey Protein isolado 90%', 'PROTEINA', 'GRAMAS', 100, 370.0, 88.0, 2.0, 1.0, 0.0, 'pó', '1 dosador · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Abóbora cabotian (japonesa) cozida', 'VEGETAL', 'GRAMAS', 100, 48.0, 1.4, 10.8, 0.5, 2.5, 'cozida', '2 colheres de sopa cheias · 90g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Abobrinha italiana cozida', 'VEGETAL', 'GRAMAS', 100, 15.0, 1.1, 3.0, 0.2, 1.6, 'cozida em rodelas', '3 colheres de sopa · 90g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Acelga crua', 'VEGETAL', 'GRAMAS', 100, 17.0, 1.4, 3.9, 0.1, 1.1, 'crua picada', '1 prato de sobremesa · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Agrião cru', 'VEGETAL', 'GRAMAS', 100, 17.0, 2.2, 2.3, 0.2, 2.1, 'cru', '1 prato de sobremesa · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Alface americana crua', 'VEGETAL', 'GRAMAS', 100, 9.0, 0.6, 1.7, 0.1, 1.0, 'crua', '4 folhas · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Alface crespa crua', 'VEGETAL', 'GRAMAS', 100, 11.0, 1.3, 1.7, 0.2, 1.8, 'crua', '4 folhas · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Berinjela cozida', 'VEGETAL', 'GRAMAS', 100, 19.0, 0.7, 4.5, 0.1, 2.5, 'cozida em cubos', '2 colheres de sopa · 70g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Beterraba cozida', 'VEGETAL', 'GRAMAS', 100, 32.0, 1.3, 7.2, 0.1, 1.9, 'cozida fatiada', '3 fatias médias · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Beterraba crua ralada', 'VEGETAL', 'GRAMAS', 100, 43.0, 1.6, 9.6, 0.2, 2.8, 'crua ralada', '2 colheres de sopa · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Brócolis cozido', 'VEGETAL', 'GRAMAS', 100, 25.0, 2.1, 4.4, 0.5, 3.4, 'cozido no vapor', '4 buquês médios · 80g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Cenoura cozida', 'VEGETAL', 'GRAMAS', 100, 30.0, 0.8, 6.7, 0.2, 2.6, 'cozida em rodelas', '3 colheres de sopa · 70g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Cenoura crua ralada', 'VEGETAL', 'GRAMAS', 100, 34.0, 1.3, 7.7, 0.2, 3.2, 'crua ralada', '2 colheres de sopa · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Chuchu cozido', 'VEGETAL', 'GRAMAS', 100, 19.0, 0.4, 4.8, 0.1, 1.0, 'cozido em cubos', '2 colheres de sopa · 70g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Couve-flor cozida', 'VEGETAL', 'GRAMAS', 100, 19.0, 1.2, 3.9, 0.2, 2.1, 'cozida no vapor', '3 ramos médios · 80g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Couve-manteiga refogada', 'VEGETAL', 'GRAMAS', 100, 67.0, 1.7, 8.7, 3.0, 3.1, 'refogada com alho e azeite', '2 colheres de sopa cheias · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Espinafre refogado', 'VEGETAL', 'GRAMAS', 100, 67.0, 2.7, 4.2, 4.8, 2.5, 'refogado', '2 colheres de sopa · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Palmito em conserva', 'VEGETAL', 'GRAMAS', 100, 26.0, 1.8, 4.3, 0.4, 2.5, 'fatiado em rodelas', '2 toletes médios · 80g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pepino com casca cru', 'VEGETAL', 'GRAMAS', 100, 10.0, 0.7, 2.0, 0.1, 1.1, 'fatiado', '1 pires de café · 70g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pimentão verde cru', 'VEGETAL', 'GRAMAS', 100, 21.0, 1.1, 4.9, 0.2, 2.6, 'fatiado em tiras', '1/2 unidade · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pimentão vermelho cru', 'VEGETAL', 'GRAMAS', 100, 23.0, 1.0, 5.5, 0.2, 1.7, 'fatiado em tiras', '1/2 unidade · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Quiabo cozido', 'VEGETAL', 'GRAMAS', 100, 32.0, 1.9, 6.4, 0.3, 4.6, 'cozido', '3 colheres de sopa · 80g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Repolho branco cru', 'VEGETAL', 'GRAMAS', 100, 17.0, 0.9, 3.9, 0.1, 1.9, 'cru picado', '1 prato de sobremesa · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Repolho roxo cru', 'VEGETAL', 'GRAMAS', 100, 22.0, 1.2, 5.2, 0.2, 2.0, 'cru picado', '1 prato de sobremesa · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Rúcula crua', 'VEGETAL', 'GRAMAS', 100, 13.0, 1.8, 2.2, 0.1, 1.7, 'crua', '1 prato de sobremesa · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Tomate cru', 'VEGETAL', 'GRAMAS', 100, 15.0, 1.1, 3.1, 0.2, 1.2, 'fatiado', '4 rodelas · 80g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Vagem cozida', 'VEGETAL', 'GRAMAS', 100, 25.0, 1.8, 5.3, 0.2, 2.4, 'cozida no vapor', '2 colheres de sopa · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Abacate', 'FRUTA', 'GRAMAS', 100, 96.0, 1.2, 6.0, 8.4, 6.3, 'in natura', '2 colheres de sopa · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Abacaxi pérola', 'FRUTA', 'GRAMAS', 100, 48.0, 0.9, 12.3, 0.1, 1.0, 'in natura', '1 fatia média · 80g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Ameixa fresca', 'FRUTA', 'GRAMAS', 100, 53.0, 0.8, 13.9, 0.0, 2.4, 'in natura', '2 unidades pequenas · 60g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Banana prata', 'FRUTA', 'GRAMAS', 100, 89.0, 1.3, 23.8, 0.1, 2.0, 'in natura', '1 unidade média · 70g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Banana maçã', 'FRUTA', 'GRAMAS', 100, 87.0, 1.8, 22.3, 0.1, 2.6, 'in natura', '1 unidade média · 65g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Banana da terra cozida', 'FRUTA', 'GRAMAS', 100, 128.0, 1.4, 33.7, 0.2, 1.5, 'cozida', '1/2 unidade média · 80g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Goiaba vermelha com casca', 'FRUTA', 'GRAMAS', 100, 54.0, 1.1, 13.0, 0.4, 6.2, 'in natura', '1 unidade média · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Kiwi', 'FRUTA', 'GRAMAS', 100, 51.0, 1.3, 11.5, 0.6, 2.7, 'in natura', '1 unidade · 75g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Laranja pera', 'FRUTA', 'GRAMAS', 100, 37.0, 1.0, 8.9, 0.1, 1.7, 'in natura', '1 unidade média · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Limão tahiti', 'FRUTA', 'GRAMAS', 100, 32.0, 0.9, 11.1, 0.1, 1.2, 'suco/in natura', '1 unidade · 40g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Maçã fuji com casca', 'FRUTA', 'GRAMAS', 100, 56.0, 0.3, 15.2, 0.2, 1.3, 'in natura', '1 unidade média · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Mamão formosa', 'FRUTA', 'GRAMAS', 100, 45.0, 0.8, 11.6, 0.1, 1.8, 'in natura', '1 fatia média · 140g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Mamão papaia', 'FRUTA', 'GRAMAS', 100, 40.0, 0.5, 10.4, 0.1, 1.0, 'in natura', '1/2 unidade · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Manga palmer', 'FRUTA', 'GRAMAS', 100, 60.0, 0.5, 15.0, 0.2, 1.6, 'fatiada', '1/2 unidade · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Manga tommy atkins', 'FRUTA', 'GRAMAS', 100, 51.0, 0.9, 12.8, 0.2, 2.1, 'fatiada', '1/2 unidade · 120g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Maracujá (polpa)', 'FRUTA', 'GRAMAS', 100, 68.0, 2.0, 12.3, 2.1, 1.1, 'polpa com semente', '2 colheres de sopa · 50g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Melancia', 'FRUTA', 'GRAMAS', 100, 33.0, 0.9, 8.1, 0.0, 0.1, 'in natura', '1 fatia grande · 200g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Melão amarelo', 'FRUTA', 'GRAMAS', 100, 29.0, 0.7, 7.5, 0.0, 0.3, 'in natura', '1 fatia média · 150g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Morango fresco', 'FRUTA', 'GRAMAS', 100, 30.0, 0.9, 6.8, 0.3, 1.7, 'in natura', '8 unidades médias · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pera williams', 'FRUTA', 'GRAMAS', 100, 53.0, 0.6, 14.0, 0.2, 3.0, 'in natura', '1 unidade média · 130g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Tangerina poncã', 'FRUTA', 'GRAMAS', 100, 38.0, 0.8, 9.6, 0.1, 0.9, 'in natura', '1 unidade média · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Uva itália', 'FRUTA', 'GRAMAS', 100, 53.0, 0.7, 13.6, 0.2, 0.9, 'in natura', '1 cacho pequeno · 100g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Uva passa', 'FRUTA', 'GRAMAS', 100, 299.0, 3.1, 79.2, 0.5, 3.7, 'seca', '1 colher de sopa · 20g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Azeite de oliva extravirgem', 'GORDURA', 'ML', 100, 884.0, 0.0, 0.0, 100.0, 0.0, 'puro', '1 colher de sopa · 13ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Óleo de coco extravirgem', 'GORDURA', 'GRAMAS', 100, 862.0, 0.0, 0.0, 100.0, 0.0, 'puro', '1 colher de sopa · 12g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Manteiga com sal', 'GORDURA', 'GRAMAS', 100, 726.0, 0.4, 0.1, 82.4, 0.0, 'em pasta', '1 ponta de faca · 10g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Pasta de amendoim integral', 'GORDURA', 'GRAMAS', 100, 588.0, 25.0, 20.0, 50.0, 6.0, 'sem açúcar', '1 colher de sopa · 20g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Amendoim torrado sem sal', 'GORDURA', 'GRAMAS', 100, 544.0, 22.5, 20.3, 43.9, 8.0, 'torrado', '1 punhado pequeno · 30g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Castanha-do-pará (do Brasil)', 'GORDURA', 'GRAMAS', 100, 643.0, 14.5, 15.1, 63.5, 7.9, 'in natura', '2 unidades · 10g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Castanha-de-caju torrada', 'GORDURA', 'GRAMAS', 100, 570.0, 18.5, 29.1, 46.3, 3.7, 'torrada sem sal', '1 punhado pequeno · 25g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Nozes', 'GORDURA', 'GRAMAS', 100, 620.0, 14.0, 18.4, 59.4, 7.2, 'in natura', '3 metades · 15g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Amêndoas torradas', 'GORDURA', 'GRAMAS', 100, 581.0, 18.6, 29.5, 47.1, 11.6, 'sem sal', '10 unidades · 15g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Semente de chia', 'GORDURA', 'GRAMAS', 100, 486.0, 16.5, 42.1, 30.7, 34.4, 'em grãos', '1 colher de sobremesa · 10g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Semente de linhaça dourada', 'GORDURA', 'GRAMAS', 100, 495.0, 14.1, 43.3, 32.3, 33.5, 'triturada', '1 colher de sobremesa · 10g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Semente de abóbora tostada', 'GORDURA', 'GRAMAS', 100, 541.0, 24.5, 17.8, 45.8, 6.0, 'sem sal', '1 colher de sopa · 15g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Café sem açúcar pronto', 'BEBIDA', 'ML', 100, 2.0, 0.1, 0.3, 0.0, 0.0, 'filtrado', '1 xícara de café · 50ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Chá verde sem açúcar pronto', 'BEBIDA', 'ML', 100, 1.0, 0.0, 0.2, 0.0, 0.0, 'infusão', '1 xícara de chá · 150ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Chá de camomila sem açúcar pronto', 'BEBIDA', 'ML', 100, 1.0, 0.0, 0.2, 0.0, 0.0, 'infusão', '1 xícara de chá · 150ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Água de coco fresca', 'BEBIDA', 'ML', 100, 22.0, 0.0, 5.5, 0.0, 0.1, 'natural', '1 copo · 200ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Leite de vaca desnatado', 'BEBIDA', 'ML', 100, 35.0, 3.4, 4.9, 0.1, 0.0, 'pasteurizado', '1 copo · 200ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Leite de vaca semi-desnatado', 'BEBIDA', 'ML', 100, 45.0, 3.3, 4.8, 1.5, 0.0, 'pasteurizado', '1 copo · 200ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Leite de vaca integral', 'BEBIDA', 'ML', 100, 61.0, 3.2, 4.6, 3.3, 0.0, 'pasteurizado', '1 copo · 200ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Suco de laranja natural sem açúcar', 'BEBIDA', 'ML', 100, 45.0, 0.7, 10.4, 0.1, 0.2, 'espremido', '1 copo · 200ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Suco de uva integral 100%', 'BEBIDA', 'ML', 100, 60.0, 0.5, 14.7, 0.0, 0.1, 'sem adição de açúcar', '1 copo · 150ml', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Cacau em pó 100% puro', 'OUTRO', 'GRAMAS', 100, 228.0, 19.6, 57.9, 13.7, 33.2, 'pó sem açúcar', '1 colher de sobremesa · 10g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Chocolate amargo 70% cacau', 'OUTRO', 'GRAMAS', 100, 540.0, 7.8, 45.0, 38.0, 8.5, 'em barra', '2 quadradinhos · 20g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Mel de abelha puro', 'OUTRO', 'GRAMAS', 100, 309.0, 0.0, 84.0, 0.0, 0.2, 'puro', '1 colher de sopa · 20g', 0, NOW(), NOW()),
(gen_random_uuid(), NULL, 'Canela em pó', 'OUTRO', 'GRAMAS', 100, 247.0, 4.0, 80.6, 1.2, 53.1, 'pó', '1 colher de café · 3g', 0, NOW(), NOW());
