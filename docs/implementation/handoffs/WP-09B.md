# Handoff WP-09B — corpus semântico e transacional

## Perfil e pré-condições

Autor F/S, revisão S independente. Exige validators e o componente alvo; fixtures podem ser pré-escritas, mas não marcadas passing antes disso.

## Objetivo

Transformar a matriz de contratos, PORT, CST, SBX, DB, ART e REC em catálogo de casos imutável, com oráculo e requisito.

## Leia

- docs/implementation/contracts/matriz_testes_contrato_v1.md
- docs/implementation/contracts/invariantes_semanticos_v1.md
- docs/implementation/gates/p0_gate_matrix.md
- docs/implementation/traceability/p0_matrix.md

## Arquivos autorizados

- p0/test/fixtures/semantic/cases.json
- p0/test/fixtures/semantic/README.md
- p0/test/semantic/case-catalog.test.ts
- p0/test/semantic/run-semantic-case.ts

## Aceite

- cada case possui case_id, camada, requisito, preconditions, mutation, expected code e oracle;
- IDs da matriz não somem nem são renomeados;
- casos não executáveis ficam `blocked_by` explícito, não pass/skipped genérico;
- fixtures não contêm secret real, path do operador ou rede;
- runner não altera oráculo e rejeita case/enum desconhecido.
