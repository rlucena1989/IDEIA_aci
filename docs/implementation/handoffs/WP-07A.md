# Handoff WP-07A — fakes de provider, tool, verifier e tool catalog

## Perfil e pré-condições

Autor L, revisão F. Exige WP-05/05B. Não inclui catálogo.

## Objetivo

Criar fakes FIFO determinísticos para ProviderPort, ToolPort e VerifierPort, mais ToolCatalogPort exato, com sinais, terminais/falhas e cópias defensivas.

## Leia

- docs/implementation/contracts/ports_v1.md
- docs/implementation/adr/ADR-006-portas-e-ciclo-do-provider.md
- docs/implementation/contracts/v1/provider-request.schema.json
- docs/implementation/contracts/v1/provider-outcome.schema.json
- docs/implementation/contracts/v1/effect-intent.schema.json
- docs/implementation/contracts/v1/tool-result.schema.json
- docs/implementation/contracts/v1/tool-definition.schema.json
- docs/implementation/contracts/v1/verification-result.schema.json

## Arquivos autorizados

- p0/src/testing/fake-provider.ts
- p0/src/testing/fake-tool.ts
- p0/src/testing/fake-verifier.ts
- p0/src/testing/fake-tool-catalog.ts
- p0/test/testing/fake-provider.test.ts
- p0/test/testing/fake-tool.test.ts
- p0/test/testing/fake-verifier.test.ts
- p0/test/testing/fake-tool-catalog.test.ts

## Aceite

- scripts explícitos FIFO; fila vazia falha;
- chamada e saída expostas somente por cópia/readonly;
- signal sequence contígua; sink failure produz terminal único;
- AbortSignal antes/durante coberto, sem afirmar cancelamento remoto;
- ToolProposal nunca invoca FakeTool;
- FakeVerifier usa somente critério/evidence fornecidos, e erro/ausência nunca vira pass;
- FakeToolCatalog resolve apenas id/versão exatos, preserva ordem e fingerprint configurado;
- fake não lê rede, filesystem, processo, SQLite, relógio ou random;
- reset explícito, sucesso/falha/timeout/cancel/ambiguous testados.
