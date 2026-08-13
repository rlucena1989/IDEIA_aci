# IDEIA

## 1. Resumo rápido
- Nome: IDEIA
- Categoria: IDE/plataforma multiagente/projeto local de referência
- Site/repositório: `C:\Users\Usuario\Desktop\PROJETOS\IDEIA-master`
- Status: projeto local; status comercial desconhecido
- Licença: MIT conforme README consultado; confirmar arquivos legais
- Maturidade: 3/5 — arquitetura e muitos componentes declarados, validação de produção deve ser confirmada.
- Reaproveitamento: inspiração e possível adaptação de componentes após auditoria.

## 2. Descrição
IDE baseada em Eclipse Theia com agentes especializados, LangGraph, NATS, Ollama, policy engine, audit trail, LSP/DAP, CLI, memória e observabilidade.

## 3. Funcionalidades principais
Multiagente; provider fallback; terminal; Git/delivery; RAG/pgvector; policies; aprovação; audit chain; LSP/DAP; CLI; MCP; cache; telemetria.

## 4. Arquitetura ou funcionamento provável
Fato baseado no README/DOSSIER: TypeScript/Node, Theia, React, Electron, LangGraph, NATS JetStream, PostgreSQL/pgvector e Ollama. A documentação declara agentes Analyst, Architect, Programmer, Reviewer, Tester e DevOps. Implementação real deve ser verificada por testes e código.

## 5. Pontos fortes
Cobertura ampla de governança, multiagentes, eventos, CLI e integração local.

## 6. Limitações
Escopo grande, possível divergência entre documentação e implementação, muitos componentes para manter e necessidade de validação independente de segurança/performance.

## 7. Maturidade
Nota: 3/5. Usável como referência técnica, mas status de produto e adoção externa não foram confirmados.

## 8. Reaproveitamento
Reaproveitar como inspiração; código MIT pode ser avaliado diretamente, pacote a pacote, respeitando testes e licença.

## 9. Gaps e oportunidades
Simplificar MVP, validar claims, medir UX/performance, consolidar contratos e reduzir superfície operacional.

## 10. Ideias de implementação
Usar conceitos de provider router, audit chain, approval flow, context packs e quality gates, começando por um vertical slice pequeno.

## 11. Referências
`C:\Users\Usuario\Desktop\PROJETOS\IDEIA-master\README.md`
`C:\Users\Usuario\Desktop\PROJETOS\IDEIA-master\DOSSIER-IDEIA.md`
