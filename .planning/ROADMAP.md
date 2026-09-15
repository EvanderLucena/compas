# Roadmap: NutriAI

## Overview

Migrate a functional single-file prototype to a production SaaS for solo nutricionistas in Brazil — preserving 90% of the existing UI while building a real backend (Java 21 + Spring Boot + PostgreSQL), adding WhatsApp AI as the core differentiator, and enabling self-service billing with LGPD compliance. The journey goes from monorepo scaffolding through core clinical features to AI-powered WhatsApp conversations, then wraps with billing, legal compliance, and automated deployment.

## Testing Standards

Every phase must include tests as part of its "Done" criteria. No phase is complete without:

### Frontend (Vitest + Testing Library)
- **Unit tests** for stores (`*.test.ts`) — state transitions, error handling, async flows
- **Component tests** for views (`*.test.tsx`) — rendering, user interactions, form validation
- Run: `npm test` (vitest run) or `npm run test:watch` (watch mode)

### Backend (JUnit 5 + Mockito)
- **Unit tests** for services and controllers — business logic, validation, auth
- Run: `./gradlew test` (from backend/)

### E2E (Playwright)
- **End-to-end tests** for critical user flows (`e2e/*.spec.ts`)
- Requires backend + frontend running
- Run: `npm run test:e2e` (from frontend/)

### Verify Gates
- After modifying frontend: `npx tsc --noEmit` must pass
- After modifying backend: `./gradlew compileJava` must pass
- After completing a task: relevant test suite must pass

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 01: Monorepo & Infrastructure** - Working dev environment with all services booting together
- [x] **Phase 02: Frontend Migration** - All prototype UI preserved in Vite+TS+Tailwind modern build
- [x] **Phase 03: Authentication & Onboarding** - Real accounts, JWT sessions, trial activation, onboarding flow
- [x] **Phase 04: Patient Management** - Patient CRUD with status tracking, search, and data isolation
- [x] **Phase 05: Meal Plans & Food Catalog** - Complete meal plan editor with food catalog and macro calculation
- [x] **Phase 06: Dashboard & Biometry** - Clinical dashboard, biometric recording, and evolution charts
- [x] **Phase 07: WhatsApp Intelligence** - AI conversations via WhatsApp with meal extraction and timeline (completed 2026-05-05)
- [ ] **Phase 07.1: Estabilização de CRUDs & Pente Fino (INSERTED)** - Correção de ciclo de vida de modais, normalização de telefone, loop do onboarding e validação de macros
- [ ] **Phase 07.2: WhatsApp Inteligente & IA Multimodal (INSERTED)** - Número Central NutriAI, áudio com Whisper, visão de prato e Tool Calling
- [ ] **Phase 08: Billing & Subscriptions** - Stripe checkout, subscription management, patient limit enforcement
- [ ] **Phase 09: LGPD Compliance** - Consent collection, terms/privacy pages, data export and deletion
- [ ] **Phase 10: CI/CD & Deployment** - Automated deployment pipeline to production VPS

## Phase Details

### Phase 01: Monorepo & Infrastructure
**Goal**: Development environment is reproducible and all services boot together
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Developer can clone the repo and run `docker-compose up` to start frontend, backend, PostgreSQL, and Evolution API containers
  2. Backend boots with an accessible health endpoint and PostgreSQL connection established
  3. Frontend serves from Vite dev server with hot reload inside the Docker environment
  4. Flyway migrations run automatically on backend startup creating the initial database schema
**Tests (infrastructure)**:
  - Docker Compose health check passes for all services
  - Backend `/health` endpoint returns 200 with database status
  - Frontend Vite dev server starts and serves the app
**Plans:** 3 plans in 2 waves
Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold + Spring Boot backend skeleton
- [x] 01-02-PLAN.md — Frontend scaffold with Tailwind theme and component library
- [x] 01-03-PLAN.md — Docker Compose integration and verification

### Phase 02: Frontend Migration
**Goal**: All prototype UI works in a modern build pipeline without runtime Babel
**Depends on**: Phase 01
**Requirements**: INFRA-02
**Success Criteria** (what must be TRUE):
  1. All 14+ prototype screens and components compile as TypeScript modules with proper ES imports (no window globals)
  2. Light and dark themes render identically to the prototype (CSS custom properties mapped to Tailwind config)
  3. All prototype interactions work: sidebar collapse, modals, table/grid toggle, pagination, tab navigation
  4. App builds as a Vite production bundle with zero Babel standalone dependency
  5. All SVG visualizations (Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar) render correctly
**Tests (component)**:
  - Vitest component tests for each migrated view (rendering, interactions)
  - `npx tsc --noEmit` passes with zero errors
  - Vite production build succeeds (`npm run build`)
**Plans:** 8/8 plans executed
Plans:
- [x] 02-01-PLAN.md — Icons, types, data, and visualization components
- [x] 02-02-PLAN.md — App shell, routing, styles, and stub views
- [x] 02-03-PLAN.md — Landing and auth views (Landing, Login, Signup, Onboarding)
- [x] 02-04-PLAN.md — Dashboard and patient list views (HomeView, PatientsView)
- [x] 02-05-PLAN.md — Patient detail view with tabs, timeline, biometry
- [x] 02-06-PLAN.md — Meal plans, food catalog, and insights views
- [x] 02-07-PLAN.md — UAT gap fixes: theme tokens, deletion confirmation, login disabled state
- [x] 02-08-PLAN.md — Verification gap closure: hardcoded colors + wire orphaned viz components

### Phase 03: Authentication & Onboarding
**Goal**: Nutritionists can create real accounts and begin using the application
**Depends on**: Phase 02
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can sign up with email and password, creating a persistent account in PostgreSQL
  2. Nutritionist can log in and stay logged in across browser sessions via JWT
  3. Nutritionist can log out from any page, invalidating the session
  4. A 30-day free trial is automatically activated on signup
  5. Nutritionist completes the 4-step onboarding flow (carteira, plano, convite, pronto) after first signup
**Tests**:
  - **Backend (JUnit 5)**: AuthController, AuthService, JwtService — 29 unit tests
  - **Frontend (Vitest)**: authStore (12), LoginView (8), SignupView (8) — 28 unit tests
  - **E2E (Playwright)**: signup flow, duplicate email, auth navigation, wrong password, protected route — 6 tests
  - Integration tested: 55/61 pass, bugs fixed (enum, CORS, Set-Cookie, field errors)
**Plans:** 3 plans in 2 waves
Plans:
- [x] 03-01-PLAN.md — Backend authentication: Spring Security, JWT, auth endpoints, Flyway V2
- [x] 03-02-PLAN.md — Frontend auth wiring: LoginView, SignupView, OnboardingView, authStore refactor
- [x] 03-E2E-TEST-PLAN.md — E2E auth test strategy and coverage plan

### Phase 04: Patient Management
**Goal**: Nutritionists can manage their patient roster with complete data isolation
**Depends on**: Phase 03
**Requirements**: PAT-01, PAT-02, PAT-03, PAT-04
**Success Criteria** (what must be TRUE):
  1. Nutritionist can create, edit, and deactivate patients with all demographic and clinical fields
  2. Patient list displays status tracking (on-track, attention, critical) with search and filter by status and objective
  3. Each nutritionist sees only their own patients — no cross-data leakage between accounts
  4. Patient detail view loads with all 5 tabs (Hoje, Plano, Biometria, Insights, Histórico) showing real data
**Tests**:
  - **Backend (JUnit 5)**: PatientController, PatientService — CRUD, search, filter, data isolation (nutritionist scope)
  - **Frontend (Vitest)**: patientStore — state transitions, API calls, filters; PatientsView — rendering, search, table/grid toggle; PatientView — tab navigation, detail loading
  - **E2E (Playwright)**: create patient, edit patient, search/filter, data isolation between accounts
**Plans:** 2 plans in 2 waves
Plans:
- [x] 04-01-PLAN.md — Backend Patient CRUD with data isolation (entities, API, tests)
- [x] 04-02-PLAN.md — Frontend patient management wiring (store, views, E2E tests)

### Phase 05: Meal Plans & Food Catalog
**Goal**: Nutritionists can create complete meal plans using the food catalog
**Depends on**: Phase 04
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can create and edit meal plans with meals, options, and individual foods using inline editing
  2. Food catalog provides base items (per 100g) and preset items (portioned) with search and pagination
  3. Macronutrients (kcal, protein, carbs, fat) are calculated automatically as foods are added to a plan
  4. Multiple food options can be added per meal slot and nutritionist can switch between them
  5. Extras and out-of-plan foods can be authorized and tracked within the meal plan
**Tests**:
  - **Backend (JUnit 5)**: PlanController, PlanService, FoodController, FoodService — CRUD, macro calculation, plan-patient linkage
  - **Frontend (Vitest)**: planStore, foodStore — state, API, macro math; PlansView — inline editing, macro totals; FoodsView — search, pagination, create/edit
  - **E2E (Playwright)**: create meal plan, add foods, macro calculation, edit/delete food from catalog
**Plans:** 3 plans in 2 waves
Plans:
- [x] 05-01-PLAN.md — Backend entities, food catalog, meal plan API, macro calculation, auto-creation
- [x] 05-02-PLAN.md — Frontend types, API modules, stores, view wiring, auto-save UI components
- [x] 05-03-PLAN.md — Unified food model refactor across backend and frontend

### Phase 06: Dashboard & Biometry
**Goal**: Nutritionists can track patient biometrics and see clinical insights on the dashboard
**Depends on**: Phase 4, Phase 5
**Requirements**: BIO-01, BIO-02, BIO-03
**Success Criteria** (what must be TRUE):
  1. Nutritionist can record biometric assessments (bioimpedance, skinfolds, perimetry) with date-stamped entries per patient
  2. Dashboard home shows KPIs (active patients, adherence indicators, trends) and a patient grid with real data
  3. Biometric evolution charts display weight and body fat percentage over time using real assessment data
  4. All SVG visualizations render with real biometric data (not mock data)
**Tests**:
  - **Backend (JUnit 5)**: BiometryController, BiometryService — CRUD assessments, date validation, scope isolation
  - **Frontend (Vitest)**: HomeView — KPI rendering with real data; PatientView biometry tab — recording, evolution charts
  - **E2E (Playwright)**: record biometry, view evolution chart, dashboard KPIs show real patient data
**Plans:** 5 plans in 4 waves
Plans:
- [x] 06-01-PLAN.md — Schema, entities, and repositories for biometry and episode history
- [x] 06-02-PLAN.md — Biometry CRUD service, controller, DTOs, and tests
- [x] 06-03-PLAN.md — Dashboard aggregate endpoint and closed-cycle history snapshots
- [x] 06-04-PLAN.md — Lifecycle event emission (PatientService, MealPlanService)
- [x] 06-05-PLAN.md — Frontend dashboard/biometry/history wiring, tests, and E2E
**UI hint**: yes

### Phase 07: WhatsApp Intelligence
**Goal**: Patients can interact with the AI via WhatsApp and nutritionists see extracted meal data
**Depends on**: Phase 05, Phase 6
**Requirements**: WA-01, WA-02, WA-03, WA-04, WA-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can generate a unique WhatsApp activation link per patient
  2. Patient sends messages via WhatsApp and receives AI responses based on their meal plan context
  3. AI extracts meal data from patient messages (text, audio, photo acknowledgments) and registers them in the patient's timeline
  4. Nutritionist sees WhatsApp-captured meal data in the patient's timeline view
  5. Shared WhatsApp number architecture works (1 number serving multiple nutritionists' patients without cross-talk)
**Tests**:
  - **Backend (JUnit 5)**: WebhookController, ConversationService, ExtractionService — webhook handling, message routing, meal extraction, cross-tenant isolation
  - **Frontend (Vitest)**: conversation/timeline store — message display, extraction status; PatientView timeline — showing captured data
  - **E2E (Playwright)**: generate activation link, send message (mock webhook), verify timeline update
**Plans:** 3/3 plans complete
Plans:
- [x] 07-01-PLAN.md — Infrastructure, data model, webhook endpoint, and async queue
- [x] 07-02-PLAN.md — LLM integration, meal extraction, response generation, and Evolution API
- [x] 07-03-PLAN.md — Frontend wiring, API endpoints, timeline, activation UI, and E2E tests
**UI hint**: yes

### Phase 07.1: Estabilização de CRUDs & Pente Fino (INSERTED)
**Goal**: Eliminar falhas silenciosas de cadastro, destravar o onboarding e blindar a persistência de dados clínicos
**Depends on**: Phase 07
**Success Criteria** (what must be TRUE):
  1. Modais de criação e edição (Paciente, Alimento, Refeição) só fecham em caso de sucesso; erros de API mantêm os campos preenchidos e exibem a mensagem da API
  2. Telefone do paciente é normalizado via PhoneNormalizationService ao ser salvo no banco
  3. Onboarding não entra em loop infinito quando o cadastro de um paciente falha
  4. Validações de macros no cadastro de alimentos no frontend batem com os requisitos @NotNull do backend
  5. Constraint de duplicidade de nomes é relaxada para permitir homônimos
**Plans**: 3 plans
- [ ] 07.1-01-PLAN.md — Ciclo de vida dos modais e tratamento de erros de API
- [ ] 07.1-02-PLAN.md — Normalização de WhatsApp e fix do onboarding
- [ ] 07.1-03-PLAN.md — Alinhamento de macros de alimentos e constraint de homônimos

### Phase 07.2: WhatsApp Inteligente & IA Multimodal (INSERTED)
**Goal**: Transformar a IA do WhatsApp em um copiloto clínico empático com audição, visão e canal centralizado
**Depends on**: Phase 07.1
**Success Criteria** (what must be TRUE):
  1. Pacientes conversam com a IA através do Número Central da plataforma (sem exigir chip do nutricionista)
  2. Áudios enviados por pacientes são transcritos via Whisper e compreendidos pela IA
  3. Fotos de pratos são analisadas por modelo de visão multimodal com estimativa de macros
  4. Extração de refeição usa Tool Calling desacoplado da resposta conversacional
**Plans**: 3 plans
- [ ] 07.2-01-PLAN.md — Configuração e roteamento do Número Central NutriAI
- [ ] 07.2-02-PLAN.md — Transcrição de áudio em tempo real com Whisper
- [ ] 07.2-03-PLAN.md — Visão multimodal de pratos e Tool Calling

### Phase 08: Billing & Subscriptions
**Goal**: Nutritionists can subscribe, pay, and have plan limits enforced
**Depends on**: Phase 3, Phase 4
**Requirements**: BILL-01, BILL-02, BILL-03, PAT-05
**Success Criteria** (what must be TRUE):
  1. Nutritionist can complete checkout via Stripe with PIX and credit card payment options
  2. Nutritionist can manage their subscription — upgrade, downgrade, or cancel — from within the app
  3. Patient creation is enforced based on subscription tier (15 for Iniciante, 30 for Profissional, unlimited for Ilimitado)
  4. Trial expiration triggers subscription prompt blocking access to paid features
**Tests**:
  - **Backend (JUnit 5)**: BillingController, SubscriptionService — Stripe webhook handling, tier enforcement, trial expiration logic
  - **Frontend (Vitest)**: billingStore — subscription state, tier checks; OnboardingView — plan selection, payment form validation
  - **E2E (Playwright)**: checkout flow (with Stripe test mode), subscription management, patient limit enforcement, trial expiration redirect
**Plans**: TBD
**UI hint**: yes

### Phase 09: LGPD Compliance
**Goal**: Application complies with Brazilian data protection requirements for health data
**Depends on**: Phase 4, Phase 5, Phase 6, Phase 7
**Requirements**: LGPD-01, LGPD-02, LGPD-03
**Success Criteria** (what must be TRUE):
  1. Explicit consent is collected at signup (terms acceptance) and patient registration (health data processing consent)
  2. Terms of service and privacy policy pages are publicly accessible and linkable
  3. Nutritionist can export all their data and request full account deletion
**Tests**:
  - **Backend (JUnit 5)**: ConsentController, DataExportService — consent recording, data export, account deletion, anonymization
  - **Frontend (Vitest)**: consent flow — checkbox validation, consent version tracking; data export UI — download trigger
  - **E2E (Playwright)**: signup consent flow, terms/privacy page access, data export download, account deletion request
**Plans**: TBD
**UI hint**: yes

### Phase 10: CI/CD & Deployment
**Goal**: Application deploys automatically to production VPS on push
**Depends on**: Phase 8, Phase 9
**Requirements**: INFRA-05
**Success Criteria** (what must be TRUE):
  1. Push to main branch triggers an automated GitHub Actions pipeline that builds and deploys both frontend and backend
  2. Frontend builds as static files served by Nginx on the VPS with SSL
  3. Backend deploys as a Docker container with health checks and automatic restarts
**Tests**:
  - **CI/CD (GitHub Actions)**: Pipeline runs lint, typecheck, unit tests, E2E tests on every push
  - **Smoke tests**: After deploy, health endpoint returns 200, frontend loads, login flow works
  - **Rollback test**: Failed deployment triggers automatic rollback to previous version
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10

Note: Phase 06 depends on both Phase 04 and Phase 05 (history snapshots consume MealPlanService, lifecycle events modify it).
Phase 07 depends on Phase 05 and Phase 06 (uses EpisodeHistoryEvent infrastructure and dashboard structure).
Phase 08 depends on Phase 03 and Phase 04 (patient counts for tier enforcement) — can run in parallel with 05-07.
Phase 09 depends on Phases 04-07 (data export must cover patients, meal plans, biometry, and WhatsApp data).
Phase 10 depends on both Phase 08 and Phase 09 (deploy complete SaaS with billing and compliance).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 01. Monorepo & Infrastructure | 3/3 | Complete ✓ | 2026-04-19 |
| 02. Frontend Migration | 8/8 | Complete ✓ | 2026-04-20 |
| 03. Auth & Onboarding | 3/3 | Complete ✓ | 2026-04-21 |
| 04. Patient Management | 2/2 | Complete ✓ | 2026-04-22 |
| 05. Meal Plans & Food Catalog | 3/3 | Complete ✓ | 2026-04-22 |
| 06. Dashboard & Biometry | 5/5 | Complete ✓ | 2026-04-27 |
| 07. WhatsApp Intelligence | 3/3 | Complete    | 2026-05-05 |
| 08. Billing & Subscriptions | 0/? | Not started | - |
| 09. LGPD Compliance | 0/? | Not started | - |
| 10. CI/CD & Deployment | 0/? | Not started | - |
