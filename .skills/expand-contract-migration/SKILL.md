---
name: expand-contract-migration
description: Guia para criação de migrações Flyway retrocompatíveis usando o padrão Expand-Contract, garantindo rollback seguro do banco de dados.
---

# Expand-Contract Migration Skill

Esta skill define as regras obrigatórias para criação e evolução de schemas de banco de dados PostgreSQL com Flyway no Compas.

## O Princípio do Rollback de Banco

> **Reverter código ou container Docker é instantâneo. Reverter banco de dados com dados já alterados ou colunas dropadas é um desastre.**  
> Toda migração deve ser desenhada para permitir que a versão anterior do software continue funcionando caso seja necessário um rollback de emergência.

## As Duas Fases do Padrão

### Fase 1: Expand (Expansão)
- **Adição de novas colunas**: Devem ser `NULL` ou ter valor `DEFAULT`.
- **Renomeação de coluna/tabela**: NUNCA use `ALTER TABLE ... RENAME`.
  - Crie a nova coluna.
  - A aplicação deve escrever nas duas (ou em trigger/fallback) e ler da nova com fallback na antiga.
- **Novas tabelas**: Crie normalmente com índices e chaves estrangeiras.

### Fase 2: Contract (Contração — Apenas no Release Seguinte)
- Somente após o código novo estar 100% estabilizado em produção e a versão anterior não precisar mais de rollback:
  - Cria-se uma nova migration separada para remover colunas antigas ou restrições legadas.

## Checklist Obrigatório para cada Migration (`V##__*.sql`)
1. [ ] A migration é idempotente ou segura para rodar em produção?
2. [ ] Todas as tabelas de dados clínicos contêm `nutritionist_id UUID NOT NULL REFERENCES nutritionist(id)`?
3. [ ] Há índices nas chaves de busca mais comuns (ex: `(patient_id, nutritionist_id)`)?
4. [ ] Nenhuma coluna foi deletada (`DROP COLUMN`) junto com a adição do código novo?
5. [ ] O número da versão segue a sequência estrita (verificar a última migration em `backend/src/main/resources/db/migration/`)?
