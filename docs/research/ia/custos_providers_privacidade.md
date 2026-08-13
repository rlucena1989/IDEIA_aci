# Custos, providers e privacidade — estudo operacional

## Princípio
Preços, quotas, retenção e modelos mudam. Não fixar valores no código ou na documentação de produto; armazenar snapshots datados do catálogo consultado.

## Dados a registrar por chamada
- provider/modelo e versão;
- região e endpoint;
- tokens de entrada/saída/cache;
- latência e retries;
- custo calculado e moeda;
- classificação de dados enviada;
- versão do prompt e router;
- resultado da tarefa.

## Routing recomendado
1. Bloquear provider incompatível com a política de privacidade.
2. Filtrar por suporte a tool calling, contexto e idioma.
3. Filtrar por budget e quota.
4. Escolher menor custo que atingiu qualidade histórica mínima.
5. Fallback somente em erro transitório e antes de efeitos não idempotentes.

## Privacidade
- Redigir secrets e PII antes do prompt.
- Modelos locais para dados classificados como confidenciais.
- BYOK e endpoints OpenAI-compatible para empresas.
- Retenção configurável para prompts, respostas, embeddings, logs e snapshots.
- Não assumir que “API” significa zero retention: confirmar contrato e política de cada fornecedor.

## Controle econômico
- orçamento por tarefa, usuário, projeto e tenant;
- reserva de custo antes da execução;
- alertas 50/80/100%;
- máximo de iterações e retries;
- cache por hash de contexto;
- compressão com medição de qualidade;
- relatório de custo por sucesso, não apenas por chamada.

## Referências de integração
- https://docs.litellm.ai/
- https://openrouter.ai/docs
- https://ollama.com/
- https://docs.vllm.ai/

## Pendência
Preencher uma tabela de preços somente no momento de decisão de implementação, com data, região, plano e fonte oficial.
