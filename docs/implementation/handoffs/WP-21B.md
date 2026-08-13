# Handoff WP-21B — runner de avaliação e EvaluationReport

## Perfil e pré-condições

Autor F/S, revisão S independente. Exige WP-13, 15B, 15C e 16, corpus versionado e MP-P0 ao menos `exploratory`. Verdict `promote` só é permitido com MP `baseline_approved` e denominadores completos.

## Objetivo

Executar baseline e candidato sobre casos pré-registrados, preservar todas as tentativas, publicar resultados como artifact e emitir EvaluationReport determinístico. Não promover GovernanceBundle.

## Leia

- docs/research/ia/avaliacao_e_benchmarks.md
- docs/implementation/governance/admission_v1.md
- docs/implementation/contracts/v1/evaluation-report.schema.json
- docs/implementation/contracts/v1/measurement-profile.schema.json
- docs/implementation/gates/p0_gate_matrix.md
- docs/implementation/measurement/README.md

## Arquivos autorizados

- p0/src/evaluation/case-registry.ts
- p0/src/evaluation/runner.ts
- p0/src/evaluation/aggregate.ts
- p0/src/evaluation/report.ts
- p0/test/evaluation/runner.test.ts
- p0/test/evaluation/report.test.ts
- p0/test/fixtures/evaluation/
- p0/scripts/run-evaluation.mjs

## Aceite

- corpus/split/casos/baseline/candidato/runner/MP são pinados antes da primeira execução;
- cada caso/tentativa pré-registrado termina em resultado conhecido, inclusive erro/timeout/blocked;
- ordem de execução não altera agregação/fingerprint;
- denominador não exclui falhas, parse invalid, timeout ou resultado ausente;
- artifacts são publicados e revalidados antes do report; `evaluation_task_id` possui o artifact;
- gates bloqueados/falhos impedem `promote`; MP draft/exploratory impede `promote`;
- report fingerprint é recalculável e referencia o candidate fingerprint, não o bundle final;
- rerun não sobrescreve report/artifact anterior;
- saída humana distingue evidência, inferência e decisão;
- runner não edita GovernanceBundle nem gates/thresholds.

## Pare sem editar se

- corpus, split, MP ou gate catalog não estiverem versionados;
- a implementação tentar preencher denominador ausente por inferência;
- for pedido autopromote, ajuste de threshold pós-resultado ou comparação entre ambientes incompatíveis.
