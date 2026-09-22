# DEPLOY-PROD TODO

> Itens adiados da auditoria 2026-04-24 que são **aceitáveis em dev** mas **bloqueiam go-live**.
> Revisar e aplicar TODOS antes de expor a aplicação a usuários reais.

## 1. Credenciais e secrets

### 1.1. `DataInitializer` vaza senha em log e tem default previsível
**Arquivo:** `backend/src/main/java/com/compas/api/config/DataInitializer.java`

Hoje:
- Loga `"Admin seed created — email: {} | password: {}"` em INFO (linha ~51) — senha vai pra stdout/ELK em prod.
- Sem `@Profile` → roda em todos ambientes.
- Default `Admin123!` se `COMPAS_SEED_ADMIN_PASSWORD` (ou legado `NUTRIAI_*`) ausente.

**Ação em prod:** escolher UMA das opções:
- (a) Adicionar `@Profile("dev")` e remover o log da senha (seed some em prod, admin vira cadastro manual).
- (b) Deletar `DataInitializer` e mover seed para migração Flyway `R__seed_admin.sql` que leia de env var obrigatório (`${env.COMPAS_SEED_ADMIN_PASSWORD}`).

### 1.2. `docker/docker-compose.yml` com defaults hardcoded
Defaults que **entram no repo**:
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
COMPAS_JWT_SECRET: ${COMPAS_JWT_SECRET:-ci-dev-secret-minimum-32-chars-ok!}
COMPAS_SEED_ADMIN_PASSWORD: ${COMPAS_SEED_ADMIN_PASSWORD:-admin123}
```

**Ação em prod:** trocar `:-default` por `:?required` (docker-compose falha se var não vier):
```yaml
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
COMPAS_JWT_SECRET: ${COMPAS_JWT_SECRET:?required, min 32 chars}
COMPAS_SEED_ADMIN_PASSWORD: ${COMPAS_SEED_ADMIN_PASSWORD:?required}
```

### 1.3. `backend/src/main/resources/application.yml` com default `changeme`
```yaml
password: ${SPRING_DATASOURCE_PASSWORD:changeme}
```

**Ação em prod:** remover default → forçar falha rápida se env var ausente:
```yaml
password: ${SPRING_DATASOURCE_PASSWORD}
```

### 1.4. Validar `COMPAS_JWT_SECRET` já NÃO tem default em `application.yml`
Ok. Só garantir que ambiente de prod seta antes do startup.

## 2. Flyway clean em dev-profile

**Arquivo:** `backend/src/main/resources/application-dev.yml`
```yaml
spring:
  flyway:
    clean-disabled: false
```

Se `SPRING_PROFILES_ACTIVE=dev` vazar pra prod, alguém rodar `./gradlew flywayClean` dropa o schema inteiro. Baixo risco mas gratuito de eliminar.

**Ação em prod:** confirmar que profile ativo é `prod` (ou default) e remover essa chave.

## 3. CORS em profile prod

**Arquivo:** `backend/src/main/java/com/nutriai/api/config/CorsConfig.java`

Bean só existe pra `@Profile({"dev","default"})`. Em prod, `SecurityFilterChain.cors(Customizer.withDefaults())` sem bean → sem origens liberadas.

**Ação em prod:** UMA das opções:
- (a) Adicionar bean `@Profile("prod")` que lê `nutriai.cors.allowed-origins` de env var (lista separada por vírgula).
- (b) Tratar CORS no reverse proxy (nginx/traefik) e deixar o Spring Security fora — documentar bem em runbook.

## 4. Access token em `localStorage` (tradeoff XSS)

**Arquivo:** `frontend/src/stores/authStore.ts`

`partialize` persiste `accessToken` no localStorage. Vulnerável a XSS — qualquer script injetado rouba sessão de nutricionista (= dados sensíveis de pacientes sob LGPD).

**Ação em prod:** considerar modelo mais seguro:
- (a) **Access token em memória apenas** (Zustand não-persistido). No reload, chamar `/auth/refresh` usando o cookie httpOnly. Reduz superfície de XSS.
- (b) Manter localStorage + endurecer CSP no frontend (`Content-Security-Policy` restrito).

Decisão depende de quanto de CSP/sanitização o projeto vai ter.

## 5. Observabilidade e segredos em logs

- Confirmar que **nenhum** logger em `info`/`debug` emite `passwordHash`, `accessToken`, `refreshToken`, `email`, ou CPF.
- Configurar `logging.level.org.hibernate.SQL` e `org.hibernate.type.descriptor.sql` para `WARN` em prod (hoje `application-dev.yml` tem `show-sql: true` que pode vazar pra prod se profile errado).

## 6. DEPLOY.md / runbook

Hoje **não existe** um documento cobrindo:
- Ordem de subida (postgres → migrations → backend → frontend).
- Lista mínima de env vars obrigatórias.
- Onde rotacionar JWT_SECRET (e o que acontece com sessões ativas).
- Como o CorsConfig vai se comportar (ver item 3).
- Health-check e readiness: `GET /api/v1/health` está ok mas não separa liveness/readiness.

**Ação:** criar `DEPLOY.md` antes do primeiro go-live, referenciando este arquivo.

---

*Última revisão: 2026-04-24 — auditoria completa de backend/frontend/CI-CD.*
