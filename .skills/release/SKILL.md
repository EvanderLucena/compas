---
name: release
description: Automação do corte de versão baseado em semver estrito e changelog. Só cria tag de release com CI 100% verde no commit exato.
---

# Release Skill — Semver Estrito & CI Verde

Esta skill guia o processo de lançamento de novas versões do Compas de forma reproduzível e segura.

## Regras de Versionamento (Semver)

A versão é definida analisando o diff e os commits desde a última tag Git:

1. **PATCH (0.5.x → 0.5.y)**:
   - Apenas correções de bugs, ajustes de documentação ou pequenos refinamentos visuais.
   - Zero quebra de contratos de API.
2. **MINOR (0.5.x → 0.6.0)**:
   - Novas funcionalidades para o nutricionista ou paciente adicionadas de forma retrocompatível.
   - Novos endpoints ou tabelas no banco de dados.
3. **MAJOR (0.x.x → 1.0.0)**:
   - Mudanças que quebram contratos públicos existentes de API ou fluxos essenciais de autenticação/integração.

## Checklist Pré-Release
- [ ] A branch `main` está com todos os checks de CI verdes (`backend-ci`, `frontend-ci`, `ai-review`).
- [ ] O arquivo `CHANGELOG.md` ou notas de release resumem claramente as entregas em português (pt-BR).
- [ ] A tag segue o padrão `vX.Y.Z` (ex: `v0.6.0`).
- [ ] Nunca reescreva ou force push em uma tag Git já publicada.
