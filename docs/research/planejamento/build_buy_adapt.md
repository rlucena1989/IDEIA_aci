# Build vs Buy vs Adapt

| Componente | Build | Buy | Adaptar | Integrar API | Recomendação | Justificativa |
|---|---|---|---|---|---|---|
| Orquestração | Sim | Não | LangGraph/Temporal | — | Adaptar | lógica de produto é própria |
| LLM gateway | Não | — | LiteLLM | OpenAI/Anthropic | Integrar | commodity |
| Editor | Não | — | Monaco/Theia | VS Code API | Adaptar | não construir IDE |
| Git | Não | — | libgit2/simple-git | GitHub/GitLab | Integrar | padrão maduro |
| LSP/tree-sitter | Não | — | projetos OSS | — | Adaptar | parsing é commodity |
| Vector store | Não | SaaS | pgvector/Qdrant | — | Adaptar | evitar lock-in |
| Sandbox | Parcial | E2B/Modal | Docker/gVisor | — | Adaptar | segurança depende do ambiente |
| Fila | Não | SQS | BullMQ/Temporal | — | Adaptar | MVP simples |
| Observabilidade | Não | SaaS | OpenTelemetry | Datadog | Adaptar | portabilidade |
| MCP | Não | — | SDK oficial | Servidores MCP | Integrar | protocolo público |
| Marketplace | Não no MVP | — | registry privado | — | Aguardar | superfície de ataque |
| Modelos locais | Não treinar | GPU cloud | Ollama/vLLM | — | Adaptar | controle e fallback |

Regra: construir apenas orquestração, política, estado, experiência e métricas que diferenciem o produto.
