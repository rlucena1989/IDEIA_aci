# Handoff WP-07C — fake de ArtifactStorePort

## Perfil e pré-condições

Autor L/F, revisão F/S. Exige WP-04, 05B e 07B. Não usa filesystem nem substitui WP-13.

## Objetivo

Implementar ArtifactStorePort em memória com cópias defensivas, limites, digest cru, lifecycle e operações compostas do FakeCatalog, para o slice read-only e testes de governança.

## Leia

- docs/implementation/contracts/ports_v1.md
- docs/implementation/contracts/v1/artifact-metadata.schema.json
- docs/implementation/contracts/v1/artifact-lifecycle.schema.json
- docs/implementation/artifacts/lifecycle_v1.md
- docs/implementation/persistence/schema_mapping_v1.md

## Arquivos autorizados

- p0/src/testing/fake-artifact-store.ts
- p0/src/testing/artifact-scenario.ts
- p0/test/testing/fake-artifact-store.test.ts
- p0/test/contracts/artifact-store.shared.ts

## Aceite

- stage copia bytes, aplica todos os limites e calcula SHA-256 cru;
- commit/verify/read/quarantine seguem lifecycle; somente committed íntegro é lido;
- metadata + lifecycle snapshot + fake catalog mudam atomicamente ou fazem rollback;
- mesmos bytes geram digest igual, mas ArtifactIds/objetos distintos e sem dedup implícito;
- mutar buffer de entrada/saída não altera store;
- script FIFO injeta digest mismatch, falta, limite, falha de catálogo e quarantine;
- nenhum path, fs, SQLite, rede, clock ou random implícito;
- shared suite fica pronta para ser reutilizada no WP-13.

## Pare sem editar se

- for necessário inventar quota, retenção ou transição;
- o FakeCatalog ainda não implementar os métodos compostos atuais;
- a solução tentar simular fsync/rename como evidência do adapter real.
