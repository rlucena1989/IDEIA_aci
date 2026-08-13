# Roadmap técnico

## MVP
- Core CLI e SDK.
- Protótipo vertical: CLI → plan → diff → test → report.
- Usar somente ferramentas locais/copiadas com licença identificada; não modificar instalações externas.
- Uma tarefa por workspace; planner, executor e verificador.
- Filesystem, terminal sandbox, Git branch/diff/rollback.
- Provider cloud + Ollama opcional.
- Aprovação humana, budgets, logs estruturados.
- Testes unitários e integração.

Aceite: resolver tarefas curtas em repositório real sem alterar arquivos fora do escopo; reproduzir execução e rollback.

## Versão 1
- Extensão VS Code.
- RAG incremental com tree-sitter/LSP/pgvector.
- Fila e worker remoto; pausa/retomada.
- GitHub/GitLab, CI, notificações.
- Router multi-provider e dashboards de custo/qualidade.

## Versão 2
- Multiagentes isolados por worktree.
- Reviewer/security agent, browser QA controlado.
- Self-hosted, RBAC/SSO, OpenTelemetry, políticas enterprise.
- Skills privadas e MCP governado.

## Futuro/Pesquisa
- Marketplace público assinado.
- Temporal/multi-região.
- Aprendizado de trajetórias e fine-tuning.
- Execução air-gapped avançada e agentes multimodais.

Esforço: MVP médio/alto; multi-tenant, sandbox forte e marketplace alto.
