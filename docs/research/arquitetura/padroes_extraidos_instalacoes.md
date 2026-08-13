# Padrões extraídos das instalações locais

## Arquitetura alvo para IDEIA

```text
CLI / VS Code Extension / Desktop / Web
                    |
             Core Agent Runtime
                    |
     Planner -> Tool Manager -> Verifier
                    |
       Provider Gateway / OmniRoute
                    |
       Local / Cloud / Self-hosted Models
```

## Padrões observados

| Padrão | Evidência local | Adaptação para IDEIA |
|---|---|---|
| Gateway desacoplado | OmniRoute em `localhost:20128` | interface OpenAI-compatible |
| Plugin provider | `@omniroute/opencode-plugin` | SDK de providers com Zod/schema |
| Configuração JSON | `opencode.json` | config por projeto e perfil |
| Core multi-surface | OpenCode/Freebuff/Devin/Antigravity | CLI primeiro, extensão depois |
| Code OSS | VS Code/Cursor/Devin/Antigravity | reutilizar editor, não construir IDE |
| Worktree | Devin/Antigravity | isolamento por tarefa |
| Testes de adapters | plugin OmniRoute | contract tests obrigatórios |
| Persistência local | OmniRoute SQLite/AppData | SQLite offline + Postgres depois |
| Extension host | VS Code-like apps | tools/plugins com permissões |

## Arquitetura recomendada
1. `@ideia/core`: estado da tarefa e ciclo agentic.
2. `@ideia/tools`: filesystem, terminal, Git, testes.
3. `@ideia/providers`: contrato comum e capabilities.
4. `@ideia/router`: custo, qualidade, privacidade e fallback.
5. `@ideia/policy`: risco e aprovação.
6. `@ideia/audit`: eventos, hashes, replay.
7. `@ideia/context`: indexação e RAG.
8. clientes: CLI, extensão VS Code e dashboard.

## Próximo protótipo
Implementar somente um fluxo: `CLI -> provider gateway -> plan -> diff -> test -> report`, usando um workspace descartável e sem modificar instalações externas.
