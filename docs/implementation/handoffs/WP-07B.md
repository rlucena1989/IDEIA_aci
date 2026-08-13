# Handoff WP-07B — fake transacional do CatalogPort

## Perfil e pré-condições

Autor F, revisão S. Exige WP-05B, WP-08 e WP-11. Não é tarefa para modelo L isolado.

## Objetivo

Implementar CatalogPort em memória com as mesmas operações compostas, constraints e rollback do adapter SQLite, para contract suites compartilhadas.

## Leia

- docs/implementation/contracts/ports_v1.md
- docs/implementation/contracts/invariantes_semanticos_v1.md
- docs/implementation/adr/ADR-008-perfil-sqlite-p0.md
- docs/implementation/persistence/p0_v1.sql
- docs/implementation/persistence/schema_mapping_v1.md

## Arquivos autorizados

- p0/src/testing/fake-catalog.ts
- p0/src/testing/catalog-scenario.ts
- p0/test/testing/fake-catalog.test.ts
- p0/test/contracts/catalog-port.shared.ts

## Aceite

- transaction trabalha em clone e só publica no commit;
- throw/Result error/constraint faz rollback total;
- IDs, event sequence/digest, approval/nonce, terminal provider e ledger únicos;
- Manifest/TaskRun canônicos e todas as operações da CatalogTransaction presentes, sem método ignorado;
- artifact/reservation projections exigem snapshot de lifecycle correspondente; EffectReconciliation é única por intent;
- operações compostas não expõem estado parcial;
- `readBudgetAccounting` enxerga o clone transacional atual; duas reservas não aprovam sobre snapshot externo obsoleto;
- todas as consultas exatas da porta existem, revalidam cópia e não oferecem query genérica;
- queries retornam cópia readonly em ordem normativa;
- fault script injeta falha antes de cada write interno;
- mesma shared suite roda posteriormente contra SQLite.
