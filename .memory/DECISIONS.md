# Architecture Decision Records (ADRs) — Compas

Este documento registra as decisões estruturais do projeto Compas, seu contexto, justificativa e consequências. É lido por qualquer agente de IA para evitar discussões repetidas ou refatorações indevidas de decisões já tomadas.

---

## ADR 01: Multi-Tenancy e Isolamento em Nível de Linha (RLS)
- **Decisão:** Cada nutricionista opera de forma isolada. Toda tabela clínica possui `nutritionist_id UUID NOT NULL REFERENCES nutritionist(id)`.
- **Por que:** LGPD para dados de saúde sensíveis. Erro de isolamento de um paciente é inaceitável.
- **Implementação:**
  - JPA / Hibernate com queries contendo `WHERE nutritionist_id = ?`.
  - ArchUnit enforces controller -> service -> repository layer isolation.
  - PostgreSQL Row-Level Security (RLS) como camada de defesa em profundidade.

## ADR 02: Padrão Expand-Contract para Migrações de Banco (Flyway)
- **Decisão:** Nenhuma migration do Flyway pode conter `DROP COLUMN` ou renomear colunas no mesmo release em que o código novo é publicado.
- **Por que:** Permitir rollback instantâneo de container Docker/binário caso uma versão em produção apresente falhas graves, sem quebrar o banco de dados.

## ADR 03: Arquitetura de Comunicação WhatsApp (Evolution API)
- **Decisão:** Usar Evolution API self-hosted como gateway open-source de WhatsApp via Docker.
- **Por que:** Custo zero de intermediação comercial por mensagem na fase de tração, controle total de instâncias e suporte a webhooks bidirecionais.

## ADR 04: Estratégia de CI/CD com AI Reviewer
- **Decisão:** Review automatizado com LLM primário (`deepseek-v4.1-flash:cloud` via Ollama Cloud) rodando no GitHub Actions com 2 camadas de filtro contra falsos positivos.
- **Por que:** Resposta rápida (< 1 minuto por review), baixo custo e bloqueio automático de PRs com falhas graves de segurança ou semver.
