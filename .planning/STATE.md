---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 07 complete
last_updated: "2026-05-05T22:56:33.754Z"
last_activity: 2026-05-05 -- Phase 07 completed
progress:
  total_phases: 10
  completed_phases: 7
  total_plans: 27
  completed_plans: 27
  percent: 96
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** O nutricionista cria o plano alimentar e acompanha seus pacientes em um painel web, enquanto a IA responde ao paciente via WhatsApp usando o plano como base.
**Current focus:** Phase 07 — whatsapp-intelligence

## Current Position

Phase: 07.1
Plan: 07.1-01 (Ciclo de vida dos modais e tratamento de erros de API)
Status: Pronto para planejar/executar Fase 07.1
Last activity: 2026-09-15

Progress: ██████░░░░ 60% (6 of 10 phases)

## Phase 2 Completion Summary

All 10 views migrated from prototype to React+TypeScript+Vite+Tailwind:

- **Authenticated views** (6): Home, Patients, Patient, Plans, Foods, Insights — full implementation
- **Public views** (4): Landing, Login, Signup, Onboarding — rewritten to match prototype after code review

User testing fixes applied:

- ✅ Patient click navigation (HomeView + PatientsView → navigate() + setActivePatientId)
- ✅ Dark mode forced light on public pages (/, /login, /signup, /onboarding)
- ✅ CSV import removed from onboarding
- ✅ Plan selection step added to onboarding (5 steps now)
- ✅ PlansView header layout fixed (title+buttons row 1, macros row 2)
- ✅ HomeView redundancy fixed (replaced duplicate patient list with "Alertas & tendências")
- ✅ Responsive CSS for all admin views (grid breakpoints at 900px and 600px)
- ✅ PatientView flexWrap + responsive header stats hiding at narrow widths
- ✅ CRUD completeness: edit/delete FoodsView, delete patients, delete meals in PlansView

CSS: Full prototype styles + admin responsive rules in globals.css (~2,000 lines).
Build: 86 modules, ~465KB JS + ~55KB CSS, 0 TypeScript errors.

## Phase 3 Completion Summary

Auth & Onboarding fully implemented and tested:

**Backend (29 unit tests passing):**

- JWT auth (access + refresh tokens), signup, login, logout, refresh
- Nutritionist model with CRN/validation, role-based access
- V3 migration: role enum → VARCHAR(20) for Hibernate compatibility
- CORS fix: @Profile({"dev", "default"}) for non-profiled runs
- Set-Cookie fix: removed duplicate addCookie(), kept addHeader()
- Spring Boot DevTools added for hot-reload

**Frontend (connected to real API):**

- LoginView, SignupView, OnboardingView connected via authStore (Zustand)
- Field-level error display (auth-input-error, auth-field-error CSS classes)
- data-testid on all auth inputs for E2E
- apiClient interceptor: 401 → refresh → retry queue

**Tests (31 unit + 6 E2E):**

- authStore.test.ts: 12 tests (signup/login/logout/refresh/fieldErrors/clearError)
- LoginView.test.tsx: 8 tests (button state, form submission, error display, navigation)
- SignupView.test.tsx: 8 tests (step navigation, validation, terms, navigation)
- PlansView.test.tsx: 3 tests (existing)
- e2e/auth.spec.ts: 6 E2E tests (Playwright)

**Bugs fixed this phase:**

1. PostgreSQL enum incompatibility (V3 migration)
2. CORS not activating on default profile
3. Set-Cookie header duplication
4. Frontend not extracting field-level errors from API

**Next:** Phase 4 — Patient Management

## Phase 4 Completion Summary

Patient Management fully implemented and wired to real API:

**Backend (code review: 9 findings, 8 fixed):**

- Patient CRUD (create, list, get, update, deactivate, reactivate)
- Episode lifecycle (create on creation, close on deactivate, new episode on reactivate)
- Data isolation (nutritionist-scoped queries, 404 not 403)
- Server-side pagination with filters (search, status, objective, active)
- Enum validation moved from controller to service (500→400)
- @Valid annotation on PATCH endpoint
- @Min bounds on page/size params
- SLF4J logging on PatientService and AuthService
- @Getter/@Setter replacing @Data on entities
- GlobalExceptionHandler: IllegalArgumentException + DataIntegrityViolation handling

**Frontend (all 3 views wired to real API):**

- PatientsView → usePatients(), useCreatePatient(), useUpdatePatient(), useDeactivatePatient(), useReactivatePatient()
- HomeView → usePatients() for patient cards and stats (removed PATIENTS mock import)
- PatientView → usePatient(id) with mapPatientFromApi(), ANA as fallback for rich detail fields (biometry, skinfolds, perimetry, timeline)
- patientStore.ts: Zustand UI store + TanStack Query hooks (usePatients, usePatient, useCreatePatient, useUpdatePatient, useDeactivatePatient, useReactivatePatient)

**Tests (45 unit + 7 E2E):**

- patientStore.test.ts: 12 tests (UI store state transitions, filter resets, modal state)
- Auth tests: 12 unit + 8 LoginView + 8 SignupView + 3 PlansView = 31 existing
- e2e/patient-management.spec.ts: 7 E2E tests (page load, search, filter, new patient modal, inactive toggle, patient navigation, home KPIs)

**Next:** Phase 5 — Meal Plans

## Phase 5 Completion Summary

Meal Plans & Food Catalog fully implemented with unified food model:

**Backend (3 plans executed, 9 review findings, all resolved):**

- Complete meal plan structure: Episode → MealSlots (breakfast/lunch/dinner/snacks) → Options → FoodItems
- Unified Food model (removed BASE/PRESET type split): single model with unit + referenceAmount, proportional macro calculation
- Removed FoodPortion entity entirely (simplified from 2-entity to 1-entity food model)
- MealFood.grams → referenceAmount + unit (V12 migration)
- Food CRUD with category enum, validation, and nutritionist-scoped queries
- Extra foods (off-plan authorizations) with full CRUD
- Migrations V9-V12 for schema evolution (drop basedOn, drop type/portions, fix category type, rename amount→referenceAmount)
- Service simplification: single proportional calculation `macro * amount / referenceAmount`

**Frontend (all views wired to real API with TanStack Query):**

- FoodsView → useFoods(), useCreateFood(), useUpdateFood(), useDeleteFood() with optimistic updates
- PlansView → planStore with useMealPlan, useCreateSlot, useUpdateSlot, useDeleteSlot, useAddOption, useRemoveOption, useAddFoodItem, useUpdateFoodItem, useDeleteFoodItem, useAddExtra, useDeleteExtra
- All delete mutations with optimistic updates (useDeleteMealSlot, useDeleteOption, useDeleteFoodItem, useDeleteExtra)
- AddFoodModal / EditFoodModal adapted for unified model (no BASE/PRESET distinction)
- PlanFoodRow with debounced update, reference amount display

**Tests (84 unit + E2E suite):**

- FoodsView.test.tsx, PlansView.test.tsx, planStore tests
- E2E: food-catalog.spec.ts, meal-plans.spec.ts with API contract validation, enum translation, cross-tenant isolation

**Review findings resolved:**

- CR-01: @RequestParam → @RequestBody (fixed)
- WR-01: patientId in nested endpoints (accepted risk, documented)
- WR-03: Delete without optimistic update (fixed)
- All other findings fixed in P5-02 and P5-03

**Next:** Phase 7 — WhatsApp Intelligence

## Phase 6 Completion Summary

Dashboard & Biometry fully implemented with clinical insights and evolution charts:

**Backend (5 plans executed, 3 review findings, all resolved):**

- Biometry CRUD (create, list, get, update) with active-episode enforcement and nutritionist-scoped reads/writes
- Biometric assessment persistence: bioimpedance, skinfolds, perimetry as child tables
- Episode history events emitted on episode open/close, plan creation, and biometry create/update
- Dashboard aggregate endpoint serving KPIs (active patients, adherence, trends) from real data
- Review findings resolved: CR-01 scoped episodeId to patientId+nutritionistId; WR-01 added eventAt to history events; WR-02 added patientId to update assessment lookup

**Frontend (connected to real API with TanStack Query):**

- Biometry API module (biometry.ts) with assessment CRUD endpoints
- clinicalStore.ts (Zustand + TanStack Query hooks: useBiometryAssessments, useCreateAssessment, useUpdateAssessment, useBiometryHistory)
- Dashboard API module (dashboard.ts) for KPI aggregate data
- HomeView — KPI cards with real patient data via dashboard endpoint
- PatientView biometry tab — assessment recording and evolution charts
- Numeric input sanitization (shared parseNumberInput utility)

**Tests:**

- BiometryServiceTest — 7 unit tests (validation, active-episode, tenant isolation, history emission)
- BiometryControllerTest — 6 unit tests (create 200, missing fields 400, update, list, cross-tenant 404, no active episode 400)
- clinicalStore.test.ts — store state transitions and API integration
- All review findings verified in code before close

## Performance Metrics

**Velocity:**

- Total plans completed: 27
- Average duration: ~1 session per wave
- Total execution time: ~5 sessions (including code review + user testing fixes)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Monorepo & Infrastructure | 3 | ~1 session | — |
| 2. Frontend Migration | 6 | ~5 sessions | ~0.83 session |
| Phase 02 P08 | 11min | 2 tasks | 3 files |
| 02 | 8 | - | - |
| 03 | 2 | - | - |
| 04 | 2 | - | - |
| Phase 05 P01 | 15min | 3 tasks | 36 files |
| Phase 05 P02 | 45min | 3 tasks | 24 files |
| 5. Meal Plans & Food Catalog | 3 | Complete ✓ | 2026-04-22 |
| 6. Dashboard & Biometry | 5 | Complete ✓ | 2026-04-27 |
| Phase 07 P02 | 36min | 2 tasks | 17 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 10 phases derived from 32 requirements (fine granularity)
- [Roadmap]: Phase 6 (Dashboard & Biometry) parallelizes with Phase 5 (Meal Plans) — both depend only on Phase 4
- [Roadmap]: Phase 8 (Billing) depends on both Phase 3 (Auth) and Phase 4 (Patients)
- [Roadmap]: Phase 9 (LGPD) depends on Phase 3 (Auth) and Phase 7 (WhatsApp) — consent needs auth, data deletion needs WhatsApp data model
- [Project]: Stripe recommended for MVP (solo-dev DX, subscription APIs); Pagar.me can be added later if needed
- [Phase 02]: Used patient.macrosToday (not macros) for MacroRings; used patient.weekMacroFill for WeekBars — both match existing type fields in DetailedPatient
- [Phase 05]: Removed @OneToMany(mappedBy) from raw-UUID FK entities; cascade handled at DB level and service layer via deleteAllBy*() methods
- [Phase 05]: Macro calculation: BigDecimal with HALF_UP rounding scale=1, formula per100 * grams / 100 for BASE, preset values for PRESET
- [Phase 05]: AddFoodModal onAdd passes simplified shape (foodId+grams+qty) — parent PlansView calls addFoodItem.mutate
- [Phase 05]: Macros frozen from backend: PlanFoodRow shows read-only macros, only grams and qty editable (D-20)
- [Phase 06]: History snapshot scoped to patientId+nutritionistId (CR-01 fix) — prevents cross-episode data leakage
- [Phase 06]: BiometryService.updateAssessment uses findByIdAndPatientIdAndNutritionistId (WR-02 fix) — REST path consistency
- [Phase 07]: Single LLM call per message for classification + response (D-01) — no multi-step pipeline
- [Phase 07]: OllamaCloudLlmService uses java.net.http.HttpClient with config-only provider swap (D-02)
- [Phase 07]: Authoritative meal extractions — saved directly as confirmed, no review state (D-11)

### Pending Todos

Todas as tarefas pendentes concluídas. Última: [2026-04-29-melhorar-suite-e2e-playwright.md](todos/completed/2026-04-29-melhorar-suite-e2e-playwright.md) — Melhorar suite E2E Playwright (testing) — **Concluído**

### Blockers/Concerns

- **Payment gateway decision:** Stripe vs Pagar.me — needs resolution before Phase 8 planning
- **AI provider selection:** No specific LLM chosen yet — affects Phase 7 cost model and response latency
- **Evolution API scaling limits:** Single shared instance architecture validated for ~10-20 nutris; needs validation during Phase 7
- **LGPD legal text:** Privacy policy and terms need Brazilian lawyer review before Phase 9 ships

## Session Continuity

Last session: 2026-05-05T21:07:15.713Z
Stopped at: Completed 07-02-PLAN.md
Resume file: None
