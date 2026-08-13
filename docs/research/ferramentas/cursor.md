# Cursor

## 1. Resumo rápido
- Nome: Cursor
- Categoria: IDE/agentic coding/SaaS
- Site/repositório: https://cursor.com / https://docs.cursor.com
- Status: ativo
- Licença: proprietária; base/editor e extensões têm componentes com licenças próprias.
- Maturidade: 4/5 — produto de uso amplo; detalhes internos não públicos.
- Reaproveitamento: inspiração e APIs/padrões públicos; não código proprietário.

## 2. Descrição
IDE orientada a agentes, edição multi-arquivo, contexto de codebase, modelos múltiplos, cloud agents e revisão.

## 3. Funcionalidades principais
- Chat/Agent/Composer; edição multi-arquivo; regras; indexação/contexto; modelos; MCP; cloud agents; Bugbot/review; integrações Git.

## 4. Arquitetura ou funcionamento provável
Hipótese: editor baseado em ecossistema VS Code, backend de indexação e gateway multi-modelo, workers isolados para tarefas cloud. Implementação interna não publicada.

## 5. Pontos fortes
UX integrada, velocidade de edição, contexto de codebase e acesso a modelos diversos.

## 6. Limitações
Código fechado, dependência de serviço e cobrança/limites sujeitos a plano; métricas independentes de sucesso são insuficientes.

## 7. Maturidade
Nota: 4/5. Produto maduro para uso diário, mas agente e pricing evoluem rapidamente.

## 8. Reaproveitamento
Como inspiração: Composer, regras, contexto e UX. Não reutilizar componentes sem licença clara.

## 9. Gaps e oportunidades
Self-hosted completo, auditoria profunda, routing transparente, execução offline e controle de secrets.

## 10. Ideias de implementação
Extensão VS Code fina sobre core próprio; diff transacional, RAG híbrido e router com métricas.

## 11. Referências
https://cursor.com
https://docs.cursor.com
https://cursor.com/security
