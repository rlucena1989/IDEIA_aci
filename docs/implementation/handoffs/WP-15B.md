# Handoff WP-15B — loader e admissão de GovernanceBundle

## Perfil e pré-condições

Autor F, revisão S independente. Exige WP-02A, 04, 05, 05B, 07B e 07C. A integração real exige WP-11 e 13. Use somente fixtures sem secrets.

## Objetivo

Implementar `GovernanceBundlePort`: carregar um snapshot local imutável antes de aceitar tasks e admitir somente bundle aprovado, vigente e integralmente ligado a EvaluationReport, MeasurementProfile, results artifact e componentes runtime exatos.

## Leia

- docs/implementation/governance/admission_v1.md
- docs/implementation/contracts/v1/governance-bundle.schema.json
- docs/implementation/contracts/v1/evaluation-report.schema.json
- docs/implementation/contracts/v1/measurement-profile.schema.json
- docs/implementation/adr/ADR-004-json-canonico-e-fingerprints.md
- docs/implementation/contracts/ports_v1.md

## Arquivos autorizados

- p0/src/application/governance-loader.ts
- p0/src/application/governance-admission.ts
- p0/src/domain/governance-fingerprints.ts
- p0/test/application/governance-loader.test.ts
- p0/test/application/governance-admission.test.ts
- p0/test/fixtures/governance/

## Aceite

- loader usa caminhos exatos, limites, duplicate-key rejection, schemas e cópia defensiva;
- admissão não faz I/O e resolve apenas `(bundle_id, bundle_fingerprint)` exatos;
- candidate/final/report/MP fingerprints são recalculados com purposes corretos;
- approved/vigência/verdict/gates/denominadores/artifact task-scope são conferidos;
- runtime provider/prompts/policy/tools/context/limits divergiu => falha fechada;
- nenhuma API promove, edita, escolhe latest ou carrega credencial;
- CT-GV01–08, CT-EV01–07, CT-MP01–04 e PORT-15–16 passam;
- erros seguem a taxonomia do protocolo e não incluem bytes dos documentos.

## Pare sem editar se

- o governance root real, papéis organizacionais ou assinatura forem exigidos;
- a solução precisar promover bundle ou aceitar report sem MP/artifact verificável;
- houver necessidade de dependência nova.
