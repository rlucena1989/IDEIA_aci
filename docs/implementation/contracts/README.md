# Contratos executáveis do P0

**Versão:** v1  
**Estado:** release candidate rc.7; compilação estrita validada, implementação independente ainda ausente  
**Autoridade:** ADR-003–012, RF/RNF e estudos v2

Este diretório reduz liberdade de interpretação dos modelos de código. Os arquivos JSON Schema são a forma executável pretendida dos contratos; as notas semânticas cobrem invariantes que JSON Schema não expressa sozinho.

## Catálogo v1

| Contrato | Schema | Principal uso |
|---|---|---|
| definições comuns | [defs](v1/_defs.schema.json) | IDs, digests, timestamps e enums |
| TaskManifest | [schema](v1/task-manifest.schema.json) | admissão e preflight |
| TaskRun | [schema](v1/task-run.schema.json) | snapshot imutável da admissão |
| PlanStep | [schema](v1/plan-step.schema.json) | plano estruturado |
| ToolDefinition | [schema](v1/tool-definition.schema.json) | registro de tool |
| ToolRequest | [schema](v1/tool-request.schema.json) | request normalizada antes de policy |
| PolicyDecision | [schema](v1/policy-decision.schema.json) | allow, deny ou approval_required |
| ApprovalGrant | [schema](v1/approval-grant.schema.json) | concessão vinculada |
| ApprovalUse | [schema](v1/approval-use.schema.json) | consumo único |
| EffectIntent | [schema](v1/effect-intent.schema.json) | intenção persistida antes do efeito |
| ToolResult | [schema](v1/tool-result.schema.json) | resultado e efeito observado |
| VerificationResult | [schema](v1/verification-result.schema.json) | verificação independente |
| EventEnvelope | [schema](v1/event-envelope.schema.json) | evento canônico encadeado |
| UsageRecord | [schema](v1/usage-record.schema.json) | uso reportado, estimado ou desconhecido |
| task.created | [schema](v1/task-created.schema.json) | criação da projeção |
| task.transitioned | [schema](v1/task-transitioned.schema.json) | única mutação de estado após criação |
| cancellation request | [schema](v1/cancellation-request.schema.json) | pedido, não estado final por si só |
| approval revocation | [schema](v1/approval-revocation.schema.json) | revogação simples ou emergency stop |
| event correction | [schema](v1/event-correction.schema.json) | correção append-only |
| contexto | [query](v1/context-query.schema.json), [item](v1/context-item.schema.json), [package](v1/context-package.schema.json), [stale](v1/context-stale.schema.json) | provenance, ordem, escopo e staleness |
| provider | [capabilities](v1/provider-capabilities-snapshot.schema.json), [request](v1/provider-request.schema.json), [outcome](v1/provider-outcome.schema.json) | fronteira normalizada e terminal único |
| plan record | [schema](v1/plan-record.schema.json) | revisões imutáveis e steps como artifact |
| artifacts/redaction | [metadata](v1/artifact-metadata.schema.json), [lifecycle](v1/artifact-lifecycle.schema.json), [quarantine](v1/artifact-quarantine.schema.json), [redaction failure](v1/redaction-failure.schema.json) | lifecycle e contenção |
| recovery | [started](v1/recovery-started.schema.json), [effect reconciliation](v1/effect-reconciliation.schema.json), [report](v1/recovery-reconciliation.schema.json) | observação sem retry implícito |
| custo | [PriceBook](v1/price-book.schema.json), [BudgetSet](v1/budget-set.schema.json), [Reservation](v1/budget-reservation.schema.json), [reservation lifecycle](v1/budget-reservation-lifecycle.schema.json), [Ledger](v1/budget-ledger-entry.schema.json) | valor exato e multiunidade |
| sandbox/capability | [profile](v1/sandbox-profile.schema.json), [grant](v1/capability-grant.schema.json), [revocation](v1/capability-revocation.schema.json) | controles efetivos vinculados à intent |
| governança/eval | [bundle](v1/governance-bundle.schema.json), [evaluation report](v1/evaluation-report.schema.json) | unidade de promoção e evidência |
| medição | [profile](v1/measurement-profile.schema.json) | ambiente, fixtures, limites e thresholds |

A relação entre event_type e payload está na [taxonomia de eventos](taxonomia_eventos_v1.md) e no [registry machine-readable](event-registry-v1.json).

O registry rc.7 contém 33 tipos task-scoped e constraints condicionais para os pares evento/payload que compartilham schema. GovernanceBundle e EvaluationReport não são forçados no EventEnvelope de task; promoção organizacional precisa de agregado próprio se for implementada.

## Regras transversais

1. Validar bytes externos contra chaves duplicadas antes de JSON.parse.
2. Validar schema sem coerção ou defaults.
3. Executar os guards semânticos de [invariantes](invariantes_semanticos_v1.md).
4. Redigir antes de qualquer persistência ou fingerprint.
5. Canonicalizar e calcular fingerprints conforme ADR-004.
6. Campo desconhecido ou versão desconhecida bloqueia.
7. URI de schema é resolvida por catálogo local; não há fetch de rede.

JSON Schema não substitui regras transacionais, política, path resolution, expiração, unicidade ou comparação temporal.

## Estado de implementação

- WP-02B fica desbloqueado pelo ADR-003 e pelos vetores de ID.
- WP-05 fica especificado por estes schemas, mas exige revisão S antes da integração.
- WP-04 fica especificado pelo ADR-004 e vetores; a implementação exige revisão independente.
- WP-05B e WP-07A podem começar depois da integração de WP-05; WP-07B exige WP-11.
- WP-08 deve espelhar exatamente o registry rc.7, inclusive `payload_constraints`; WP-09A/09B usam validators reais.

Nenhum arquivo deste diretório prova que o runtime valida os contratos.

O registro da compilação estrita ampliada, DDL e template MP-P0 está em [validação de 2026-08-13](validacao_2026-08-13.md).
