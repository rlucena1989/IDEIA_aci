# Antigravity

## 1. Resumo rápido
- Nome: Antigravity (Google)
- Categoria: IDE agentic/SaaS + SDK Python
- Site/repositório: https://antigravity.google / https://github.com/google-antigravity/antigravity-sdk-python
- Status: ativo (preview)
- Licença: Apache-2.0 (SDK), proprietária (IDE/SaaS)
- Público-alvo: desenvolvedores individuais e builders de agentes
- Maturidade: 4/5 — produto Google com SDK open source
- Reaproveitamento: SDK Apache-2.0 para componentes, IDE como inspiração

## 2. Descrição
IDE agentic da Google com SDK Python para construir agentes. Powered by Gemini 3.6 Flash, com suporte a MCP, tools, hooks e stateful sessions.

## 3. Funcionalidades principais (SDK)
- **Agent:** High-level entry point batteries-included
- **Connections:** Transport e backend abstraction
- **Conversation:** Stateful session management
- **Hooks:** Lifecycle interception e policies
- **MCP:** Model Context Protocol integration
- **Tools:** In-process tool execution
- **Triggers:** Background tasks e external events
- **LocalAgent:** Execução local com policy engine
- Projects, workspaces e mensagens agendadas.
- CLI com agentes autônomos, shell e subagentes em background.
- SDK Python para prototipagem, automação e avaliações.
- IDE agentic com agent manager, artifacts e contexto de codebase.
- Browser-in-the-loop e casos frontend.
- Verificação e testes como parte do fluxo apresentado.
- Integração com Gemini/Google ecosystem conforme documentação relacionada.

## 4. Arquitetura ou funcionamento provável
Fato: a oferta separa command center, CLI, SDK e IDE.

Hipótese: existe um harness comum de agentes usado pelas quatro superfícies, com ferramentas de código, shell, browser e artefatos. A implementação do harness não é pública como um projeto open source equivalente.

## 5. Pontos fortes
- Estratégia multi-superfície coerente.
- SDK e CLI além da IDE.
- Gestão de múltiplos agentes e tarefas agendadas.
- Ênfase em artifacts e verificação.
- Integração potencial com modelos e infraestrutura Google.

## 6. Pontos fracos e limitações
- Dependência de ecossistema proprietário.
- Detalhes de retenção, modelos e isolamento variam por produto.
- Claims de desempenho devem ser validados independentemente.
- Pode haver lock-in em APIs/harness específicos.

## 7. Maturidade
Nota: 3/5. Produto oficial ativo e abrangente, mas ainda recente e com pouca transparência interna comparável a projetos open source.

## 8. Possibilidade de reaproveitamento
Reaproveitar como inspiração: command center, SDK, CLI e artifacts. Integrar apenas por APIs/termos oficiais.

## 9. Gaps e oportunidades
Portabilidade entre providers, self-hosted, auditoria independente e integração com ferramentas não-Google.

## 10. Ideias de implementação
Criar um harness interno único para CLI/IDE/web, com artifacts verificáveis e tarefas agendadas. Prioridade: média; dificuldade: alta.

## 11. Referências
- https://antigravity.google
- https://antigravity.google/product/antigravity-cli
- https://antigravity.google/product/antigravity-sdk
- https://antigravity.google/product/antigravity-ide
- https://ai.google.dev/gemini-api/docs/antigravity-agent
