---
name: github-resolution
description: Resolução cirúrgica de tarefas e bugs. Escreve teste de regressão antes do fix, foca no escopo estrito e aplica a regra 'Slop é defeito'.
---

# GitHub Resolution Skill — Test-First & Anti-Slop

Esta skill orienta o agente a resolver uma tarefa, bug ou issue com foco cirúrgico, sem dispersão e garantindo cobertura contra regressões.

## Regras de Execução

### 1. Teste de Regressão Antes da Correção
1. Antes de alterar qualquer linha de lógica de negócio existente, crie ou altere um teste automatizado que **reproduza a falha ou o caso de uso novo**.
2. Execute o teste para confirmar que ele **falha pelo motivo esperado**.
3. Implemente a alteração mínima necessária para fazer o teste passar.
4. Execute a suíte de testes completa do módulo para garantir zero regressões colaterais.

### 2. Regra de Ouro: "Slop é Defeito"
- **Sem abstrações especulativas**: Não crie interfaces, generics ou classes abstratas "pensando no futuro". Faça o código mais simples e legível que resolva o problema de agora.
- **Sem refatorações de carona**: Não mude nomes de arquivos, formatação de outros métodos ou estilos de código que não pertençam ao escopo estrito da tarefa.
- **Sem TODOs esquecidos**: Se um caso extremo foi identificado, resolva-o agora ou trate o erro adequadamente. Nunca deixe comentários como `// TODO: tratar isso depois`.

### 3. Workflow de Git
- Nunca commite direto na branch `main`.
- Crie uma branch específica: `fix/issue-<id>` ou `feat/<nome-curto>`.
- Mantenha o diff focado (alvo: < 1.000 linhas de código por PR).
- Rode as verificações locais (`./gradlew check` no backend, `npm run lint && npm test` no frontend).
- Abra o PR com resumo claro e evidências de testes executados.
