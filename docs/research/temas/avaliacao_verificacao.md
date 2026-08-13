# Avaliação e verificação

> **Revisão de abordagem — 12/08/2026:** CI tools e benchmark público não substituem oráculo do produto. O baseline passa a ser manifesto local, checks congelados e conjunto confirmatório separado. Ver [RAT-11](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-11--avaliação-e-verificação).

## 1. Descrição
Valida resultado por testes, análise estática, diff e critérios de aceite.

## 2. Importância para a plataforma
LLM não é verificador suficiente.

## 3. Ferramentas relacionadas
Jest, pytest, cargo test, ESLint, Ruff, Semgrep, CodeQL.

## 4. Abordagens existentes
Quality gates, reviewer independente e benchmark.

## 5. Grau de maturidade
Maduro em CI; agentic parcialmente maduro.

## 6. Tecnologias recomendadas
Executores reais + resultados estruturados.

## 7. Riscos e desafios
Cobertura falsa, flaky tests e critérios incompletos.

## 8. Oportunidades de inovação
Score com evidências, não confiança subjetiva.

## 9. Próximos passos
Definir gates mínimos por linguagem.

## 10. Referências
https://www.swebench.com/
