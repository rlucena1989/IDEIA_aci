# Orquestração de agentes

> **Revisão de abordagem — 12/08/2026:** o P0 usa uma máquina de estados explícita, single-agent, com policy e verificação determinísticas. Framework durável é candidato comparado em fault matrix, não premissa. Ver [RAT-02](../planejamento/revisao_abordagens_temas_2026-08-12.md#rat-02--orquestração-de-agentes).

## 1. Descrição
Coordena planner, executor, reviewer e workers por estados persistidos.

## 2. Importância para a plataforma
Evita loops, permite retomada e torna ações auditáveis.

## 3. Ferramentas relacionadas
LangGraph, Temporal, CrewAI, AutoGen, OpenHands, Devin.

## 4. Abordagens existentes
State machines, supervisor-worker e filas.

## 5. Grau de maturidade
Parcialmente maduro: infraestrutura madura; autonomia confiável ainda evolui.

## 6. Tecnologias recomendadas
StateGraph/máquina própria, PostgreSQL, Redis/BullMQ, OpenTelemetry.

## 7. Riscos e desafios
Loops, custo, concorrência e estado corrompido.

## 8. Oportunidades de inovação
Replay determinístico e orçamento por transição.

## 9. Próximos passos
Implementar um agente single-task com checkpoints.

## 10. Referências
https://langchain-ai.github.io/langgraph/; https://temporal.io/
