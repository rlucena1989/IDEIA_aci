# Testes automatizados por IA

> **Revisão de abordagem — 12/08/2026:** teste de bug deve falhar antes do fix e passar depois; poder de detecção, corretude e manutenção são métricas distintas. Mutation é intervenção, não prova automática. Ver [RAT-12](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-12--testes-automatizados-por-ia).

## 1. Descrição
Agente cria e executa testes, interpretando falhas.

## 2. Importância para a plataforma
Acelera cobertura, mas não substitui critérios humanos.

## 3. Ferramentas relacionadas
Jest, pytest, Playwright, mutation testing, SWE-bench.

## 4. Abordagens existentes
Testes a partir de código, bug reproducer e E2E.

## 5. Grau de maturidade
Parcialmente maduro.

## 6. Tecnologias recomendadas
Runner nativo, cobertura, mutation e sandbox.

## 7. Riscos e desafios
Testes tautológicos e flaky.

## 8. Oportunidades de inovação
Gerar teste antes do fix e validar mutações.

## 9. Próximos passos
Benchmark de testes gerados vs testes humanos.

## 10. Referências
https://playwright.dev/
