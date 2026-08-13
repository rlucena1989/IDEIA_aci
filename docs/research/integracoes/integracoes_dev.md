# Integrações de desenvolvimento

| Integração | Utilidade | Dificuldade | MVP | Riscos | Tecnologia |
|---|---|---:|---|---|---|
| LSP | símbolos/diagnósticos | média | Sim | processos travados | LSP |
| DAP | debugging | alta | Não | exposição de processo | DAP |
| Test runners | verificação | baixa | Sim | flaky tests | descoberta por config |
| Linters/formatters | qualidade | baixa | Sim | conflito de estilo | CLI nativa |
| Package managers | deps/build | média | Sim | supply chain | npm/pip/cargo |
| Docker/devcontainers | ambiente | média | Sim | escape/imagens | Docker |
| Kubernetes | deploy | alta | Não | impacto operacional | kubectl/API |
| CI/CD | automação | média | Versão 1 | secrets | GitHub Actions/GitLab CI |
| GitHub/GitLab/Bitbucket | PR/issues | média | Sim GitHub | tokens | APIs oficiais |
| Jira/Linear | backlog | média | Não | escopo indevido | OAuth/webhooks |
| Browser | QA/web research | alta | Não | prompt injection | Playwright isolado |
| APIs/bancos | contexto/operação | alta | Não | dados destrutivos | MCP/adapters |
| Secrets manager | credenciais | média | Não | exfiltração | Vault/Cloud SM |
| Observabilidade | incidentes | média | Não | dados sensíveis | OTel/Prometheus |

Priorizar filesystem, terminal, Git, runners e LSP. Adicionar integrações externas após contratos de permissão.
