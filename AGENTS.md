# Compas — AI Agent Context

> This file is the single source of truth for AI agents working on this project. It is read automatically by OpenAI Codex, Claude Code, and similar tools.

## Quick Reference

| What | Where | Command |
|------|-------|---------|
| Frontend | `frontend/` | `npm run dev`, `npm test`, `npx tsc --noEmit`, `npm run lint` |
| Backend | `backend/` | `./gradlew bootRun`, `./gradlew test`, `./gradlew compileJava` |
| E2E tests | `frontend/e2e/` | `npm run test:e2e` (requires backend + frontend running) |
| Docker dev | `docker/` | `docker compose -f docker/docker-compose.dev.yml up -d postgres` |
| AI reviewer rules | `.github/review-rules.md` | Edit to change what the AI reviewer flags on PRs |
| CI/CD pipelines | `.github/workflows/` | `frontend-ci.yml`, `backend-ci.yml`, `ai-review.yml`, `deploy.yml` |
| Project tasks | `TASKS.md` | Tracks bugs, features, and quality next-steps |
| Skills | `.skills/` | Modular skills: `pr-audit`, `github-resolution`, `expand-contract-migration`, `release` |
| Memory hub | `.memory/` | `DECISIONS.md` (ADRs), `HANDOFFS.md` |

## Development Workflow

### Regra Absoluta — NUNCA commit direto na `main`

> **Nenhum agente de IA deve commitar, pushar ou mergear diretamente na branch `main`.**  
> Sempre criar uma branch de feature/fix, abrir um Pull Request contra `main` e deixar o fluxo de CI/review cumprir seu papel.  
> Esta regra não admite exceções — nem para "correção rápida", "doc update" ou "mudança pequena".

Fluxo padrão:

1. **Create a branch** from `main` (e.g. `feat/my-feature`, `fix/my-bug`)
2. **Make changes** following conventions in this file
3. **Verify locally**: `npx tsc --noEmit` (frontend), `./gradlew compileJava` (backend)
4. **Push and open PR** against `main`
5. **CI runs automatically**: frontend-ci, backend-ci, ai-review (skipped on doc-only PRs)
6. **AI reviewer** posts a review — APPROVE or REQUEST_CHANGES
7. **If REQUEST_CHANGES**: address findings, push, AI re-reviews
8. **Merge** when all required checks pass + 1 approval (AI counts):
   - **Internal PRs**: AI approval is enough; owner is admin and can bypass if needed.
   - **External PRs**: AI approval + manual approval from owner (convention, not technically enforced).

### AI Memory & Session Continuation Protocol

Whenever the user instructs to **"continue"**, **"retomar"**, or mentions **"ai-memory"** / **"continue a tarefa em andamento"**:
1. **Inspect Memory & Tasks**: Read `.memory/HANDOFFS.md` and `TASKS.md` to identify the active task and the latest session checkpoint.
2. **Inspect Working Tree**: Run `git status` and `git diff` to understand in-flight modifications.
3. **Verify Baseline Health**: Run `./gradlew test` (backend) or `npm test` (frontend) to understand current health.
4. **Resume Seamlessly**: Report a 1-2 line confirmation and continue the task without repeating completed work.
5. **Update Handoff on Pause**: Before pausing, update `.memory/HANDOFFS.md` with current progress and the next immediate step.

### PR sizing convention (soft limit ~2.000 linhas de diff)

PRs gigantes (8k+ linhas, fase inteira) **amplificam falsos positivos do reviewer LLM**:
- Mais chunks = mais chamadas LLM = chance multiplicativa de pelo menos um chunk alucinar.
- Findings acumulam: 3/chunk × 8 chunks ≈ ~24 candidatos, e a maioria sao especulacoes.
- Self-critique recebe diff maior, fica perto do timeout, qualidade da validacao cai.
- O reviewer humano tambem revisa pior um PR de 8k linhas que tres de 2k.

Diretrizes:
- **Alvo: <2.000 linhas** de diff por PR (warning automatico no `ai-review.yml` quando passar de 2.500).
- **Slice vertical**: prefira `Dashboard backend` + `Dashboard frontend` + `Biometry backend` + ... ao inves de `Phase 06 inteira`.
- **Stacked PRs**: branch base intermediaria (ex.: `feat/06-dashboard-biometry`) recebe PRs pequenos das sub-features; quando completa, vai pra `main` em um PR final.
- **Quando flexibilizar** (passar do limite e' aceitavel): migrations grandes (V13 com 5 tabelas), refactors mecanicos (rename em massa), bumps de dependencia.
- **Doc-only / planning-only** PRs nao disparam o reviewer (paths-ignore em `*.md`, `.planning/**`, `docs/**`).

### Required Checks on `main`

- `ai-review` — required (mas pulado em PRs doc-only via `paths-ignore`)
- `frontend` — required; workflow roda em todo PR/push e passa como no-op quando nao ha mudanca em `frontend/**` ou `.github/workflows/frontend-ci.yml`
- `backend` — required; workflow roda em todo PR/push e passa como no-op quando nao ha mudanca em `backend/**` ou `.github/workflows/backend-ci.yml`
- `e2e` — runs conditionally, not required for merge

### Branch Protection

- enforce_admins: **false** (owner pode mergear via "Merge anyway" mesmo sem approves)
- 1 approval required (AI approval counts)
- require_code_owner_reviews: false
- Dismiss stale reviews: yes (pushes invalidam approves anteriores)
- Require branches up to date before merge: yes (`strict: true`)

## Secrets (never commit these)

| Secret | Environment variable | Where to set |
|--------|---------------------|--------------|
| PostgreSQL password | `COMPAS_DATASOURCE_PASSWORD` (ou `NUTRIAI_*`) | `.env` or Docker env |
| JWT signing key | `COMPAS_JWT_SECRET` (ou `NUTRIAI_*`) | `.env` or Docker env |
| Seed admin password | `COMPAS_SEED_ADMIN_PASSWORD` (ou `NUTRIAI_*`) | `.env` or Docker env |
| Ollama Cloud API key | `OLLAMA_API_KEY` | GitHub Actions repo secrets **and** Dependabot repo secrets |
| OpenAI fallback review key | `OPENAI_API_KEY` | GitHub repo secrets |

## AI Reviewer Rules

The AI reviewer loads `.github/review-rules.md` as part of its system prompt. This file contains:
- Project-specific security rules (PreAuthorize, tenant isolation, LGPD)
- Naming conventions (PascalCase components, camelCase variables, kebab-case CSS)
- Architecture rules (controller→service→repository, View→Store→API)
- Testing requirements (E2E contracts, enum mapping, error visibility)
- What NOT to flag (mock data, pt-BR only, existing lint warnings)

To change what the reviewer checks: edit `.github/review-rules.md` and push. No workflow changes needed.

### AI Reviewer Behavior

- **Decision logic** (driven by `.github/scripts/ai-review.sh:summarize_success`):
  - 0 findings → `approve` (bot APPROVE)
  - Only MEDIUM/LOW/INFO → `approve_with_warning` (bot APPROVE com warning)
  - Any CRITICAL/HIGH → `request_changes` (bot REQUEST_CHANGES)
- **External contributors**: bot APPROVE counts as 1 approval; humano precisa do segundo approve.
- **Findings tracking**: HIGH+ findings sao publicados como issue GitHub com label `ai-review`. Issue e' fechada/atualizada automaticamente a cada run.

### AI Review (locked config) — DO NOT TUNE BLINDLY

A configuracao do reviewer (`.github/workflows/ai-review.yml` + `.github/scripts/ai-review.sh`) esta **travada**. Cada variavel deste env tem motivo:

| Var | Valor | Por que esse valor |
|---|---|---|
| `AI_REVIEW_PRIMARY_MODEL` | `deepseek-v4.1-flash:cloud` | Modelo ultra-rápido no Ollama Cloud (~1s vs 30-180s do glm), menor custo de tokens e excelente capacidade analítica para code review. |
| `AI_REVIEW_FALLBACK_MODEL` | `gpt-oss:120b` | Modelo **distinto** do primary. Alucina mais, mas o segundo passe (`self_critique_findings`) filtra alucinacoes. |
| `AI_REVIEW_CHUNK_LINES` | `1500` | Chunks maiores (>= 4000) estouram `PROVIDER_MAX_TIME` no glm-5.1. |
| `AI_REVIEW_MAX_CHUNKS` | `8` | Acomoda PRs ate ~12k linhas com chunks de 1500. |
| `AI_REVIEW_MAX_PARALLEL` | `2` | Tier Pro do Ollama Cloud permite **3 modelos concorrentes**. Mantemos em 2 para deixar 1 slot livre ao usuario (OpenCode/CLI). Subir para 3 funciona se o usuario nao estiver usando Ollama em paralelo, mas e' arriscado. NUNCA passar de 3. |
| `AI_REVIEW_PROVIDER_MAX_TIME` | `180` | 180s e' suficiente para chunk de 1500 linhas; 300s soh atrasa retries. |
| `AI_REVIEW_SELF_CRITIQUE_MAX_TIME` | `360` | Self-critique manda o diff completo (muito maior que um chunk), precisa de mais tempo. 360s comporta diffs ate ~10k linhas. |

**Filtros de falsos positivos** rodam em duas camadas, na ordem:

#### Camada 1 — `filter_false_positives()` (regex heuristico, custo zero)

Aplicada a cada linha de finding apos consolidar todos os chunks. Cobre 9 padroes recorrentes de alucinacao do reviewer:

| # | Padrao detectado | Acao | Quando descarta |
|---|---|---|---|
| 1 | "missing migration" / "sem migracao" | drop | quando ha `*.sql` no manifest do PR |
| 2 | "missing tests" / "sem testes" | drop | quando ha `*Test*.java` ou `.spec.ts` no manifest |
| 3 | "without @Valid" / "sem validacao" | drop | quando ha `@Valid`/`@AssertTrue`/`@NotNull`/etc no diff |
| 4 | "hasRole(ADMIN) speculation" | drop | quando nenhuma referencia a ADMIN aparece no diff |
| 5 | "test will fail" / "teste falhara" | drop | sempre (e' especulacao sobre comportamento de teste) |
| 6 | "beforeAll shared state" | drop | quando o diff so tem `beforeEach` |
| 7 | "if/se/may/could" no inicio do finding | drop | quando o finding nao cita simbolo/arquivo concreto |
| 8 | "erro de compilacao" / "compilation error" | drop | sempre (CI ja captura erros de compilacao reais) |
| 9 | "X nunca declarada/importada" | drop | quando o simbolo X (extraido de backticks ou identifier) aparece no diff como atribuicao, import, class/interface/record/enum/method |

Casos cobertos por testes em `.github/scripts/test-ai-review-filter.sh` — rode antes de adicionar/alterar regras.

#### Camada 2 — `self_critique_findings()` (segundo passe LLM)

**Conceito.** O modelo, na primeira passagem, opera sob o vies "encontrar problemas no codigo" — incentivo implicito a produzir findings, mesmo quando especulativos. Quando os mesmos findings sao re-apresentados a ele com a tarefa explicita de **validar evidencia**, ele consegue avaliar com mais ceticismo. Tecnica analoga a self-refine / Constitutional AI.

**Quando dispara.** Apenas quando o filter heuristico deixa pelo menos 1 finding `CRITICAL` ou `HIGH`. Se sobrou so MEDIUM/LOW, pula (nao vale a chamada extra).

**Como funciona.**
1. Monta um request ao primary model (`deepseek-v4.1-flash:cloud`) com:
   - System prompt strict KEEP/DROP, regra "quando em duvida, DROP"
   - User content: o **diff completo** (nao chunked) + lista dos findings restantes
2. Modelo retorna apenas as linhas a manter, no formato exato.
3. Substitui `findings_unique` pelo output filtrado.
4. Se a chamada falhar (timeout, HTTP 5xx, JSON invalido): preserva os findings originais — degradacao graciosa, nao bloqueia o pipeline.

**Por que e' efetivo.** Filter heuristico cobre padroes conhecidos (~80% dos casos). Self-critique pega o long tail: alucinacoes criativas que escapam de qualquer regex pre-definido (ex.: o reviewer afirmou "savedEpisode nunca e declarada" em PT-BR sem usar nenhuma das palavras-gatilho da Rule 9). No run que aprovou o PR 28, **filter dropou 1, self-critique dropou 11** — todas alucinacoes do tipo "patientId pode ser null", "bean injection failure", "field sem @Column" que existiam claramente no diff.

**Custo.** ~1 chamada LLM extra por run problematico:
- Input: diff completo (~10k tokens em PR grande) + findings (~500 tokens)
- Output: lista filtrada (~500 tokens)
- Em quota Ollama Cloud Pro: marginal, ~5-15% do custo de um run completo
- So acionado quando o filter heuristico nao conseguiu zerar HIGH+ — em PRs limpos nem roda

**Trade-off.** Pode descartar finding real ambiguo (false negative). Mitigacao: sticky comment continua mostrando MEDIUM/LOW/INFO, e revisao humana segue como ultima camada. Self-critique nao substitui review humano em mudancas sensiveis.

**Falha modes conhecidos.**
- Timeout: diff > ~10k linhas pode estourar `SELF_CRITIQUE_MAX_TIME=360s`. Em caso de timeout, findings originais sao mantidos.
- Modelo retornar texto fora de formato: filtra-se com `grep -E '^- (CRITICAL|HIGH|MEDIUM|LOW|INFO):'`; se nada bater, preserva originais.

**Regra absoluta para qualquer IA assistente trabalhando neste repo:**
- NAO altere `.github/workflows/ai-review.yml`, `.github/scripts/ai-review.sh` nem `.github/scripts/test-ai-review-filter.sh` sem instrucao **explicita** do usuario que cite a config nominalmente ("muda o chunk size", "adiciona regra X no filter", etc.).
- "Tentar estabilizar" / "tentar reduzir falsos positivos" / "tentar acelerar" sem instrucao especifica ja causou loops de horas e regressoes. NAO faca.
- Se um run falhar e voce achar que a config e' culpada, **reporte ao usuario** e espere instrucao. Nao toque.

## Key Architecture Patterns (for new agents)

- **Auth flow**: JWT access token (15min) + refresh token (7d, httpOnly cookie). Extract nutritionistId from JWT via `NutritionistAccess.getCurrentNutritionistId()`.
- **Tenant isolation**: Every DB query MUST include `WHERE nutritionist_id = ?`. ArchUnit tests enforce this at compile time.
- **API envelope**: Auth endpoints (`/auth/*`) return direct JSON. All other endpoints return `{ "success": true/false, "data": {...} }`.
- **Frontend state**: Zustand stores with `partialize` for localStorage. `accessToken` MUST be included in `partialize`.
- **All UI text is pt-BR** — no i18n framework, hard-coded Portuguese.
- **PreAuthorize**: All controllers except `HealthController` and auth public endpoints (`/auth/signup`, `/auth/login`, `/auth/refresh`) MUST have `@PreAuthorize("hasRole('NUTRITIONIST')")`.

## Frontend Conventions

- TypeScript strict mode
- Tailwind CSS 4 (no CSS modules, no styled-components)
- Views in `src/views/`, components in `src/components/`
- API modules in `src/api/`, Zustand stores in `src/stores/`
- E2E tests in `e2e/` using Playwright with API helpers (`signupViaApi`, `completeOnboardingViaApi`)

## Backend Conventions

- Java 21 + Spring Boot 3.5 + Gradle
- Package structure: `controller` → `service` → `repository` (never skip a layer)
- Flyway migrations in `src/main/resources/db/migration/`
- Checkstyle enforcement via `./gradlew check`
- ArchUnit tests in `ArchitectureTest.java` (6 rules): controller↛repository, service↛controller, repository↛service, no package cycles, DTOs↛repositories, controllers must have @PreAuthorize

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Compas** (anteriormente NutriAI)

Painel clínico para nutricionistas solo (Brasil) que gerencia pacientes, planos alimentares, catálogo de alimentos e insights — com IA respondendo ao paciente via WhatsApp com base no plano alimentar. Hoje é um protótipo funcional (HTML/CSS/JS puro, React 18 via CDN, dados mockados) e precisa migrar para produção: monorepo com frontend moderno (React+TypeScript+Vite+Tailwind), backend real (Java 21+Spring Boot+PostgreSQL), e containers Docker para deploy em VPS.

**Core Value:** O nutricionista cria o plano alimentar e acompanha seus pacientes em um painel web, enquanto a IA responde ao paciente via WhatsApp usando o plano como base — tirando dúvidas e captando dados das refeições reais.

### Constraints

- **Tech stack front**: React + TypeScript + Vite + Tailwind — decisão tomada, não negociável
- **Tech stack back**: Java 21 + Spring Boot + PostgreSQL — decisão tomada, não negociável
- **WhatsApp**: Evolution API (open-source, self-hosted) como gateway desde o início
- **Deploy separado**: Monorepo pra desenvolvimento, mas cada projeto gera imagem Docker independente
- **Preservar UI**: Telas já 90% prontas visualmente — não redesenhar, só migrar estrutura
- **Isolamento**: Cada nutricionista só vê seus pacientes (sem multi-tenancy de clínica)
- **Idioma**: Tudo em pt-BR
- **LGPD**: Compliance obrigatório (dados de saúde são sensíveis)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Runtime & Language
- JavaScript (ES2020+) — JSX via Babel in-browser transpilation. All `.jsx` files are transpiled client-side by `@babel/standalone`.
- No TypeScript, no type-checking. All code is plain JavaScript with JSX.
- Browser-only SPA. No Node.js server, no server-side rendering.
- Runs entirely in the browser as a static site — open `NutriAI.html` directly or serve from any static file server.
## UI Framework
- React 18.3.1 — loaded via CDN UMD builds (`react.development.js`, `react-dom.development.js`)
- Rendering: `ReactDOM.createRoot()` API (`NutriAI.html:174`)
- No virtual DOM optimization libraries
- All components are global functions assigned to `window` via `Object.assign(window, { ... })` at the end of each file
- No ES modules — every `.jsx` file is a `<script type="text/babel">` loaded in sequence via HTML
- No component lazy-loading — all views loaded upfront
- No React Router — view switching is done via `view` state in `App` component with conditional rendering (`if (view === "home") && <HomeView .../>`)
- `React.useState` — primary state management
- `React.useMemo` — computed/filtered data (patient lists, search, pagination)
- `React.useEffect` — side effects (localStorage, media queries, postMessage)
- `React.useRef` — DOM references (SVG chart hover, menu positioning)
- `ReactDOM.createPortal` — dropdown menus rendered to `document.body`
## State Management
- `authView` — current auth screen ("landing" | "login" | "signup" | null)
- `isAuthenticated` — boolean gate for app vs. auth flow
- `view` — current main view ("home" | "patients" | "patient" | "foods" | "insights")
- `activePatientId` — selected patient ("p1" through "p12")
- `statusFilter` — sidebar patient filter ("all" | "ontrack" | "warning" | "danger")
- `patients` — array of patient objects (mutable via `setPatients`)
- `tweaks` — edit-mode overrides (theme, patientStatus)
- `sidebarOpen` — responsive sidebar toggle
- `localStorage` for `nutriai.view` and `nutriai.patient` (read on mount, written on change)
- No other persistence — all patient data, plan data, and food catalog are in-memory only
## Styling
- Single stylesheet: `styles.css` (1726 lines)
- No CSS-in-JS, no CSS Modules, no Tailwind, no PostCSS
- Component-level styles use inline `style={{}}` objects extensively
- CSS custom properties defined in `:root` (`styles.css:2-38`)
- Theme switch via `[data-theme="light"]` and `[data-theme="dark"]` selectors
- Theme toggled by setting `document.documentElement.setAttribute("data-theme", ...)` in `App` useEffect
- `--ink` / `--ink-2` / `--ink-3` — dark foregrounds
- `--paper` / `--paper-2` / `--paper-3` — light backgrounds
- `--lime` / `--lime-dim` — brand accent (primary call-to-action, AI indicators)
- `--coral` / `--coral-dim` — danger status
- `--sage` / `--sage-dim` — success/on-track status
- `--amber` — warning status
- `--sky` — fat macro color
- `--fg` / `--fg-muted` / `--fg-subtle` — text hierarchy
- `--font-ui`: `'Inter Tight'` — primary UI font (weights 400-700)
- `--font-mono`: `'JetBrains Mono'` — data, numbers, labels (weights 400-600)
- `--font-serif`: `'Instrument Serif'` — headings, hero text (italic variant used)
- All loaded via Google Fonts CDN with `preconnect`
- Media query at `1200px` for sidebar auto-collapse (`matchMedia` + `useEffect`)
- Media queries at `900px` and `600px` for landing/auth layout changes
- No CSS Grid auto-placement for the main app — fixed widths for rail (56px) and sidebar (288px)
## Data Layer
- `PATIENTS` array — 12 mock patient objects (`data.jsx:2-15`)
- `ANA` object — detailed single-patient data with biometry, timeline, skinfolds, perimetry (`data.jsx:18-76`)
- `AGGREGATE` object — portfolio-level stats and AI-generated insights (`data.jsx:79-98`)
- `FOODS_CATALOG` array — 17 food items (12 bases + 5 presets) in `view_foods.jsx:2-74`
- `INITIAL_MEALS` / `INITIAL_OPTIONS` — meal plan structure in `view_plans.jsx:2-31`
- `INITIAL_EXTRAS` — off-plan food authorizations in `view_plans.jsx:792-798`
- Patient list updates via `setPatients()` (toggle active/inactive, edit patient fields)
- Meal plan state is local to `PlansView` via `useState` (options, meals, extras)
- No persistence of mutations — refreshing the page resets everything
- Patient status enum: `"ontrack"` | `"warning"` | `"danger"` — used for color coding everywhere
- Macro structure: `{ kcal: { target, actual }, prot: { target, actual }, carb: { target, actual }, fat: { target, actual } }`
- Timeline event kinds: `"plan"` | `"log"` | `"pending"` | `"upcoming"`
- Food types: `"base"` (per-100g nutrition) vs `"preset"` (pre-calculated portion)
## Build & Tooling
- No bundler (no Webpack, Vite, esbuild, Rollup)
- No package.json — zero npm dependencies
- No transpilation pipeline — Babel Standalone transpiles JSX in the browser at runtime
- No minification, no tree-shaking, no code splitting
- Open `NutriAI.html` in a browser → done
- File changes require only a page refresh
- No dev server required (can use any static file server or open directly)
| Library | Version | CDN | Integrity Hash |
|---------|---------|-----|----------------|
| React | 18.3.1 | unpkg.com | sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L |
| React DOM | 18.3.1 | unpkg.com | sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm |
| Babel Standalone | 7.29.0 | unpkg.com | sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y |
| Google Fonts | (latest) | fonts.googleapis.com | — |
- Hidden tweaks panel toggled via `window.postMessage` protocol
- `__activate_edit_mode` / `__deactivate_edit_mode` messages control visibility
- Tweak values (theme, patientStatus) sent to parent via `__edit_mode_set_keys` message
- `TWEAK_DEFAULTS` block with `/*EDITMODE-BEGIN*/` / `/*EDITMODE-END*/` markers for external editor integration
## Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 (CDN UMD) | UI framework — component rendering, state, effects |
| react-dom | 18.3.1 (CDN UMD) | DOM rendering via `createRoot` API |
| @babel/standalone | 7.29.0 (CDN) | In-browser JSX transpilation for `<script type="text/babel">` |
| Google Fonts — Inter Tight | (latest) | Primary UI typeface (400-700 weights) |
| Google Fonts — JetBrains Mono | (latest) | Monospace for data/numbers (400-600 weights) |
| Google Fonts — Instrument Serif | (latest) | Serif for headings (regular + italic) |
## Key Technical Patterns
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Conventions
### Files
- **View files:** `view_{name}.jsx` — lowercase with underscores (e.g., `view_home.jsx`, `view_patient.jsx`, `view_foods.jsx`)
- **Shared modules:** Single-word lowercase with `.jsx` extension (e.g., `shell.jsx`, `data.jsx`, `icons.jsx`, `viz.jsx`)
- **Entry point:** `NutriAI.html` — capitalized PascalCase product name
- **Styles:** Single `styles.css` file at project root
- **Config:** `TASKS.md`, `opencode.json` at root
### Components
- **PascalCase** for all React components: `HomeView`, `PatientView`, `PlansView`, `KPI`, `Avatar`, `Topbar`, `Ring`, `Sparkline`
- **PascalCase** for icon components with `Icon` prefix: `IconHome`, `IconUsers`, `IconPlan`, `IconSearch`
- **PascalCase** for utility/UI components: `NewPatientModal`, `EditPatientModal`, `AddFoodModal`, `Pagination`
### Variables
- **camelCase** for local variables and state: `activePatientId`, `statusFilter`, `newPatientOpen`
- **UPPER_SNAKE_CASE** for constants/data: `PATIENTS`, `ANA`, `AGGREGATE`, `FOODS_CATALOG`, `FOOD_CATEGORIES`, `INITIAL_OPTIONS`, `INITIAL_MEALS`, `PAGE_SIZE`
- **camelCase** for state setters: `setView`, `setActivePatientId`, `setStatusFilter`
### CSS Classes
- **kebab-case** for all CSS classes: `.card-h`, `.card-b`, `.pq-item`, `.btn-primary`, `.landing-hero-title`
- **Abbreviated but readable:** `.pq-item` (patient quick item), `.btn` (button), `.seg` (segment control)
- **BEM-lite pattern:** Block-element without double-dashes: `.card` → `.card-h` (header), `.card-b` (body)
## Component Patterns
### Function Components Only
### State Hooks Pattern
- Use `React.useState`, `React.useMemo`, `React.useEffect`, `React.useRef` — hooks are accessed via the `React` global, NOT destructured in most files (exception: `shell.jsx` destructures at top)
- `shell.jsx` pattern: `const { useState, useEffect, useMemo, useRef } = React;`
- All other files: `React.useState()`, `React.useMemo()`, etc.
### Component Registration
### Prop Drilling
- `setView` — passed to almost every view to switch between views
- `setActivePatientId` — passed to views that navigate to a patient
- `patients` / `setPatients` — passed where patient list mutations are needed
- `setAuthView` — passed to auth views for navigation
### Inline Styles
- Use CSS classes from `styles.css` for structural elements (`.card`, `.page`, `.btn`, `.chip`, `.eyebrow`, `.mono`, `.serif`, `.tnum`, etc.)
- Use inline styles for one-off positioning, spacing, grid layouts, and component-specific colors
### Conditional Rendering
### Modal Pattern
## CSS / Styling Conventions
### Custom Properties (Design Tokens)
### Theme Switching
### Responsive Breakpoints
- **1200px:** Sidebar auto-collapses (`window.matchMedia("(max-width: 1200px)")`)
- **900px:** Landing page grid collapses to single column; auth left panel hides
- **600px:** Features grid collapses to single column; nav links hidden
### Typography Classes
- `.mono` — Monospace font (`--font-mono`) with tabular numerals
- `.tnum` — Tabular number spacing only (for alignment in tables)
- `.serif` — Serif font (`--font-serif`) for headings
- `.eyebrow` — Label style: mono, 10.5px, uppercase, letter-spacing 0.08em, muted color
### Key UI Component Classes
- `.card` / `.card-h` / `.card-b` — Card container with header/body
- `.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-ai` — Button variants
- `.chip` + `.chip.ontrack` / `.chip.warning` / `.chip.danger` / `.chip.ai` — Status badges
- `.seg` — Segmented control (theme toggle, view mode switch)
- `.divider` — Horizontal divider with label
- `.search` — Search input container
- `.pq-item` / `.pq-status` — Patient quick list items
- `.rail` / `.sidebar` / `.topbar` — App shell layout
- `.auth-page` / `.auth-field` / `.auth-input` — Auth form system
- `.onboard-*` — Onboarding step system
- `.landing-*` — Landing page system (extensive)
## Language & i18n
### UI Language
- **All UI text is in Portuguese (pt-BR)** — hard-coded in JSX strings
- No i18n framework or translation files
- Common patterns:
### Number Formatting
- Decimal separator: comma (pt-BR convention), e.g., `"1.840"` with period for thousands
- Some values use `toLocaleDateString('pt-BR')` for date formatting
## State Management Patterns
### App-Level State (in `NutriAI.html`)
- `authView` — controls which auth screen is shown
- `isAuthenticated` — auth gate
- `view` — current main view ("home", "patients", "patient", "foods", "insights", "onboarding")
- `activePatientId` — selected patient
- `statusFilter` — patient list filter
- `patients` — patient data array (mutable via `setPatients`)
- `tweaks` — edit mode state (theme, patientStatus override)
- `sidebarOpen` — sidebar visibility
### Local State
- `const [tab, setTab] = React.useState("today")` — tab selection
- `const [mode, setMode] = React.useState("table")` — view mode
- `const [filterOpen, setFilterOpen] = React.useState(false)` — filter toggles
- `const [q, setQ] = React.useState("")` — search queries
- `const [page, setPage] = React.useState(0)` — pagination
### Persistence
## Event Handler Naming
### onClick Handlers
- Inline arrow functions for simple actions: `onClick={() => setView("home")}`
- Named handlers for complex logic: `const handleLogin = () => {...}`, `const handleLogout = () => {...}`
- Modal close pattern: `onClose={() => setNewPatientOpen(false)}`
- Stop propagation: `onClick={e => e.stopPropagation()}`
### Form Handlers
- Auth forms use `onSubmit` with `e.preventDefault()`
- Input changes: `onChange={e => setEmail(e.target.value)}`
- Pattern: `const [form, setForm] = React.useState({...}); const set = (k, v) => setForm(f => ({...f, [k]: v}));`
## Typography Conventions
### Font Families
- **`--font-ui`** (`Inter Tight`): Body text, buttons, labels, form inputs
- **`--font-mono`** (`JetBrains Mono`): Data values, numbers, metrics, badges, eyebrow labels, technical annotations
- **`--font-serif`** (`Instrument Serif`): Page headings (`.serif` class), landing hero titles
### Font Sizes (Pattern Reference)
- Page title: `fontSize:34` or `36`, `fontWeight:400`, `letterSpacing:'-0.02em'` with `.serif`
- Section eyebrow: `10.5px`, uppercase, letter-spacing `0.08em` via `.eyebrow`
- Body text: `13px`–`14px` (inherited from `body`)
- Data values/metrics: `fontSize:20-34`, `fontWeight:500`, with `.mono .tnum`
- Small labels: `fontSize:9.5-11`, `.mono`, uppercase
- Input text: `fontSize:13`
## Color System
### Core Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | `#0B0C0A` | Primary dark, text, buttons |
| `--lime` | `#D4FF4F` | Brand accent, AI indicator |
| `--lime-dim` | `#9CBF2B` | Dimmed lime for dark bg accents |
| `--sage` | `#7FB77E` | Success/on-track status |
| `--sage-dim` | `#5A8A5A` | Dimmed sage for protein colors |
| `--amber` | `#E8B84A` | Warning/attention status |
| `--coral` | `#FF6B4A` | Danger/critical status |
| `--sky` | `#7AB7D9` | Fat macro color |
### Semantic Colors (theme-aware)
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg` | `var(--paper)` | `#0B0C0A` | Page background |
| `--surface` | `#FEFCF6` | `#121410` | Card background |
| `--surface-2` | `var(--paper-2)` | `#1A1D17` | Hover/secondary surface |
| `--border` | `#D8D2C1` | `#2A2E26` | Borders |
| `--border-2` | `#C5BEA9` | `#3A3F35` | Emphasized borders |
| `--fg` | `#0B0C0A` | `#F4F1EA` | Primary text |
| `--fg-muted` | `#6B6F62` | `#9A9C8E` | Secondary text |
| `--fg-subtle` | `#9A9C8E` | `#6B6F62` | Tertiary text |
| `--ink-contrast` | `#0B0C0A` | `#F4F1EA` | High-contrast text |
### Status Colors
| Status | Variable | Color |
|--------|----------|-------|
| On-track | `var(--sage)` | Green |
| Warning | `var(--amber)` | Amber |
| Danger | `var(--coral)` | Red-orange |
| AI/Extracted | `var(--lime-dim)`/`var(--lime)` | Lime |
### Macro Colors (hard-coded)
- **Kcal:** `var(--ink-contrast)` (primary text color)
- **Protein:** `var(--sage)`/`var(--sage-dim)`
- **Carbohydrate:** `var(--amber)`/`#A0801F` (dark amber)
- **Fat:** `var(--sky)`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## High-Level Architecture
- **Public flows** (landing, login, signup, onboarding) — unauthenticated
- **Authenticated panel** (home, patients, patient detail, plans, foods, insights) — behind auth guard
## Component Tree
```
```
- `Topbar` (shell.jsx) — breadcrumb header for authenticated views
- `KPI` (view_home.jsx) — metric card for dashboard
- `PatientGrid` / `PatientTable` (view_patients.jsx) — table/grid toggle
- `Pagination` (view_patients.jsx) — reused across list views
- `Avatar` (view_patients.jsx) — patient avatar with status dot
- `Ring` / `MacroRings` / `Sparkline` / `WeekBars` / `LineChart` / `StackBar` (viz.jsx) — data visualization primitives
- `NewPatientModal` / `EditPatientModal` (view_patients.jsx) — patient CRUD modals
- `Timeline` / `ExtractionEditor` (view_patient.jsx) — meal timeline with inline editing
- `NewBiometryModal` (view_patient.jsx) — biometric assessment form
- `EditFoodModal` / `AddFoodModal` / `AddMealModal` (view_plans.jsx) — food/meal modals
- `Icon*` (icons.jsx) — 29 icon components
## Routing & Navigation
- `isAuthenticated` starts `false`. When `false`, `authView` determines which public view renders.
- `handleLogin()` / `setAuthAndView('home')` sets `isAuthenticated = true` and switches to the panel.
- `handleLogout()` resets to `isAuthenticated = false`, `authView = "landing"`.
- `Rail` buttons call `setView(id)` to switch top-level views.
- `Sidebar` patient items call `setActivePatientId(id); setView("patient")` to open a specific patient.
- `PatientView` has its own `tab` state (`"today"` | `"plan"` | `"biometry"` | `"insights"` | `"history"`) for sub-navigation.
- View and active patient ID are persisted to `localStorage` (`nutriai.view`, `nutriai.patient`).
- Responsive: `window.matchMedia("(max-width: 1200px)")` auto-collapses sidebar.
- Manual: `window._sidebarToggle()` exposed via `useEffect`, called by `Topbar` hamburger button.
## Data Flow
- `PATIENTS` — array of 12 patient objects
- `ANA` — deep detail object for the focused patient (p1)
- `AGGREGATE` — portfolio-level statistics and alerts
```
```
- `HomeView` ← `patients`, `setView`, `setActivePatientId`
- `PatientsView` ← `patients`, `setPatients`, `setView`, `setActivePatientId`
- `PatientView` ← `setView`, `overrideStatus` (from tweaks)
- `PlansView` ← `setView`
- `FoodsView` ← `setView`
- `InsightsView` ← `setView`, `setActivePatientId`
## Key Architectural Decisions
| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| No build step; Babel standalone in-browser | Prototyping speed, single-file deploy, easy to share | No tree-shaking, no minification, poor performance at scale, no HMR |
| Global `window` components (`Object.assign(window, {...})`) | Avoids module system complexity in single-HTML setup | No encapsulation, global namespace pollution, name collision risk |
| All state in root `App` component | Simple prop-drilling, easy to trace | Deep prop chains, hard to refactor; no centralized state management |
| Mock data in `data.jsx` | Allows full UI development without backend | No persistence, no real data flow, all CRUD is cosmetic |
| Inline styles (no CSS modules/styled-components) | Maximum flexibility, self-contained components | Difficult to override, no style reuse, massive JSX |
| `localStorage` for view/patient persistence | Simple UX for demo | Fragile, no sync, can break across versions |
| PlansView embedded as PatientView tab | Contextual meal plan editing under patient detail | Tight coupling, no standalone plans listing in sidebar |
## Separation of Concerns
| File | Responsibility |
|------|---------------|
| `NutriAI.html` | Entry point, App root component, auth logic, tweaks panel |
| `shell.jsx` | Navigation chrome: Rail (icon sidebar), Sidebar (patient list + nav), Topbar (breadcrumbs) |
| `data.jsx` | Static mock data (patients, ANA detail, aggregate stats) |
| `icons.jsx` | SVG icon primitives (29 icons) |
| `viz.jsx` | Data viz components (Ring, MacroRings, Sparkline, WeekBars, LineChart, StackBar, MultiLineChart) |
| `styles.css` | All styles — themes, layout, components, auth, landing, onboarding |
| `view_home.jsx` | Dashboard home view + KPI component |
| `view_patients.jsx` | Patient list (table/grid), pagination, modals (new/edit), filters, Avatar |
| `view_patient.jsx` | Patient detail (5 tabs), timeline, extraction editor, biometry, edit modal |
| `view_plans.jsx` | Meal plan editor — meals, options, food rows, totals, PDF export, extras |
| `view_foods.jsx` | Food catalog — base/preset cards, search, pagination, create modal |
| `view_insights.jsx` | Aggregate intelligence view, CarteiraChart |
| `view_landing.jsx` | Marketing landing page |
| `view_login.jsx` | Login form |
| `view_signup.jsx` | 2-step signup form |
| `view_onboarding.jsx` | 4-step onboarding wizard |
| `TASKS.md` | Project task tracker |
- **Colors/status**: Three tiers (`ontrack`/`warning`/`danger`) mapped to CSS variables (`--sage`/`--amber`/`--coral`).
- **Typography**: Three font families — `Inter Tight` (UI), `JetBrains Mono` (data/labels), `Instrument Serif` (headings).
- **Theming**: Light/dark via `data-theme` attribute on `<html>`, toggled by tweaks panel.
- **All text is pt-BR** — Portuguese Brazilian throughout.
## Error Handling
- No try/catch in component logic
- No error boundaries
- No form validation (beyond required field checks like `!name.trim()` disabling buttons)
- No API error states (no API)
- Form `onSubmit` handlers only check for empty required fields
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.OpenCode/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD-QUICKSTART.md -->
## GSD Workflow

This project uses the **GSD (Get Shit Done)** project management system with structured workflows: plan → execute → verify → ship. All planning artifacts live in `.planning/`.

**Prerequisite:** GSD must be installed globally (skill + commands at `~/.config/opencode/get-shit-done/`). Slash commands are available in OpenCode. In other runtimes, read the workflow files directly.

### Entry Points (OpenCode slash commands)

| Command | Purpose |
|---------|---------|
| `/gsd:execute-phase <N>` | Execute a planned phase with wave-based parallel execution |
| `/gsd:plan-phase <N>` | Create execution plans for a phase (researches first) |
| `/gsd:discuss-phase <N>` | Gather context and surface gray areas before planning |
| `/gsd:research-phase <N>` | Research technical approaches for a phase |
| `/gsd-quick <desc>` | Small ad-hoc task with GSD guarantees (atomic commits, STATE tracking) |
| `/gsd-debug <desc>` | Systematic debugging using scientific method |
| `/gsd:verify-work <N>` | Goal-backward verification of phase completion |
| `/gsd:code-review` | Review source files for bugs, security, and quality |
| `/gsd:progress` | Show current project position and next action |
| `/gsd:next` | Show what to work on next |

### Quick Task Flags (`/gsd-quick`)

| Flag | Effect |
|------|--------|
| `--full` | Discussion + research + plan-checking + verification |
| `--discuss` | Lightweight discussion before planning |
| `--research` | Spawn researcher before planning |
| `--validate` | Plan-checking + post-execution verification |

### Fallback: When Slash Commands Don't Work

If slash commands are unavailable (e.g. Claude Code, Paperclip agent):

1. Read the GSD SKILL.md directly: `~/.agents/skills/majiayu000-gsd/SKILL.md`
2. Read the relevant workflow in `~/.config/opencode/get-shit-done/workflows/` (each has a complete `<process>` section)
3. Follow the process manually — the workflows are agent-agnostic instructions
4. Full quickstart guide: `docs/GSD-QUICKSTART.md`

### Key GSD Conventions

- **Plans are prompts** — `XX-YY-PLAN.md` files are execution prompts, not documentation
- **Goal-backward planning** — start from "what must be TRUE", derive what to build
- **Atomic commits** — each task commits independently
- **Context budget** — plans target ~50% context usage; stop before quality degrades
- **STATE.md is the memory** — always read `.planning/STATE.md` before starting work

Before starting any phase or task, read `.planning/STATE.md` for current position and `.planning/ROADMAP.md` for phase context.
<!-- GSD:workflow-end -->

## Anti-Stall Protocol

When executing tasks, if the same operation fails 3 times in a row (compilation error, test failure, or repeated tool error), you MUST:

1. **STOP retrying the same approach** — the strategy is wrong, not the attempt
2. **Diagnose the root cause** — read error output carefully, check dependencies, verify config
3. **Try an alternative approach** — different test strategy, different dependency version, different file structure
4. **Report status to the user within 4 tool calls of detecting the stall** — even if unresolved

Never spend more than 5 consecutive tool calls on the same failing operation without surfacing the issue.

### Mandatory Verify Gates

- After creating or modifying a test: compile checks MUST pass before marking task done
- After modifying source code: `./gradlew compileJava` (backend) or `npx tsc --noEmit` (frontend) MUST pass before moving on
- After completing a task: the relevant test suite MUST pass before declaring success
- If a verify gate fails 3 times: switch to alternative approach per anti-stall rule above

## Process Management (Windows)

**NEVER** use `./gradlew bootRun` — it blocks the shell and causes tool timeouts.

**NEVER** chain `Start-Sleep` after `Start-Process` — it blocks the tool call.

### Starting the backend (correct pattern — use Spring Boot directly)

```powershell
# Step 1: Start with Gradle (DevTools enables hot-reload)
cd C:\Users\evand\Documents\NutriAI\backend && ./gradlew bootRun

# — OR — if you need a standalone jar:
./gradlew bootJar
Start-Process -FilePath "C:\Program Files\Eclipse Adoptium\jdk-21.0.3.9-hotspot\bin\java.exe" `
  -ArgumentList "-jar","C:\Users\evand\Documents\NutriAI\backend\build\libs\compas-api-0.5.0.jar" `
  -RedirectStandardOutput "C:\Users\evand\Documents\NutriAI\backend\stdout.log" `
  -RedirectStandardError "C:\Users\evand\Documents\NutriAI\backend\stderr.log" `
  -WindowStyle Hidden

# Step 2: SEPARATE tool call to verify it's up
curl -s http://localhost:8080/api/v1/health
```

### Killing the backend

```powershell
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Checking logs

```powershell
Get-Content C:\Users\evand\Documents\NutriAI\backend\stdout.log -Tail 30
Get-Content C:\Users\evand\Documents\NutriAI\backend\stderr.log -Tail 10
```

### Key rules
1. `Start-Process` = immediate return, no waiting
2. Health check = always a **separate** tool call
3. `./gradlew bootJar` = ok (builds then exits), but `./gradlew bootRun` = FORBIDDEN
4. If backend isn't ready on first health check, just retry in the next tool call

## Testing Standards

Every phase must include tests as part of the "Done" criteria. No phase is complete without:

### Frontend (Vitest + Testing Library)
- **Unit tests** for stores (`*.test.ts`) — state transitions, error handling, async flows
- **Component tests** for views (`*.test.tsx`) — rendering, user interactions, form validation
- Run: `npm test` (vitest run) or `npm run test:watch` (watch mode)

### Backend (JUnit 5 + Mockito)
- **Unit tests** for services and controllers — business logic, validation, auth
- Run: `./gradlew test` (from backend/)

### E2E (Playwright) — REGRA DE QUALIDADE
E2E tests MUST be written with the critical eye of a SENIOR QA engineer. Every spec must:
1. **Validate page renders without crashes** — every page must load without React errors; no `if (isVisible)` guards that silently skip assertions
2. **Assert API contract** — verify response shape matches frontend types (no envelope mismatch like `response.data` vs `response.data.data`)
3. **Test all form validations** — required fields, min/max lengths, invalid inputs, error messages
4. **Test auth guards** — unauthenticated users redirected, unauthorized resources blocked
5. **Test CRUD flows** — create, read, update, delete with real API calls
6. **Test edge cases** — empty states, pagination boundaries, concurrent actions, network errors
7. **Test accessibility basics** — visible labels, focusable elements, no layout breaks
8. **Never skip assertions** — use `expect` not `if+skip`; fail fast on unexpected states

### E2E (Playwright) — REGRA DE INTEGRAÇÃO FRONT↔BACK
E2E tests são a **única camada que valida alinhamento real entre frontend e backend**. Unit testes não pegam desalinhamento de contrato.

**Para cada tela/fluxo que envia dados ao backend, o E2E DEVE:**

1. **Testar conversão de valores** — Se a UI exibe "Hipertrofia" mas envia `HIPERTROFIA`, o teste verifica que o dado chega no backend no formato correto. Para cada campo com mapeamento (enum↔label, string↔number, etc.), o teste valida a tradução end-to-end.

2. **Testar rejeição de valores inválidos** — Para cada campo enum, o E2E chama a API diretamente com o label pt-BR e verifica que retorna 400. Isso garante que se alguém remover a conversão no frontend, o teste falha.

3. **Testar UI→API→UI completo** — Preencher formulário na UI → submeter → verificar via API que o recurso foi criado com os valores corretos → verificar que a UI exibe o dado criado.

4. **Testar erro visível** — Para cada mutation que pode falhar (400, 401, 409, 404), o E2E verifica que o usuário vê uma mensagem de erro. Erro silencioso = bug.

5. **Sem valores hardcoded de contorno** — Nunca usar valores nos testes E2E que burlam o problema real (ex: mandar o enum key direto na API quando a UI manda o label). O teste deve simular o que a UI realmente envia.

**Checklist por endpoint (obrigatório antes de marcar fase como completa):**

| Endpoint | UI→Payload | Enum/Conversão | Erro visível? | E2E testa? |
|----------|-----------|----------------|---------------|------------|
| POST /auth/signup | SignupView→{name,email,password,crn,...} | — | sim | ☐ |
| POST /auth/login | LoginView→{email,password} | — | sim | ☐ |
| POST /patients | NewPatientModal→{name,objective,...} | objective: label→enum | sim | ☐ |
| PATCH /patients/{id} | EditPatientModal→{name,objective,...} | objective: label→enum, status: label→enum | sim | ☐ |
| GET /patients | PatientsView list | status filter, objective filter | — | ☐ |
| POST /foods | CreateFoodModal→{name,type,category,...} | type: label→enum, category: label→enum | sim | ☐ |
| PATCH /foods/{id} | EditFoodModal→{name,type,category,...} | type/category: label→enum | sim | ☐ |
| POST /plans/{episodeId}/slots | PlansView→{mealSlot} | — | sim | ☐ |
| PATCH /plans/slots/{id} | PlansView→{option/food} | — | sim | ☐ |
| POST /plans/{episodeId}/extras | PlansView→{extra} | — | sim | ☐ |
| (adicionar linhas conforme novos endpoints são criados) | | | | |

- Requires backend + frontend running
- Run: `npm run test:e2e` (from frontend/)

### Verify Gates
- After modifying frontend: `npx tsc --noEmit` must pass
- After modifying backend: `./gradlew compileJava` must pass
- After completing a task: relevant test suite must pass

## CI/CD Pipeline

### Workflows (GitHub Actions)

| Workflow | Trigger | Path Filter | Required |
|----------|---------|-------------|----------|
| `frontend-ci.yml` | push/PR to main | No trigger filter; internal no-op unless `frontend/**` or `.github/workflows/frontend-ci.yml` changed | Yes |
| `backend-ci.yml` | push/PR to main | No trigger filter; internal no-op unless `backend/**` or `.github/workflows/backend-ci.yml` changed | Yes |
| `e2e.yml` | push/PR to main | `frontend/**`, `backend/**` | No (path-filtered, runs when code changes) |
| `ai-review.yml` | PR opened/sync | All code files (`*.java`, `*.ts`, `*.tsx`, `*.css`, `*.yml`, `*.gradle`, `*.sql`, `*.json`, `*.html`) | Yes |

`frontend-ci.yml` and `backend-ci.yml` intentionally run for every PR so GitHub branch protection always sees the required `frontend` and `backend` checks. The jobs detect changed files inside the workflow and skip expensive setup/build/test steps when the area is not affected.

### Branch Protection (main)

- **Required checks**: `ai-review`, `frontend`, `backend`
- **1 approval required** (AI approval via `github-actions` bot counts)
- **Dismiss stale reviews**: yes
- **Require branches up to date**: yes (`strict: true`)
- **enforce_admins**: false (owner can bypass with `--admin`, but normal flow should merge without bypass)

### AI Reviewer (Ollama Cloud)

- **Primary model**: `glm-5.1:cloud` via Ollama Cloud
- **Fallback model**: `gpt-oss:120b` via Ollama Cloud
- **Dependabot PRs**: `OLLAMA_API_KEY` must exist in Dependabot secrets, not only Actions secrets, or reviewer runs cannot publish approvals.
- **Chunking**: diff is chunked at `AI_REVIEW_CHUNK_LINES=1500`, up to `AI_REVIEW_MAX_CHUNKS=8`
- **Intra-PR parallelism**: `AI_REVIEW_MAX_PARALLEL=2` limits chunk calls inside one PR; it does not serialize multiple PR workflows.
- **Decision logic**:
  - 0 findings -> APPROVE
  - only MEDIUM/LOW/INFO -> APPROVE with warning
  - any CRITICAL/HIGH -> REQUEST_CHANGES and sync an `ai-review` issue
- **Prompt injection guard**: diff content is sent as user message, system prompt instructs to analyze code only
- **Project-specific rules**: loaded from `.github/review-rules.md` as part of the system prompt
- **To update reviewer rules**: edit `.github/review-rules.md` and push — next PR automatically uses the new rules

### PR Workflow

1. Create branch → push → open PR against `main`
2. CI checks run automatically (`frontend`/`backend` always appear; no-op when not affected)
3. AI reviewer runs on every PR, posts comment with findings
4. If APPROVE: `github-actions` bot approves the PR
5. Developer merges manually (or via `gh pr merge`)
6. If REQUEST_CHANGES: developer addresses findings → push → AI re-reviews

### Frontend CI (`frontend-ci.yml`)

Steps: checkout -> detect frontend changes -> no-op when not affected, otherwise Node 20 setup -> npm ci -> TypeScript type check -> ESLint -> Vitest unit tests with coverage -> dependency check -> build

### Backend CI (`backend-ci.yml`)

Steps: checkout -> detect backend changes -> no-op when not affected, otherwise Java 21 setup -> Gradle cache -> `./gradlew check` (compile + Checkstyle + unit tests + JaCoCo coverage verification) -> `./gradlew integrationTest` (Testcontainers) -> JaCoCo HTML report artifact upload

### E2E CI (`e2e.yml`)

Steps: checkout → Docker Compose (postgres + backend + frontend) → health checks → Playwright tests → artifact upload on failure

## Development Context for AI Agents

### Repository Structure
```
frontend/          React 19 + TypeScript + Vite + Tailwind CSS 4
  src/
    api/            Axios client, API modules (auth, patient, food, plan)
    stores/         Zustand stores (authStore, patientStore, foodStore, planStore)
    views/          Page-level components
    components/     Reusable UI components
    e2e/            Playwright end-to-end tests
backend/           Java 21 + Spring Boot 3.5 + Gradle
  src/main/java/com/compas/api/
    auth/           JWT auth, SecurityConfig, NutritionistAccess
    controller/     REST controllers (PatientController, FoodController, PlanController)
    service/        Business logic
    repository/     Spring Data JPA repositories
    dto/            Request/response DTOs
    model/          JPA entities
  src/test/         JUnit 5 + Mockito + Testcontainers
  src/main/resources/
    db/migration/   Flyway migrations (V1__... through V6__...)
docker/            Docker Compose configs
.github/workflows/ CI pipelines + AI reviewer
.github/review-rules.md  Project-specific rules for AI reviewer
brainstorms/       Ideation documents
.planning/         Roadmap, phase plans, research
```

### Key Patterns

- **Auth**: JWT access token (15min) + refresh token (7d, httpOnly cookie). `NutritionistAccess.getCurrentNutritionistId()` extracts from SecurityContext.
- **Tenant isolation**: Every controller extracts `nutritionistId` from JWT. Every service method scopes by `nutritionistId`. Every repository query includes `WHERE nutritionist_id = ?`.
- **API envelope**: Auth endpoints (`/auth/*`) return direct JSON. All other endpoints return `{ "success": true, "data": {...} }`.
- **State management (frontend)**: Zustand stores with `partialize` for localStorage persistence. `accessToken` MUST be in `partialize`.
- **Error handling**: Backend returns `{ "success": false, "message": "..." }` with appropriate HTTP status. Frontend displays error messages via toast/alert.

### Security Invariants (ArchUnit enforced)

- Controllers MUST NOT depend on repositories (must go through services)
- All controllers (except HealthController) MUST have `@PreAuthorize` annotation
- No package cycles allowed
- DTOs MUST NOT depend on repositories

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-OpenCode-profile` -- do not edit manually.
<!-- GSD:profile-end -->
