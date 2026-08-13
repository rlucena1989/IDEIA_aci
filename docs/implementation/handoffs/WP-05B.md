# Handoff WP-05B — tipos das portas congeladas

## Perfil e pré-condições

Autor L/F, revisão F. Exige WP-01 e WP-02B integrados. Pare se `ports_v1.md` ou ADR-006/007/012 divergirem dos schemas atuais.

## Objetivo

Transcrever, sem inventar comportamento, os tipos de Result, erros, IDs e interfaces das portas v1 para TypeScript erasable.

## Leia

- docs/implementation/contracts/ports_v1.md
- docs/implementation/adr/ADR-006-portas-e-ciclo-do-provider.md
- docs/implementation/adr/ADR-007-identificadores-operacionais-adicionais.md
- docs/implementation/adr/ADR-012-perfis-de-sandbox-e-capabilities.md

## Arquivos autorizados

- p0/src/application/result.ts
- p0/src/application/port-error.ts
- p0/src/application/ports.ts
- p0/test/application/port-error.test.ts

## Aceite

- nomes, unions e métodos correspondem ao documento, inclusive novos EntityIdKinds;
- nenhum adapter, fake, I/O, global clock/random ou regra de negócio;
- sem `any`, enum TypeScript, namespace, decorator, parameter property ou import de `packages`;
- helper de PortError rejeita code inválido e nunca incorpora cause/input bruto;
- typecheck e testes passam.

Pare se uma assinatura exigir decidir lifecycle, retry ou transação não descritos.
