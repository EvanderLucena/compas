# AI Reviewer Rules — NutriAI

## Project Context
- Brazilian nutritionist SaaS (pt-BR all UI text)
- Stack: React 18 + TypeScript + Vite + Tailwind (front), Java 21 + Spring Boot + PostgreSQL (back)
- Monorepo: `frontend/` and `backend/` directories
- Row-level tenant isolation via `nutritionistId` FK — every query MUST scope by the authenticated nutritionist

## Security Rules (CRITICAL)
- Every controller endpoint MUST have `@PreAuthorize` annotation — no endpoint without explicit auth
- Every database query MUST filter by `nutritionistId` — no unscoped queries
- Auth endpoints (`/auth/*`) are the ONLY exception to `@PreAuthorize`
- Never log or expose `passwordHash`, JWT tokens, or PII in API responses
- Signup returns `{ accessToken, user }` directly (no envelope) — all other endpoints return `{ success, data }` envelope
- Duplicate email returns HTTP 409 (not 400)

## Frontend Rules
- Hooks: always `React.useState`, `React.useEffect` (never destructure from React import in most files)
- Stores: Zustand with `partialize` for persistence — `accessToken` MUST be in partialize
- API client: axios interceptor must normalize URL prefix before `startsWith` checks
- Playwright selectors: scope to `.page .search input` (not just `.search input`) to avoid sidebar conflicts
- Onboarding: after signup, call `/auth/onboarding` API to set `onboardingCompleted: true`

## Naming Conventions
- Components: PascalCase (`HomeView`, `PatientCard`)
- Variables: camelCase (`activePatientId`, `setView`)
- Constants: UPPER_SNAKE_CASE (`PATIENTS`, `ANA`)
- CSS: kebab-case (`.card-h`, `.pq-item`)
- Files: `view_{name}.jsx`/`.tsx` for views, lowercase for modules

## Architecture Rules
- Controller → Service → Repository (never Controller → Repository)
- Frontend: View → Store → API (never View → API directly, never circular View ↔ Store)
- All API modules in `frontend/src/api/` 
- All Zustand stores in `frontend/src/stores/`

## Testing Rules
- E2E contracts: UI sends pt-BR labels, API expects enum keys (e.g., "HIPERTROFIA" not "Hipertrofia")
- E2E must test: enum rejection (sending label should return 400)
- E2E must test: error messages visible to user (no silent errors)
- E2E must test: cross-tenant isolation (nutritionist A cannot access B's data)

## LGPD Rules
- Health data is sensitive under LGPD — never hardcode PII in tests or logs
- Patient data must be scoped by nutritionist — no global queries
- All endpoints that create patients must accept consent terms

## AI Engineering & Quality Rules (Inspired by AI Lair)

### Evidence Over Narrative
- Do NOT accept PR descriptions or commit summaries at face value: evaluate strictly whether the code changes and test assertions verify the claimed behavior.
- Every new endpoint, formula, or business logic calculation MUST be accompanied by corresponding automated tests (unit or integration). Flag as `HIGH` if critical logic changes lack test coverage.

### "Slop é Defeito" (Anti-Slop Rule)
- Flag unassociated `// TODO:` or `// FIXME:` comments introduced in the diff as `MEDIUM`. Code must be complete.
- Flag speculative abstractions ("future-proofing" helpers or dead code) that are not exercised anywhere.
- Flag test weakening: removing assertions, disabling checks, or inflating timeouts arbitrarily to pass CI.

### Database Migrations: Expand-Contract Pattern
- Flyway migrations (`V*.sql`) must be non-destructive to allow seamless rollback.
- Never drop or rename columns in the same migration step as application code updates. Always expand first (add nullable/default column), deploy code that writes/reads, and contract (drop old column) in a subsequent release.

## Do NOT Flag
- Mock data patterns (in-memory data, hardcoded arrays in prototype code)
- Missing i18n (project is intentionally pt-BR only)
- Existing ESLint/Checkstyle warnings that are already tracked (complexity, max-lines)
- Test-only helpers or fixtures
- Files, endpoints, or code NOT present in the diff — only flag what is VISIBLE in the diff

## Known False Positives (project-specific non-issues)

These patterns have surfaced as findings in past reviews but are intentional / safe in this stack. Do NOT raise them again.

### JSON null vs undefined in optional fields
The frontend may send `null` for some optional numeric fields and omit others (`undefined` → JSON.stringify drops the key). This is NOT a contract inconsistency: Spring/Jackson treat JSON `null` and an absent key as **equivalent** for optional boxed fields (`Integer`, `BigDecimal`, `String`, lists) when there is no `@NotNull` annotation differentiating them. The backend deserializes both cases identically. Do not flag this as an API contract problem.

### Spring constructor injection
Adding a new repository/service parameter to a Spring `@Service` / `@Component` constructor does NOT require additional bean configuration. Spring auto-wires by type; if the dependency is itself a Spring-managed bean, it is injected automatically. Do not flag "may fail at startup with NoSuchBeanDefinitionException" for plain constructor parameter additions.

### JpaRepository inherited methods
Spring Data `JpaRepository` interfaces inherit `findAll`, `findById`, `deleteById`, etc. without an explicit `nutritionistId` filter. The project relies on the **service layer** to scope these calls (e.g., always preceded by an ownership check). Do not flag inherited methods as "tenant isolation violation" — flag only when a service method directly calls `findById` or similar without a prior nutritionistId check on the parent entity.

### Test-only repository methods
`*RepositoryTest` classes use bare repository methods (no nutritionistId scoping) for setup/cleanup. These are integration tests against a sandboxed DB; service-layer scoping rules do not apply. Do not flag tenant-isolation issues in `*RepositoryTest` files.

### Webhook secret optional authentication
The WhatsApp webhook endpoint (`/api/v1/webhooks/whatsapp`) allows unauthenticated requests when `NUTRIAI_WEBHOOK_SECRET` is not configured (for dev/local setup and backward compatibility), and enforces constant-time secret validation on `X-Webhook-Secret`/`apikey`/`Bearer` headers when configured. Security at the transport layer is complemented by message deduplication (`messageId`) and phone verification. Do NOT flag empty default webhook secrets or fail-open dev behavior as a vulnerability.

### Reverse proxy IP extraction for Rate Limiting
`RateLimitingFilter.extractClientIp` validates and inspects `X-Forwarded-For` and `X-Real-IP` with fallback to `request.getRemoteAddr()`. Behind proxies, Docker ingress, or load balancers, `X-Forwarded-For` is standard to identify the originating client IP. Do NOT flag proxy IP extraction as spoofing or security bypass.

### PostgreSQL Row-Level Security (RLS) and TenantContext
PostgreSQL RLS is enabled on tenant tables (`patient`, `meal_plan`, etc.) as defense-in-depth, using GUC session variables `app.current_nutritionist_id` and `app.bypass_rls`. `TenantAwareDataSource` sets these session variables on every acquired connection using parameterized `PreparedStatement` with `set_config()`, and `TenantAwareConnection` resets them on `close()` before returning to the Hikari pool. In asynchronous background workers (`MessageProcessorWorker`) and inbound webhook processing (where patient phone is matched across tenants before the nutritionist is known), `TenantContext.executeWithBypass(...)` or `TenantContext.setBypassRls(true)` is explicitly used. In unit/integration tests running against H2, `TenantAwareDataSource` detects the engine and skips `set_config`. Do NOT flag `TenantContext`, `setBypassRls`, or `set_config` as security vulnerabilities or tenant leaks.