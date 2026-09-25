---
name: pr-audit
description: Auditoria rigorosa e hostil de Pull Requests (Evidence over narrative). Verifica segurança, isolamento multi-tenant, cobertura real de testes, ausência de slop e conformidade semver.
---

# PR Audit Skill — Evidence Over Narrative

Esta skill executa uma auditoria cética e minuciosa em um Pull Request ou conjunto de alterações antes de abrir ou aprovar o merge na branch `main`.

## Princípio Fundamental: Evidência Acima de Narrativa

> **Nada do que o autor ou o LLM afirma no título ou na descrição do PR é aceito como verdade até que seja comprovado no diff e nos testes automatizados.**

## Checklist de Auditoria

### 1. Auditoria de Evidência e Testes
- [ ] O PR adicionou nova lógica, endpoint, cálculo ou tratamento de erro?
- [ ] Existe um teste automatizado (unitário ou integração) exercitando especificamente esse caso?
- [ ] O teste cobre o cenário de falha / dados inválidos e não apenas o caminho feliz?
- [ ] Nenhum teste existente foi enfraquecido (asserções comentadas, timeouts aumentados artificialmente)?

### 2. Segurança e Multi-Tenancy (Compas)
- [ ] Todo controller possui `@PreAuthorize("hasRole('NUTRITIONIST')")` (exceto `/auth/*` e `/health`)?
- [ ] Toda query no banco possui cláusula `WHERE nutritionist_id = ?` (isolamento obrigatório por tenant)?
- [ ] Nenhuma credencial, token JWT, senha ou dado sensível exposto em logs ou respostas da API?
- [ ] Nenhum input do usuário inserido diretamente em SQL ou comandos shell sem sanitização?

### 3. Filtro Anti-Slop ("Slop é Defeito")
- [ ] Zero comentários do tipo `// TODO:` ou `// FIXME:` sem issue aberta correspondente.
- [ ] Zero código especulativo ("para uso futuro") que não é chamado em lugar nenhum.
- [ ] Zero importações mortas ou arquivos órfãos não conectados à aplicação.
- [ ] Zero quebras de convenções de tamanho (arquivos frontend <= 300 linhas, funções <= 120 linhas).

### 4. Banco de Dados e Rollback (Expand-Contract)
- [ ] Há migrations do Flyway (`V*.sql`)?
- [ ] A migration é estritamente retrocompatível?
- [ ] Proibido `DROP COLUMN`, `RENAME COLUMN` ou alteração destrutiva no mesmo release em que o código novo sobe.

### 5. Semver e Contratos de API
- [ ] Se a alteração quebra contrato existente da API: exige bump MAJOR (`1.0.0`).
- [ ] Se adiciona novos campos/endpoints sem quebrar os existentes: MINOR (`0.6.0`).
- [ ] Se apenas corrige comportamento interno sem alterar contratos: PATCH (`0.5.1`).

## Resultado da Execução
Emitir um veredito claro:
- **APROVADO**: Todas as evidências checadas com sucesso.
- **REPROVADO**: Apontar o arquivo, linha e a evidência faltante para correção imediata.
