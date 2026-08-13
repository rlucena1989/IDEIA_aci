# Temas técnicos — síntese

> **Status após segunda revisão — 12/08/2026:** as notas originais abaixo permanecem como inventário, mas suas recomendações foram substituídas pela [segunda revisão das abordagens](../planejamento/revisao_abordagens_temas_2026-08-12.md).

## Fase e baseline vigentes

| Tema | Fase vigente | Baseline antes de promover complexidade |
|---|---|---|
| Arquitetura | P0 | monólito modular local |
| Orquestração | P0 mínimo / P1 avançado | máquina de estados single-agent |
| Planejamento | P0 | plano tipado proporcional ao risco |
| Execução/terminal/filesystem | P0 | tools tipadas, processo sem shell e perfis por risco |
| Git | P0 | baseline dirty + patch recuperável; sem push automático |
| Memória/RAG e indexação | P0 mínimo / P1 avançado | contexto explícito + busca lexical |
| Routing | P1 | um adapter/modelo fixo no P0 |
| Custos | P0 | ledger reportado/estimado/desconhecido + budget |
| Avaliação e testes | P0 | oráculos locais congelados; teste falha antes do fix |
| Segurança/HITL/auditoria | P0 | policy determinística, aprovação específica e evento canônico |
| Plugins e MCP | P1 | tool interna tipada; depois segunda integração read-only |
| Multiagentes | P2 | single-agent com mesmo orçamento como controle |
| UX/IDE | P0 CLI / IDE posterior | CLI evidence-first |
| Devcontainers/sandbox | P0 por perfil | distinguir reprodução de contenção adversarial |

## Orquestração de agentes
Estado, filas, planner, executor, reviewer e checkpoints. Maturidade: parcialmente madura. Recomenda-se LangGraph/StateGraph ou máquina própria simples.

## Planejamento e decomposição
DAG de subtarefas, critérios de aceite e estimativa. Maturidade: parcialmente madura. Validar plano antes de mutações.

## Execução segura
Sandbox, capability tokens, quotas e HITL. Maturidade: madura em infraestrutura; composição com LLM exige pesquisa.

## Terminal e filesystem
Adapters cross-platform, PTY, paths normalizados e snapshots. MVP obrigatório.

## Git
Branches/worktrees, diff, commits e PRs. Maduro; efeitos remotos exigem aprovação.

## Memória/contexto/RAG
AST/LSP + lexical/vector search + memória com origem. Parcialmente maduro.

## Indexação de codebase
Incremental por hash, símbolos e dependências. Escala em monorepos requer benchmark.

## Roteamento de LLMs
Adapters, matriz de custo/capacidade/privacidade e fallback. Maturidade: madura como gateway; política agentic é experimental.

## Controle de custos
Budgets, cache, compressão e limites. Maduro como telemetria; otimização precisa de dados reais.

## Avaliação/verificação
Testes, lint, SAST, benchmark de tarefas e revisão humana. Maduro em CI; qualidade agentic parcial.

## Testes por IA
Geração + execução + mutation/E2E. Parcialmente maduro; testes podem ser frágeis.

## Segurança/permissões
RBAC, capability, deny-by-default, secrets e audit. Maduro em padrões, difícil contra prompt injection.

## Human-in-the-loop
Aprovação por risco, diff, timeout e escalonamento. Maduro e essencial.

## Logs/auditoria
Eventos estruturados, trace, replay, custos e prompts redigidos. Maduro.

## Skills/plugins/tools
Manifestos, SDK e sandbox. Parcialmente maduro; marketplace público é arriscado.

## MCP
Protocolo de tools/resources/prompts. Maduro como integração emergente; confiança precisa ser aplicada pela plataforma.

## Multiagentes
Supervisor/worker e worktrees isolados. Experimental para tarefas complexas.

## UX/UI
Chat, plano, diff, timeline, custo e aprovação. Produtos maduros têm padrões; métricas de confiança ainda incertas.

## Devcontainers/Docker/sandboxes
Reprodutibilidade alta; segurança depende de hardening. Firecracker/gVisor para maior risco.

Referências: https://modelcontextprotocol.io; https://tree-sitter.github.io/tree-sitter/; https://microsoft.github.io/language-server-protocol/
