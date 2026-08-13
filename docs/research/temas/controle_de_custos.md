# Controle de custos

> **Revisão de abordagem — 12/08/2026:** contabilidade, budget, previsão e otimização foram separados. P0 mede reportado/estimado/desconhecido e bloqueia novas chamadas; cache/compressão exigem avaliação própria. Ver [RAT-10](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-10--controle-de-custos).

## 1. Descrição
Mede e limita tokens, compute, embeddings e armazenamento.

## 2. Importância para a plataforma
Autonomia sem budget vira risco financeiro.

## 3. Ferramentas relacionadas
LiteLLM, Redis, caches, tiktoken, métricas próprias.

## 4. Abordagens existentes
Budgets hierárquicos, cache, compressão e modelos pequenos.

## 5. Grau de maturidade
Maduro em medição; otimização de qualidade é parcial.

## 6. Tecnologias recomendadas
Ledger de custo, alertas, quotas e snapshots de preços.

## 7. Riscos e desafios
Retries e contexto repetido.

## 8. Oportunidades de inovação
Custo previsto vs real e custo por critério de aceite.

## 9. Próximos passos
Instrumentar cada chamada de modelo/tool.

## 10. Referências
https://docs.litellm.ai/
