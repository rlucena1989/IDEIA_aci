# Roteamento de LLMs e provedores

> **Revisão de abordagem — 12/08/2026:** um adapter e modelo fixo são o baseline P0. Segundo provider valida neutralidade; routing automático depende de resultado fora da amostra, custo e compatibilidade de policy/privacy. Ver [RAT-09](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-09--roteamento-de-llms-e-provedores).

## 1. Descrição
Abstrai providers e escolhe modelo por tarefa.

## 2. Importância para a plataforma
Reduz custo e lock-in.

## 3. Ferramentas relacionadas
LiteLLM, OpenRouter, Ollama, vLLM, OpenAI-compatible APIs.

## 4. Abordagens existentes
Regras, fallback, classificação e load balancing.

## 5. Grau de maturidade
Maduro como gateway; routing agentic ainda parcial.

## 6. Tecnologias recomendadas
Interface própria + LiteLLM; registrar preço/capacidade.

## 7. Riscos e desafios
Preço volátil, diferenças de tool calling e privacidade.

## 8. Oportunidades de inovação
Router explicável com qualidade observada por tarefa.

## 9. Próximos passos
Criar matriz de capabilities e fallback idempotente.

## 10. Referências
https://docs.litellm.ai/; https://ollama.com/
