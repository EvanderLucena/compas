# Session Handoff Log — Compas

Este arquivo serve como ponte de transição entre sessões de desenvolvimento com diferentes agentes de IA (Antigravity CLI, OpenCode / Ollama, Claude Code, Codex).

## Como Fazer um Handoff Limpo
Ao encerrar uma sessão de trabalho ou alternar de IA:
1. Registre a data/hora e o agente utilizado.
2. Liste o que foi concluído com sucesso.
3. Aponte claramente o que está em progresso e o próximo passo exato.
4. Mantenha sincronizado com o `TASKS.md`.

---

## Log de Sessões

### [2026-09-25] — Deploy de Produção na VPS (Magalu Cloud) em Modo Closed Beta & Pipeline CD
- **Agente:** Antigravity CLI
- **Concluído:**
  - **VPS Provisionada e Blindada (`201.23.76.153`):** Ubuntu 24.04 LTS, Swapfile 2GB, Docker 29.8 + Compose v5. Firewall UFW ativo com política `DEFAULT DENY INCOMING` (apenas portas 22 e 80 liberadas externamente).
  - **Segurança de Rede dos Containers:** PostgreSQL (5432), Redis (6379), Backend Spring Boot (8080) e Evolution API (8081) isolados na rede interna Docker e vinculados exclusivamente a `127.0.0.1`. Apenas Nginx (80) exposto.
  - **Segurança Criptográfica & `.env` na VPS:** Segredos de 256 bits gerados diretamente no servidor via `openssl rand` com permissões `chmod 600 /opt/compas/.env`. Nenhum segredo em git.
  - **Modo Closed Beta (Fail-Closed):**
    - Rota `/` e `/signup` redirecionam imediatamente para `/login`.
    - `LoginView` exibe aviso de beta privado e oculta links públicos e login social.
    - Backend intercepta `POST /api/v1/auth/signup` retornando `403 Forbidden` com `PUBLIC_SIGNUP_ENABLED=false`.
    - Defaults de frontend e backend 100% sincronizados para fail-closed.
  - **Seeder de Produção (`ProdAccountSeeder`):** Cria conta inicial de nutricionista com `onboardingCompleted(false)` (sem dados clínicos falsos, forçando fluxo autêntico de onboarding e termos) sob opt-in explícito `COMPAS_SEED_ADMIN_ENABLED=true`.
  - **Pipeline CD (`deploy.yml`):**
    - Corrigido healthcheck para `/api/v1/health`.
    - Injeção automática de `--env-file .env` e detecção pós-checkout de `docker-compose.prod.yml`.
    - Pipeline executou com sucesso (PR #214 e PR #216 aprovados pelo AI Reviewer e mergeados na `main`).
  - **Validação Live:** Healthcheck `UP` e DB `connected` em `http://201.23.76.153/api/v1/health`, Nginx servindo frontend em `http://201.23.76.153/`, e login validado com sucesso.
- **Credenciais Iniciais do Nutricionista:**
  - E-mail: `admin@compas.app`
  - Senha: Gerada com alta entropia no `.env` da VPS (informada de forma segura na resposta).
- **Próximo Passo:**
  - Usuário acessar `http://201.23.76.153` no navegador, realizar login e testar o onboarding e painel ao vivo em produção.
- **Agente:** Antigravity CLI
- **Concluído:**
  - Auditoria forense e alinhamento de 100% das tarefas pendentes (`TASKS.md`) contra a codebase real:
    - **Trio de Ouro PDFs (`PatientDocumentService`, `PatientDocumentController`, `documents.ts`):** 100% concluído no backend e frontend.
    - **Status IA no Paciente (`WhatsAppActivationRow.tsx`):** Badge dinâmico ("IA Ativa" / "IA Pausada"), controle de pausa/reativação e ativação WhatsApp com testes.
    - **Recuperação de Senha via E-mail Resend:** `ResendEmailService`, endpoints `/forgot-password` e `/reset-password` no backend, `ForgotPasswordModal` e página `/reset-password` no frontend.
    - **Playwright Tutorial/Onboarding & E2E:** Cenário `E2E-J-01` (`journey-auth.spec.ts`) e `E2E-J-02` (`journey-patient.spec.ts`) cobrindo 100% do fluxo real de UI.
    - **Validação de Biometria e Alimentos:** `% gordura` alinhado como obrigatório (`@NotNull` e faixa 0.01-100), e `foodValidation.ts` + `CreateFoodRequest` cobrindo validação de macros.
    - **Limpeza de Out of Scope:** Tarefas não-acionáveis (importação avulsa de arquivo TACO e exportação de PDF em Inteligência) devidamente arquivadas para não poluir o Kanban.
  - Sincronização do parser do TUI (`scripts/compas-dashboard.cjs`) e do CLI (`scripts/compas-tools.ps1`) para manter o Kanban limpo e 100% verdadeiro.
- **Próximo Passo:**
  - Stripe Checkout — Planos e Assinaturas (/billing)

- **Agente:** Antigravity CLI
- **Concluído:**
  - Implementação do script de estatísticas e métricas de IA (`scripts/ai-harness-stats.cjs`), monitorando SQLite do OpenCode (tokens in/out/cache, custos, sessões) e Antigravity CLI (steps, conversas, transcript).
  - Implementação do módulo PowerShell (`scripts/compas-tools.ps1`) com dashboard unificado (`compas`), kanban em terminal (`compas-tasks`), monitor de tokens (`compas-ai`) e helpers (`compas-up`, `compas-front`, `compas-back`, `compas-kill`, `compas-check`).
  - Integração do autoloader no perfil do PowerShell do usuário (`$PROFILE`).
- **Próximo Passo:**
  - Validação e uso prático dos comandos do terminal pelo usuário, e avanço na Fase 5 de Pagamentos / Stripe Checkout ou testes de Onboarding.

### [2026-09-25] — Setup de Engenharia Ágil & Skills (Inspirado no AI Lair)
- **Agente:** Antigravity CLI
- **Concluído:**
  - Criação da documentação arquitetural de engenharia ágil e terminal tudo-em-um.
  - Atualização do `.github/review-rules.md` com as regras de *Evidence over narrative*, *Slop é defeito* e *Expand-Contract*.
  - Criação das skills modulares em `.skills/` (`pr-audit`, `github-resolution`, `expand-contract-migration`, `release`).
  - Criação do hub agnóstico de memória (`CODEX.md`, `CLAUDE.md`, `.memory/DECISIONS.md`, `.memory/HANDOFFS.md`).
- **Próximo Passo:**
  - Configuração do workflow de CD contínuo (`.github/workflows/deploy.yml`) com healthcheck e rollback na VPS (Concluído no PR #204).

