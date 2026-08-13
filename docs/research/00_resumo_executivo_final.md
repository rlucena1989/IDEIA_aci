# Resumo executivo final

## Descobertas
A categoria divide-se entre IDEs agentic (Cursor, Trae, Kiro, Antigravity), agentes autônomos (Devin, OpenHands), agentes extensíveis (Cline, OpenCode, Freebuff, Aider) e infraestrutura de modelos (LiteLLM, OmniRoute). O diferencial sustentável não é apenas gerar código: é combinar execução segura, contexto verificável, estado persistente, custo controlado, Git e governança.

## Atualização das ferramentas obrigatórias
- **Freebuff:** agente multi-surface, Apache-2.0 no repositório, modelos incluídos, subagentes e serviço apoiado por anúncios. Privacidade/treinamento exigem atenção.
- **OpenCode:** agente MIT, CLI/desktop/IDE, Plan/Build, LSP, múltiplos providers e sessões paralelas.
- **Kiro:** IDE Code OSS, CLI, web sandbox, specs, steering, automações e créditos.
- **Antigravity:** plataforma Google com command center, CLI, SDK e IDE agentic.
- **OmniRoute:** gateway/router OpenAI-compatible; há projetos homônimos e o alvo precisa ser escolhido.

## Tecnologias mais maduras
Git, LSP, tree-sitter, Docker/devcontainers, PostgreSQL, Redis, OpenTelemetry, runners de teste, APIs GitHub/GitLab e gateways OpenAI-compatible. MCP é relevante e emergente; confiança e segurança devem ser implementadas pela plataforma.

## Tecnologias experimentais ou incertas
Autonomia N4, aprendizagem contínua de trajetórias, swarm sem isolamento, fine-tuning por cliente, marketplace aberto de skills, browser agent irrestrito, desempenho real comparável entre produtos e isolamento efetivo em cada SaaS.

## Maiores oportunidades
- Local-first/self-hosted para código sensível.
- Roteamento por custo, qualidade e privacidade.
- Auditoria e replay de execução.
- Modernização de legado e monorepos.
- Skills/MCP governados.
- Benchmarks internos reproduzíveis.

## Maiores riscos
Execução destrutiva, prompt/tool injection, vazamento de secrets, dependência de providers, custo sem limite, contexto incorreto, supply chain, anúncios/uso de dados e escopo excessivo.

## Funcionalidades recomendadas
CLI/SDK, planner, executor com tools tipadas, sandbox, diff/aprovação, Git branch/rollback, testes, logs, budgets, provider adapter, Ollama opcional e RAG incremental.

## Arquitetura recomendada
Local-first modular: CLI + API local, worker, PostgreSQL/SQLite, pgvector, Redis opcional, Docker/devcontainer, adapters de LLM e Git. Extensão VS Code e worker cloud depois.

## Estratégia de MVP
Uma tarefa por workspace, autonomia N1/N2, sem marketplace e sem swarm. Medir sucesso, custo, latência, regressão, rollback e intervenção humana em benchmark interno.

## Benchmark executado
T01–T10 foram executadas em fixtures isoladas com OpenCode e Freebuff. Os dois agentes passaram os critérios funcionais observados. A consolidação está em `benchmarks/consolidacao_open_code_vs_freebuff.md`. A validação estrutural dos 20 JSONs está em `benchmarks/validate_benchmark.mjs`.

Limitação: modelo, provedor, tokens, custo, tempo comparável e chamadas completas de ferramenta não foram capturados de forma consistente. Não há base para concluir superioridade de eficiência.

## Próximos passos
1. Executar PoC de sandbox e red team em ambiente descartável.
2. Medir RAG incremental em codebases de tamanhos distintos.
3. Preencher snapshot de providers e custos na data da decisão.
4. Submeter o rascunho DPIA à revisão jurídica/DPO.
5. Implementar vertical slice CLI → plan → diff → test → rollback.
6. Definir telemetria obrigatória para o próximo benchmark: modelo, tokens, custo, tempo, tool calls e intervenção humana.
7. Manter o OmniRoute sem alterações durante sessões que dependem dele.

## Dúvidas em aberto
A política do Freebuff confirma coleta ampla, publicidade contextualizada e retenção variável; OpenCode documenta `share` como exceção; Kiro diferencia revisão de sandbox; Antigravity documenta Projects e Worktree Mode. Ainda faltam validação contratual por plano/região, PoC de sandbox, benchmark executado e política detalhada do Trae. O hardening do OmniRoute está deliberadamente adiado porque o gateway é dependência ativa da pesquisa. Ver `planejamento/plano_de_pesquisa_pendente.md` e `planejamento/restricoes_operacionais.md`.

## Referências principais
- https://devin.ai
- https://cursor.com
- https://cline.bot
- https://freebuff.ai
- https://github.com/CodebuffAI/freebuff
- https://opencode.ai
- https://github.com/anomalyco/opencode
- https://kiro.dev
- https://antigravity.google
- https://github.com/lxShaDoWxl/omniroute
- https://modelcontextprotocol.io
- https://www.swebench.com
- https://tree-sitter.github.io/tree-sitter/
- https://microsoft.github.io/language-server-protocol/
- https://opentelemetry.io
- `C:\Users\Usuario\Desktop\PROJETOS\IDEIA-master\README.md`
- `C:\Users\Usuario\Desktop\PROJETOS\IDEIA-master\DOSSIER-IDEIA.md`
