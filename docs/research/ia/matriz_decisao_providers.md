# Matriz de decisão de providers e roteamento

## Critérios
Pontuar cada provider/modelo de 1 a 5 em: qualidade observada, tool calling, contexto, latência, disponibilidade, custo, privacidade, região, compatibilidade local e facilidade de fallback. Pesos iniciais:

| Critério | Peso |
|---|---:|
| Qualidade em benchmark interno | 25% |
| Segurança/privacidade | 20% |
| Custo por tarefa bem-sucedida | 15% |
| Tool calling/structured output | 15% |
| Latência | 10% |
| Disponibilidade | 10% |
| Portabilidade/lock-in | 5% |

## Políticas de roteamento

| Perfil de tarefa | Provider preferido | Fallback | Regra |
|---|---|---|---|
| leitura/indexação local | modelo local | gateway aprovado | não enviar arquivo inteiro sem necessidade |
| classificação simples | modelo barato/local | provider secundário | máximo de tokens baixo |
| planejamento complexo | modelo com melhor score interno | segundo melhor | aprovar plano antes de editar |
| edição multi-arquivo | modelo com tool calling comprovado | local/segundo provider | exigir schema e diff |
| debugging | modelo com melhor sucesso histórico | reviewer | limitar iterações |
| segurança | modelo/reviewer independente | humano | zero auto-merge |
| dados confidenciais | local/self-hosted | nenhum | bloquear saída para provider não aprovado |
| tarefa longa | provider estável + worker | fallback idempotente | checkpoint antes de efeitos externos |

## Dados obrigatórios no catálogo
`provider_id`, `model_id`, snapshot de preço, janela, capabilities, região, retenção, versão do adapter, score interno, p95 de latência, taxa de erro e data de atualização.

## Regra de promoção
Não promover um modelo por preço isolado. Exigir amostra mínima, taxa de sucesso, regressão de segurança zero e custo por tarefa concluída menor ou igual ao baseline.

## Referências
- https://docs.litellm.ai/
- https://openrouter.ai/docs
- https://ollama.com/
- https://docs.vllm.ai/
- `ia/benchmark_interno.md`
