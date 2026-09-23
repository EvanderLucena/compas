# NutriAI — Tarefas pendentes

> Teste do AI reviewer — linha innocua pra gerar diff no PR

## Backend — Problemas ativos

- [x] **Backend falha ao subir: falta `NUTRIAI_JWT_SECRET`**  
  `java -jar` falha com `PlaceholderResolutionException: Could not resolve placeholder 'NUTRIAI_JWT_SECRET'`.  
  Corrigido: adicionado fallback em `application.yml` e `application-dev.yml` (`secret: ${NUTRIAI_JWT_SECRET:local-dev-secret-do-not-use-in-production}`).
- [x] **Banco PostgreSQL não disponível em desenvolvimento**  
  Não havia PostgreSQL local nem Docker rodando. Corrigido: container `nutriai-postgres` subiu via `docker compose -f docker/docker-compose.yml up -d postgres`. Backend rodando com profile `dev` e conectado no Postgres.  
  **Comando para subir:** `docker compose -f docker/docker-compose.yml up -d postgres`  
  **Comando para backend:** `java -jar backend/build/libs/nutriai-api-0.5.0.jar --spring.profiles.active=dev` (com `NUTRIAI_JWT_SECRET` e `NUTRIAI_SEED_ADMIN_PASSWORD` exportados)  
  **Verificação:** `curl http://localhost:8080/api/v1/health` → `{"status":"UP","db":"connected"}`  
  **E2E:** 85/85 passando (21.5s) ✅

- [x] `Editar plano` e `Novo registro > Plano alimentar` no topbar do PatientView chamam `setView('plans')` (rota removida). Corrigir para `setTab('plan')`.

---

## Fluxos sem destino (botões que não abrem nada)

- [x] **Corrigir extração** — Timeline · aba Hoje.
- [x] **Nova avaliação biométrica** — modal unificado com Bioimpedância, Pollock 7 dobras, Perimetria.
- [x] **Novo paciente** — modal: nome, nascimento, sexo, altura, objetivo, WhatsApp.
- [x] **Perfil do nutricionista** — modal com 3 abas: Dados Profissionais (edição de nome, CRN, especialidade, WhatsApp), Segurança & Senha (alteração de senha com validação BCrypt), Plano & Limites (status Trial, contagem de pacientes ativos vs limite).
- [x] **Filtrar** — painel inline em Pacientes: status, objetivo, atividade. Badge com nº de filtros ativos.
- [ ] **Importar TACO** — Alimentos. Out of scope por agora.
- [ ] **Exportar PDF** — Inteligência. Out of scope por agora.

---

## Telas incompletas / placeholder

- [x] **Histórico** (aba do paciente) — registros agrupados por dia, seletor 7d/14d/30d.
- [x] **Notificações** — removido do sistema.

---

## PlansView — editor funcional

- [x] **Edição inline dos alimentos** — campos kcal/prot/carb/gord editáveis diretamente na tabela; nome e quantidade também editáveis.
- [x] **`···` por alimento** — menu inline com Editar e Remover.
- [x] **Adicionar alimento** — busca no catálogo (FOODS_CATALOG) com seleção e inserção na opção ativa.
- [x] **Adicionar refeição** — modal simples: nome, horário, meta de kcal/macros.
- [x] **Nova opção** — duplica a opção atual como ponto de partida, nome editável.

---

## Outros

- [x] **HomeView** — PatientGrid no final sem paginação.
- [x] **InsightsView** — CarteiraChart sem hover/tooltip.

---

## Responsividade

- [x] **Sidebar colapsável** — em telas `< 1200px` a sidebar recolhe automaticamente; botão fixo no topbar permite abrir/fechar manualmente em qualquer tamanho. Rail permanece sempre visível.

---

## Telas P0 — Fluxo público (pré-login)

- [x] **Landing Page** (`view_landing.jsx`) — hero, como funciona com mockup de chat realista (cenário Xtudo), seção "Como a IA responde" (4 princípios), seção funcionalidades (8 features), diferencial de privacidade, pricing, FAQ, CTA final, footer.
- [x] **Login** (`view_login.jsx`) — email + senha, lembrar, Google OAuth, "esqueci senha", link p/ cadastro.
- [x] **Cadastro do Nutri** (`view_signup.jsx`) — 2 steps: dados pessoais (nome, email, senha) + perfil profissional (CRN, regional, especialidade, WhatsApp, termos LGPD).
- [x] **Onboarding** (`view_onboarding.jsx`) — 4 steps: carteira de pacientes, configurar plano, convidar pacientes, pronto.
- [x] **Roteamento público/privado** — App renderiza Landing/Login/Signup quando desautenticado; app principal quando autenticado.

---

## Landing Page — Iterações concluídas

- [x] **Pricing atualizado** — 3 planos pra nutricionista solo (sem clínica): Iniciante R$99,99 (até 15 pacientes), Profissional R$149,99 (até 30), Ilimitado R$199,99 (ilimitado). Todos com as mesmas funcionalidades, só muda qtde de pacientes. Trial 30 dias + auto-renova + cancele quando quiser.
- [x] **"Como funciona" com mockups visuais** — chat WhatsApp realista (cenário Xtudo com redução de danos), timeline de extração fiél ao app real (hora, dot, chip "EXTRAÍDO IA", lista de itens, macros em grid), dashboard com métricas e barra de progresso.
- [x] **Seção "Como a IA responde"** — 4 princípios: consulta o plano primeiro, redução de danos sem julgamento, dieta flexível não rígida, você vê resultado não conversa.
- [x] **Seção funcionalidades** — 8 features: WhatsApp, privacidade, planos alimentares, alimentos porcionados, dashboard, timeline biométrica, gestão de pacientes, inteligência agregada.
- [x] **Mockup catálogo de alimentos porcionados** — tabela com busca, alimentos já porcionados (Frango grelhado 150g, Arroz 120g, Batata doce 200g, Ovo 2 un.), macros calculados.
- [x] **Mockup evolução biométrica** — gráfico SVG de peso/%gordura em 6 meses, legenda com deltas (-5,1 kg, -4,3 pp).

---

## Telas P1 — A fazer

- [ ] **Integração de Pagamento & Assinaturas Stripe** (`/billing`) — Stripe Checkout integrado aos 3 planos (Iniciante R$99, Profissional R$149, Ilimitado R$199), Stripe Customer Portal para troca de cartão/faturas/cancelamento, webhook listener (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`), e controle de trial de 30 dias com bloqueio pós-vencimento.
- [ ] **Verificação de E-mail via Resend** — `ResendEmailService` no backend com fallback gracioso local em log, endpoints `POST /api/v1/auth/verify-email` e `POST /api/v1/auth/resend-verification`, banner de aviso no topo do dashboard para contas não verificadas e tela de confirmação `/verify-email`.
- [ ] **Painel Admin** — dashboard, nutris, instâncias WhatsApp, financeiro, logs.
- [ ] **Ajustes do Nutri** (`/settings`) — perfil, horário de atendimento, mensagem de boas-vindas, exportar dados (além do tema que já existe).

---

---

## Maturação Frontend — Resumo de conclusões (avaliação abril/2026)

### ✅ Concluído (PR #73 + avaliação codebase)

| Tarefa | Estado | Evidência |
|--------|--------|-----------|
| Remover fallback ANA em PatientView | ✅ | `mapPatientFromApi` + `usePatient()` sem mock |
| Dados fixos da Home | ✅ | `usePatients()` + `useDashboard()` com API real |
| Timeline ("Hoje") empty state | ✅ | Timeline.tsx exibe estado vazio quando sem registros |
| Insights empty state | ✅ | InsightsView já mostra mensagem pt-BR quando `total===0` |
| Sanitização numérica | ✅ | `parseNumberInput`/`sanitizeNumberInput` em todos os modais |
| `Number(value) || 0` silencioso | ✅ | AddFoodModal corrigido (PR #73) |
| Login fake via localStorage | ✅ | `auth.setup.ts` faz login real (PR #61) |
| `waitForTimeout` nos E2E | ✅ | Eliminados (PR #61) |
| Assumes condicionais | ✅ | Corrigidos (PR #64) |
| NewPatientModal validação | ✅ | Já usa `useValidation` com bounds e mensagens pt-BR |
| NewBiometryModal validação | ✅ | Já valida bounds clínicos (peso>0, bodyFat 0-100, etc.) |
| Seeds determinísticos | ✅ | Seed dev com pacientes/alimentos/planos |

### ⚠️ Parcial / Remanescente

| Tarefa | Estado | Observação |
|--------|--------|------------|
| PlanTab empty state | ⚠️ | Não implementado; baixo impacto — usuário pode criar plano |
| Alinhar obrigatórios biometria | ⚠️ | `% gordura` deve ser decidido (obrigatório vs opcional) com backend |
| Validar macros catálogo | ⚠️ | `kcal>0`, `prot>0`, etc. pendente em FoodsView |
| E2E fluxo biometria→dashboard | ❌ | Bloqueado: zero `data-testid` em componentes clínicos |
| E2E fluxo alimento→plano | ❌ | Bloqueado: idem |

### ❌ Decisão: data-testids sob demanda

Componentes clínicos (NewBiometryModal, PlanFoodRow, PatientsView) não têm `data-testid`. Adicionar agora custa ~1h mas não traz benefício imediato — fluxos estão estáveis e não serão tocados na Phase 07 (WhatsApp). **Adicionar quando necessário para Phase 07.**

---

## E2E / Playwright — Auditoria e melhorias (maio/2026)

> Auditados 11 arquivos de spec (~89 testes). Nota de confiabilidade: **5,5/10**.
> Maior problema: ~60% dos testes são API-only; UI core (planos, biometria, edição) quase não testada.
>
> **Top 5 melhorias de maior impacto:**
> 1. Criar fixture `authenticatedPage` para eliminar login duplicado nos `beforeEach` (~30-50s economizados por run)
> 2. Substituir seletores frágeis (`.btn.btn-primary`, `select.first()`, `[class*="card"]`) por `getByRole`/`getByLabel`
> 3. Adicionar `test.afterEach` com cleanup de API (deletar pacientes/alimentos criados)
> 4. Separar `journey.spec.ts` em testes independentes com asserts robustos no delete
> 5. Adicionar health-check do backend no `playwright.config.ts` (ou subir backend no webServer)
>
> **Achados críticos:**
> - `journey.spec.ts` tem `if+skip` em cascata no delete — teste pode passar sem deletar
> - `meal-plans.spec.ts` e `biometry-dashboard.spec.ts` são 100% API-only — UI pode quebrar sem detectar
> - `patient-management.spec.ts` renderiza páginas sem assert de autenticação ativa
> - `ui-integration.spec.ts` usa classes CSS + regex (`/.btn.btn-primary/`) — refatoração de CSS quebra tudo
> - `form-validation.spec.ts` tem assert condicional (`if (!isDisabled) { expect(...) }`) — pode passar sem validar nada
> - `patient-tabs.spec.ts` testa 5 abas em um único loop — uma aba quebrada quebra o teste inteiro
> - Múltiplos `waitForLoadState('networkidle')` — frágil em CI; preferir `await expect(...).toBeVisible()`
> - `expect([403, 404]).toContain(...)` — assert flexível mascara regressões de segurança
> - `fullyParallel: false` — execução serial degrada performance sem necessidade real
> - Login duplicado: `ui-integration.spec.ts`, `patient-tabs.spec.ts`, `form-validation.spec.ts` fazem signup+onboarding+login em cada `beforeEach`
>
> **Fluxos críticos não cobertos:**
> - Edição inline de alimentos no plano (add option, edit food row, remove meal)
> - Mudança de status do paciente via UI (ontrack → warning → danger)
> - Onboarding completo via UI
> - Paginação real na lista de pacientes
> - Filtro por status na lista de pacientes
> - Gráficos de biometria (timeline, charts)
> - Tela de alimentos: edição via UI
> - Logout e expiração de token
> - Responsividade mobile
>
> **Tarefas concretas:**
> - [x] Criar Playwright fixture `authenticatedPage` (reutiliza storageState, evita login duplicado)
> - [x] Substituir seletores frágeis em `journey.spec.ts`, `ui-integration.spec.ts`, `form-validation.spec.ts`
> - [x] Separar `journey.spec.ts` em testes independentes
> - [x] Separar `patient-tabs.spec.ts` em testes independentes por aba
> - [x] Adicionar `afterEach` cleanup em specs de API-only (`meal-plans`, `numeric-normalization`, `biometry-dashboard`)
> - [x] Acrescentar testes UI→API para Meal Plans (adicionar refeição)
> - [x] Acrescentar testes UI→API para Biometria (registrar avaliação)
> - [x] Acrescentar teste de erro visível para cada mutation (409 signup duplicado via `form-validation.spec.ts`)
> - [x] Adicionar `data-testid` em componentes clínicos (NewPatientModal, EditPatientModal, AddMealModal, NewBiometryModal, FoodsView, PatientView)
> - [x] Configurar `webServer` do backend em `playwright.config.ts` (health-check + reuseExistingServer)

---

## Produto / Frontend — maturação incremental

### Frontend truthfulness / remoção de mocks

- [x] **Remover fallback ANA do PatientView** — já removido em fases anteriores; PatientView usa `usePatient()` com dados reais da API.
- [x] **Mapear imports de `frontend/src/data/*` em views** — nenhum uso remanescente; apenas testes/fixtures aceitáveis.
- [x] **Substituir dados fixos da Home** — HomeView usa `usePatients()` + `useDashboard()` com dados reais.
- [x] **Separar "Hoje" real vs futuro WhatsApp** — Timeline.tsx exibe empty state quando `patient.timeline` vazio (PR #73).
- [x] **Separar "Insights" real vs futuro IA** — InsightsView já mostra empty state honesto.
- [x] **Revisar estados loading/error/empty** — TodayTab e HistoryTab com empty states explícitos (PR #73). **Resta:** PlanTab quando não há plano.

### Onboarding como mini tutorial

- [x] **Reposicionar Onboarding como tour guiado** — deixar claro que é tutorial de produto, não assistente de configuração real.
- [x] **Remover promessas falsas do Onboarding** — retirar steps/CTAs que sugerem convite WhatsApp, pagamento, plano configurado ou pacientes criados quando isso não persiste.
- [x] **Criar roteiro de steps do tutorial** — boas-vindas, carteira de pacientes, detalhe do paciente, plano alimentar, biometria/histórico e próximo passo.
- [x] **CTA final honesto** — oferecer "Criar primeiro paciente" e "Explorar painel", sem simular automações futuras.
- [x] **Persistir conclusão do tutorial** — marcar onboarding como concluído apenas quando o usuário finalizar/pular o tour.
- [ ] **Playwright do tutorial** — validar navegação next/back/skip/finalizar e redirecionamento final.

### Validação e acabamento de formulários

- [x] **Sanitizar todos os inputs numéricos** — AddFoodModal, NewBiometryModal, EditFoodCatalogModal e CreateFoodModal em FoodsView. Usam `sanitizeNumberInput`/`parseNumberInput` (PR #73 corrigiu `|| 0` silencioso).
- [x] **Padronizar validação frontend** — EditPatientModal usa `useValidation` com mensagens pt-BR, `aria-invalid`, bloqueio de submit e feedback em tempo real. NewPatientModal idem.
- [x] **Paciente: validar cadastro/edição** — `useValidation` valida nome (mín 2 chars), objetivo (obrigatório), nascimento (não futuro), altura 50-250 cm, WhatsApp 10/11 dígitos. Mensagens pt-BR com `requiredMessage`/`custom`.
- [x] **Biometria: validar faixas clínicas** — NewBiometryModal `useValidation` + `validateAll` verifica: peso > 0, bodyFat 0-100%, visceralFat inteiro, TMB > 0, dobras/perimetria > 0. Erros por campo com `aria-invalid`.
- [ ] **Biometria: alinhar obrigatórios com backend** — decidir se `% gordura` é obrigatório ou opcional; ajustar `required` na validação frontend e `@NotNull` no backend juntos.
- [x] **Alimentos: impedir `Number(value) || 0` silencioso** — AddFoodModal `getMacroPreview` corrigido (PR #73): usa `Number.isFinite(ref)` em vez de `|| 0`.
- [ ] **Alimentos: validar macros e unidade** — quantidade de referência, kcal, proteína, carboidrato, gordura e fibra com mínimos/faixas plausíveis.
- [ ] **Plano alimentar: validar refeições e itens** — nome, horário, quantidade e exclusões/renomeações com feedback confiável.
- [ ] **Consolidar modais duplicados de edição de paciente** — analisar se NewPatientModal e EditPatientModal divergem significativamente.

### Seeds e dados reais de desenvolvimento

- [x] **Criar seed dev determinístico** — nutricionista demo, pacientes, avaliações, alimentos, planos e histórico suficiente para explorar o app manualmente.
- [x] **Separar seed dev de fixtures de teste** — seed para uso local; Playwright deve criar dados próprios via API.
- [ ] **Documentar como iniciar ambiente com dados demo** — comando/profile claro para backend + banco + frontend.
- [x] **Garantir seed seguro** — não ativar dados demo em produção e não depender de senha real commitada.

### Playwright e testes reais de fluxo

- [x] **Remover `waitForTimeout` dos E2E críticos** — eliminados em PR #61; substituídos por `toBeVisible`/`toHaveURL`/`waitForResponse`.
- [x] **Evitar login falso via localStorage em fluxos principais** — `auth.setup.ts` faz login real via fill + click + redirect (PR #61).
- [x] **Eliminar asserts condicionais que pulam cobertura** — PR #64 corrigiu assert condicional em `form-validation.spec.ts`.
- [x] **Fluxo real: validações de formulário** — `form-validation.spec.ts` testa signup/login/patient/biometry com asserts exatos (PR #66).
- [x] **Fluxo real: navegação por abas do paciente** — `patient-tabs.spec.ts` valida Hoje/Plano/Biometria/Inteligência/Histórico (PR #68).
- [x] **Jornada completa E2E** — `journey.spec.ts` cobre signup → paciente → alimento → plano → biometria → exclusão (PR #69).
- [ ] **Separar E2E de contratos API** — manter contratos (ainda ~70%), mas criar mais jornadas end-to-end puras.
- [ ] **Fluxo real: signup/login → criar paciente pela UI** — parcial (journey.spec.ts cobre parte).
- [x] **Fluxo real: paciente → biometria → dashboard** — coberto via `journey-biometry.spec.ts` (registro de biometria + reflexo em UI/API).
- [x] **Fluxo real: alimento → plano alimentar** — coberto via `journey-plan.spec.ts` (add option, inline edit, remoções com persistência).

> **Nota arquitetural (E2E):** `data-testid` é atributo HTML estável para testes. Hoje só existe em LoginView/SignupView. Componentes clínicos (NewBiometryModal, PlanFoodRow, PatientsView) carecem de testids. Decisão: adicionar **sob demanda** quando Phase 07 (WhatsApp) refatorar PatientView. Custo (~1h) não justifica benefício hoje pois fluxos clínicos estão estáveis e não serão tocados na próxima fase.

### MCP Playwright Audit — Achados (maio/2026) — rodada de correção

- [x] **`/logout` com 404** — corrigido com rota dedicada que executa logout real e redireciona para `/`.
- [x] **Onboarding não persistia paciente adicionado** — corrigido; pacientes adicionados no step 1 agora são criados via API antes de concluir/pular onboarding.
- [x] **PatientView mostrava dados fantasmas para paciente novo** — corrigido; `% gordura`, observações e estados vazios agora refletem ausência de dados reais.
- [x] **`NaN%` em macros no PatientView** — corrigido em `MacroRings` quando target é `0`.
- [x] **Nested `<button>` em PlansView (hidratação/acessibilidade)** — corrigido; item da refeição não usa mais botão dentro de botão.
- [x] **Copy misto pt-BR/EN na Landing ("A IA always...")** — corrigido para pt-BR.
- [x] **`Exportar PDF` no PlansView fora do escopo atual** — removido da UI do fluxo de plano.
- [x] **Sidebar mobile interceptando clique quando colapsada** — mitigado com `pointer-events: none` no estado colapsado e sync de estado no resize.
- [ ] **`Exportar PDF` em Inteligência** — continua fora de escopo por ora (mantido pendente conforme backlog).

### Plano de execução separado — E2E crítico (Playwright + MCP)

> Objetivo: separar claramente **cobertura**, **correção de produto** e **validação exploratória**.

#### Fase A — Criar cobertura E2E no projeto (`frontend/e2e`)

- [x] Auth + onboarding + sessão: `signup → onboarding completo → home`, `login → logout`, expiração/refresh.
- [x] Pacientes: criar/editar/ativar-desativar, filtro por status, busca e paginação real.
- [x] Plano alimentar: add meal, add option, edição inline, remove item/remove meal, totais.
- [x] Biometria + dashboard + histórico: registrar biometria e validar reflexo nas telas.
- [x] Alimentos + inteligência + mobile: edição via UI, estados empty/data, fluxos mobile críticos.
- [x] Remover fragilidades remanescentes (asserts condicionais, waits frágeis, seletores instáveis).

> Atualização (05/05/2026): concluídos os novos E2E de onboarding completo, logout por rota dedicada com invalidação de sessão, filtro por status e paginação real de pacientes, com execução verde em `journey-auth.spec.ts` e `patient-management.spec.ts` (22/22).
>
> Atualização (05/05/2026 — rodada 2): adicionados e validados (8/8) os cenários `journey-plan`, `journey-biometry` e `journey-food` cobrindo:
> - plano alimentar via UI com `nova opção` + `adicionar alimento` e persistência no backend;
> - biometria via UI com verificação de fluxo até histórico;
> - alimentos via UI com edição persistida e smoke de responsividade mobile.
> Pendências da Fase A mantidas abertas apenas para os pontos ainda não cobertos explicitamente (ex.: remoção de refeição/item e bateria mais ampla de inteligência/mobile).
>
> Atualização (05/05/2026 — rodada 3): incluído `E2E-J-12` para remoção de refeição via UI com validação de persistência no backend, e removido `waitForTimeout` remanescente em `journey-plan.spec.ts`. Bateria consolidada dos fluxos alterados: 30/30 passando.
>
> Atualização (05/05/2026 — rodada 4): concluído o fechamento de plano alimentar com `E2E-J-13` (edição inline + remoção de item com persistência), além de `E2E-J-12` (remoção de refeição). Bloco de plano da Fase A marcado como concluído.
>
> Atualização (05/05/2026 — rodada 5): concluídos `E2E-J-08`, `E2E-J-10`, `E2E-J-14` e `E2E-J-15` cobrindo biometria com reflexo em UI/API, insights com estado empty/data e fluxo mobile crítico (`home → pacientes → foods`). Também removidos waits frágeis e assert condicional remanescente em `form-validation.spec.ts`. Execução focal: 11/11 passando (`journey-biometry`, `journey-food`, `journey-patient`, `form-validation`).

#### Fase B — Corrigir sistema guiado pelas falhas dos E2E

- [x] Rodar suíte E2E completa e consolidar bugs reais por severidade.
- [x] Corrigir primeiro P0/P1 (quebra de fluxo, perda de dados, inconsistência crítica).
- [x] Reexecutar suíte a cada pacote de correção até estabilizar sem regressão.
- [x] Registrar no `TASKS.md` cada bug fechado com evidência do teste que passou.

> Atualização (05/05/2026 — Fase B rodada 1): suíte E2E completa executada com sucesso (`npm run test:e2e`) com **110/110 passando** em ~31.6s. Não houve bugs P0/P1 abertos nesta rodada; sistema considerado estável para avançar para validação exploratória da Fase C (MCP browser).

#### Fase C — Bateria QA manual no MCP (browser)

- [x] Executar fluxos críticos no MCP Playwright (desktop e mobile) como validação exploratória final.
- [x] Confirmar comportamento visual/UX que testes automatizados não capturam bem.
- [x] Registrar achados finais (bugs, melhorias e pendências out-of-scope).

> Atualização (05/05/2026 — Fase C rodada 1): validação manual executada via MCP browser cobrindo onboarding/auth (tentativa real), PatientView (abas + biometria + revisão de status), Foods (modal de criação) e navegação mobile (`390x844`) entre home/pacientes/alimentos.
>
> **Achado aberto (MCP/manual):** signup retorna `403` quando app é aberto em `http://127.0.0.1:4173` com resposta `Invalid CORS request` no `POST /api/v1/auth/signup`. Em `http://localhost:5173` o fluxo segue normal. Classificação: **P1 ambiente/config** (origens localhost vs 127.0.0.1).
>
> **Resultado geral Fase C:** fluxos críticos em `localhost` funcionais e consistentes com os E2E; pendência principal é alinhamento de CORS/origem para evitar falso negativo em ambiente manual.

#### Matriz: Fluxo crítico pendente → fase

- [x] Edição inline de alimentos no plano (add option, edit food row, remove meal) → **Fase A + B + C**
- [x] Mudança de status do paciente via UI (ontrack → warning → danger) → **Fase A + B + C**
- [x] Onboarding completo via UI → **Fase A + B + C**
- [x] Paginação real na lista de pacientes → **Fase A + B + C**
- [x] Filtro por status na lista de pacientes → **Fase A + B + C**
- [x] Gráficos de biometria (timeline, charts) → **Fase A + B + C**
- [x] Tela de alimentos: edição via UI → **Fase A + B + C**
- [x] Logout e expiração de token → **Fase A + B + C**
- [x] Responsividade mobile → **Fase A + B + C**

#### Critério de pronto (DoD)

- [x] Cobertura E2E criada para todos os fluxos críticos acima (UI real).
- [x] Correções de produto aplicadas para falhas relevantes encontradas pela suíte.
- [x] Validação manual MCP concluída com registro dos achados finais.

---

## Telas P2 — A fazer

- [ ] **Convite do Paciente** — revisar escopo antes de implementar; não incluir "Copiar link" se o produto não for usar convite WhatsApp.
- [ ] **Status IA no paciente** — badge conectado/inativo no PatientView.
- [ ] **Recuperação de senha via E-mail (Resend)** — fluxo "esqueci minha senha" com token seguro e disparo transacional.
- [ ] **Notificações globais** — push, email ou in-app.

---

## Decisões de negócio registradas

- **Público-alvo:** apenas nutricionistas solo (sem clínicas/multi-nutri por enquanto)
- **Pricing:** Iniciante R$99,00 (até 15 pacientes) · Profissional R$149,00 (até 35 pacientes) · Ilimitado R$199,00 (ilimitado) — opção anual com 2 meses grátis (10x da mensalidade)
- **Gateway de Pagamento:** Stripe (Stripe Checkout + Stripe Customer Portal com gestão autônoma de cartões, faturas e cancelamentos)
- **Trial:** 30 dias grátis para explorar o painel sem travar o onboarding
- **Todos os planos = mesmas funcionalidades**, a única diferença é a quantidade de pacientes ativos na carteira
- **Provedor de E-mail Transacional:** Resend (plano gratuito até 3.000 envios/mês via API REST)
- **IA:** responde sempre com base no plano alimentar do paciente, nunca inventa; abordagem de redução de danos e dieta flexível
- **Alimentos porcionados:** cadastrados uma vez, reutilizados em qualquer plano
- **Timeline biométrica:** peso, dobras, perimetria acompanhados como timeline por consulta, com gráficos de evolução

---

## Entrega de Documentos sob Demanda (WhatsApp / Painel)

> Funcionalidade para envio automatizado de documentos clínicos gerados sob demanda com o cabeçalho oficial do nutricionista (Nome, CRN regional `CRN-X 12345`, especialidade e WhatsApp de contato).

- [ ] **1. Plano Alimentar Completo (PDF Oficial)**  
  - **Gatilho:** Paciente pede no WhatsApp (*"Pode me mandar o PDF da minha dieta?"*, *"Perdi meu plano"*) ou o nutricionista clica em "Exportar PDF" no painel.  
  - **Estrutura:** Cabeçalho clínico oficial com dados da nutri, identificação do paciente, horários das refeições, alimentos com gramaturas/porções de referência, opções alternativas/substitutas e extras acordados.

- [ ] **2. Lista de Compras da Semana (PDF / Checklist WhatsApp)**  
  - **Gatilho:** Paciente pede no WhatsApp (*"Tô no mercado, pode me mandar a lista de compras da semana?"*).  
  - **Estrutura:** Varre os alimentos do plano alimentar ativo e consolida por setores do supermercado (*Hortifrúti*, *Açougue & Ovos*, *Mercearia & Grãos*, *Laticínios*).  
  - **Formato:** Mensagem rápida com caixas de seleção `[ ]` no chat ou PDF compacto para compras.

- [ ] **3. Relatório de Evolução Biométrica (PDF)**  
  - **Gatilho:** Paciente solicita progresso no WhatsApp (*"Consegue me mandar meu progresso desse mês?"*) para motivação ou para apresentar ao médico/personal.  
  - **Estrutura:** Histórico das avaliações biométricas cadastradas (peso, IMC, dobras, circunferências corporais e gráficos de tendência) com a assinatura visual da nutri.

---

## Code Quality — Próximos passos

### Alto valor ✅

- [x] **Coverage floors no CI** — JaCoCo `jacocoTestCoverageVerification` (INSTRUCTION 50%, BRANCH 30%) + vitest `coverage.thresholds` (10% lines, 20% functions/branches)
- [x] **`@PreAuthorize` em todos os controllers** — PatientController + AuthController (/logout, /me, /onboarding) + ArchUnit rule
- [x] **ArchUnit rules (6)** — controller↛repository, service↛controller, repository↛service, no package cycles, DTOs↛repositories, controllers must have @PreAuthorize
- [x] **Husky + lint-staged** — pre-commit: prettier on staged ts/tsx files. ESLint runs in CI.

### Valor médio

- [ ] **springdoc-openapi** — Swagger UI auto-gerado. Útil quando integração WhatsApp (Phase 7) precisar de contract.
- [ ] **PMD addon ao Checkstyle** — bugs como empty catch, `==` em strings. Depois que Checkstyle estiver estável.

### Parked (revisitar quando trigger acontecer)

- [ ] **Mutation testing** (PIT + StrykerJS) — quando suite >30 arquivos ou testes de IA fracos detectados
- [x] **PostgreSQL RLS** — ativado em todas as 16 tabelas tenant via migração V24 + TenantContext + TenantAwareDataSource (PR #133) ✅
- [ ] **Audit logging** — quando dados reais de saúde em produção
- [ ] **Error Prone** (compilador Java) — depois que PMD estiver estável
- [ ] **SonarQube Community** — quando time crescer (hoje overhead > valor pra solo dev)

---

## Prioridade sugerida

1. ~~Edição inline dos alimentos (PlansView)~~ ✅
2. ~~`···` por alimento → editar/remover~~ ✅
3. ~~Adicionar alimento (busca no catálogo)~~ ✅
4. ~~Adicionar refeição / Nova opção~~ ✅
5. ~~Home — paginação do grid~~ ✅
6. ~~Insights — hover no gráfico~~ ✅
7. ~~Landing Page + Cadastro + Login + Onboarding~~ ✅
8. ~~Landing iterada: pricing, mockups, IA, funcionalidades~~ ✅
9. Painel Admin (mínimo viável)
10. Tela de Pagamento
11. Ajustes do Nutri
