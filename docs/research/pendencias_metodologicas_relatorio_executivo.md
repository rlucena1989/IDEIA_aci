# Pendências metodológicas e relatório executivo

## Concluído
- T01–T10 executadas com OpenCode e Freebuff.
- Links Markdown locais validados: 0 quebrados após correção.
- 22 resultados JSON estruturados presentes e validados por `validate_benchmark.mjs` (20 rodada 1 + 2 rodada 2).
- Artefatos `.freebuff` inventariados sem inspeção de conteúdo.
- Consolidação funcional publicada.
- Rodada 2 de telemetria executada em T01 e T07 (duração e tool calls capturados).

## Pendências
1. Estender a [telemetria](benchmarks/protocolo_telemetria.md) às demais tarefas e capturar modelo, provedor e tokens.
2. Repetir as demais tarefas sob sandbox restritiva usando o [checklist](benchmarks/checklist_sandbox_T01_T07.md) como referência.
3. Definir um validador formal de schema JSON, caso o schema evolua além dos campos atualmente verificados.
4. Executar o [plano de red team sintético](benchmarks/plano_red_team_sintetico.md).
5. Medir RAG em codebases de tamanhos distintos.
6. Submeter DPIA a revisão jurídica/DPO.
7. Implementar vertical slice CLI → plan → diff → test → rollback.

## Conclusão executiva
O benchmark suporta equivalência funcional entre OpenCode e Freebuff nas 10 tarefas observadas. Não suporta ranking de custo, velocidade ou eficiência, pois a telemetria foi incompleta. A recomendação é repetir a rodada após instrumentação obrigatória e sandbox mais restritiva.
