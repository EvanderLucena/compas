# Compas — Sistema Clínico

> **O compasso clínico do nutricionista de alta performance.**  
> Plataforma de acompanhamento nutricional com prescrição de planos, catálogo TACO, prontuário biométrico e inteligência artificial que acolhe o paciente via WhatsApp com total respeito à privacidade (LGPD).

---

## 🧭 Visão Geral

O **Compas** resolve o maior atrito do acompanhamento nutricional: **a adesão do paciente ao diário alimentar**. 

Em vez de forçar o paciente a instalar aplicativos pesados ou preencher formulários cansativos, o paciente relata suas refeições naturalmente no WhatsApp por **áudio**, **foto** ou **texto**. A IA do Compas analisa o relato com base exclusiva no plano prescrito pelo nutricionista, orienta o paciente em reduções de danos e extrai gramas, calorias e macronutrientes diretamente para o prontuário clínico.

### Pilares Fundamentais
1. **Zero Apps pro Paciente:** Interface 100% conversacional no WhatsApp.
2. **Radar de Aderência:** Identificação proativa dos pacientes *No Compasso*, em *Ajuste* ou em *Descompasso*.
3. **Conduta Inviolável:** A IA nunca inventa recomendações; utiliza estritamente as opções e diretrizes prescritas pelo nutricionista.
4. **Privacidade por Design (LGPD):** O nutricionista visualiza dados estruturados de alimentação no painel, sem invasão das conversas pessoais do paciente.

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Tailwind CSS 4, Zustand, TanStack Query |
| **Backend** | Java 21 + Spring Boot 3.5 | Spring Security, Spring Data JPA, Virtual Threads |
| **Banco de Dados** | PostgreSQL 17 + Flyway | Migrações versionadas, isolamento por nutricionista |
| **Cache & Filas** | Redis 7 | Controle de rate limiting e filas assíncronas |
| **WhatsApp Gateway** | Evolution API | Gateway open-source para envio e recebimento de mensagens |
| **Inteligência Artificial** | Ollama Cloud + DeepSeek / OpenAI Whisper | Processamento de linguagem natural e transcrição de áudio |
| **Testes Frontend** | Vitest + Testing Library + Playwright | 100% dos testes unitários e testes E2E |
| **Testes Backend** | JUnit 5 + Mockito + Testcontainers + ArchUnit | Validação de arquitetura e cobertura Jacoco |
| **CI/CD** | GitHub Actions | Pipelines automatizados com AI Reviewer integrado |

---

## 📁 Estrutura do Monorepo

```
compas/
├── frontend/             # SPA React 19 + TypeScript + Vite + Tailwind 4
│   ├── src/
│   │   ├── api/          # Integração REST envelope { success, data }
│   │   ├── components/   # Componentes modulares (UI, shell, paciente, plano)
│   │   ├── stores/       # Gerenciamento de estado (Zustand)
│   │   └── views/        # Telas da aplicação (Landing, Home, Pacientes, Planos, etc.)
│   └── e2e/              # Testes end-to-end com Playwright
├── backend/              # API REST Java 21 + Spring Boot 3.5
│   ├── src/main/java/    # Código de produção (controller → service → repository)
│   ├── src/main/resources/
│   │   └── db/migration/ # Scripts SQL versionados do Flyway
│   └── src/test/java/    # Testes unitários, integração e regras de arquitetura
├── docker/               # Definições Docker Compose para desenvolvimento e produção
├── docs/                 # Documentação técnica e assets de marca
└── .github/              # Workflows de CI/CD e regras do revisor de IA
```

---

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- Java 21 JDK
- Docker & Docker Compose
- Gradle (wrapper `./gradlew` incluso no repositório)

### 1. Subir a Infraestrutura (PostgreSQL & Redis)
```bash
docker compose -f docker/docker-compose.dev.yml up -d postgres
```

### 2. Executar o Backend
```bash
cd backend
./gradlew bootRun
```
A API estará acessível em `http://localhost:8080` (health check em `/api/v1/health`).

Para rodar os testes e verificações do backend:
```bash
./gradlew test            # Testes unitários
./gradlew compileJava     # Validação de compilação
./gradlew check           # Checkstyle + Jacoco coverage
```

### 3. Executar o Frontend
```bash
cd frontend
npm install
npm run dev
```
O frontend estará acessível em `http://localhost:5173`.

Para rodar os testes e validações do frontend:
```bash
npm test                  # Testes unitários com Vitest
npx tsc --noEmit          # Verificação estrita de tipagem TypeScript
npm run lint              # ESLint (limite máximo de warnings)
npm run test:e2e          # Testes ponta a ponta com Playwright
```

---

## 🔒 Variáveis de Ambiente & Segurança

Copie o arquivo de exemplo para seu ambiente de desenvolvimento:
```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `NUTRIAI_DATASOURCE_PASSWORD` | Senha de acesso ao banco PostgreSQL |
| `NUTRIAI_JWT_SECRET` | Chave secreta HMAC-SHA256 para assinatura dos tokens JWT |
| `NUTRIAI_SEED_ADMIN_PASSWORD` | Senha padrão do administrador inicial |
| `OLLAMA_API_KEY` | Chave de API para o serviço Ollama Cloud |
| `EVOLUTION_INSTANCE_TOKEN` | Token de autenticação da instância do WhatsApp |

> **Nota de Segurança:** Chaves privadas, tokens JWT e senhas de banco nunca devem ser commitados no controle de versão.

---

## 🤖 Pipeline de CI/CD & AI Reviewer

Todo Pull Request passa automaticamente pelas seguintes esteiras de validação no GitHub Actions:

1. **`frontend-ci`:** Linting rigoroso, compilação TypeScript, suíte Vitest e build estático.
2. **`backend-ci`:** Regras do Checkstyle, compilação Java 21, testes com Testcontainers e regras de arquitetura (ArchUnit).
3. **`ai-review`:** Revisor de código com Inteligência Artificial que analisa segurança (isolamento multi-tenant, autorizações), convenções e conformidade clínica com base em `.github/review-rules.md`.
4. **`e2e`:** Testes de fluxo ponta a ponta com Playwright simulando a experiência do usuário.

---

## 📄 Licença

Copyright © 2026 Compas Tecnologia em Saúde Ltda.  
Todos os direitos reservados. Em conformidade com a Lei Geral de Proteção de Dados (LGPD).