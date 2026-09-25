# Compas — OpenAI Codex Context

> **Single source of truth: `AGENTS.md`** — All project context, conventions, architecture patterns, and workflow are documented in `AGENTS.md`. Read it before starting any work.

## Quick Guide for Codex
1. **Source of Truth**: Read `AGENTS.md`. Never deviate from conventions documented there.
2. **Current Tasks**: Read `TASKS.md` for active priorities and context.
3. **Skills**: Modular skills available in `.skills/` (`pr-audit`, `github-resolution`, `expand-contract-migration`, `release`).
4. **Absolute Rule**: Never commit directly to `main`. Always branch -> PR -> CI/AI review -> merge.
5. **Session Continuation**: When instructed to "continue" or "usando ai-memory", follow the protocol in `AGENTS.md` (read `.memory/HANDOFFS.md` + `TASKS.md` + `git diff`).
