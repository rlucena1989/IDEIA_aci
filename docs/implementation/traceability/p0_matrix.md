# Rastreabilidade P0 — requisitos, contratos, pacotes e evidência

Esta matriz é índice de cobertura pretendida. “Contrato” não significa requisito satisfeito.

## Requisitos funcionais P0

| Família | Contratos/decisões | Pacotes | Evidência de fechamento |
|---|---|---|---|
| RF-001/002 projetos e manifesto | ADR-003, TaskManifest/TaskRun, GovernanceBundle, SandboxProfile, BudgetSet | WP-02B, 05, 12, 15B | manifest canônico + admission/scope/path corpus |
| RF-003/004 ciclo e tarefa | ADR-006, task states/events, ProviderPort | WP-03, 08, 11, 15B/15C, 16 | reducer/replay + admission/budget + slice read-only |
| RF-005 plano | PlanStep, PlanRecord, plan.recorded | WP-05, 08, 16 | parse/plan revisions/criteria corpus |
| RF-006 tools | ToolDefinition/Request, Policy, Intent, ToolResult | WP-07A, 15, 17 | broker sequence + bypass negatives |
| RF-007 terminal/processo | ADR-012, CapabilityGrant, ToolPort | WP-19 | process tree/timeout/output/fault suite |
| RF-008 filesystem | ADR-009, capability grants, artifact refs | WP-13, 18, 20 | path/link/precondition/rollback corpus |
| RF-009 Git P0 | effect/capability/verification | WP-18, 20 | clean/dirty/concurrent worktree fixtures |
| RF-011 contexto | ContextQuery/Item/Package/Stale | WP-09B, 16 | CTX-T01–12 + cross-scope/injection |
| RF-012 memória sessão | ContextItem source memory + expiry | WP-16 limitado | TTL/scope/correction corpus; P1 lifecycle amplo excluído |
| RF-013/014 provider fixo | ProviderCapabilities/Request/Outcome, ADR-006 | WP-07A, 16, 22 | provider contract fake e real; sem fallback P0 |
| RF-017 confinamento | ADR-012, SandboxProfile/CapabilityGrant | WP-15, 17–20 | SBX-C01–12 + matriz por SO |
| RF-018 policy/aprovação | PolicyDecision/Approval/Capability/Intent | WP-14, 15, 17 | replay/expiry/emergency stop/atomic use |
| RF-019 auditoria | EventEnvelope + registry rc.7 + ADR-004/008 | WP-05, 08, 11, 12 | Ajv, constraints de payload, cadeia, tamper, consulta por task |
| RF-020 custo | ADR-011, PriceBook/Budget/Usage/lifecycle | WP-06, 12, 15C, 22 | CST-X/CT-U + reserva/reconciliação |
| RF-021 verificação | VerificationResult, evidence refs | WP-20 | quatro outcomes e falsos claims |
| RF-022 testes | Manifest criteria/tool/process/artifacts + EvaluationReport | WP-19, 20, 21, 21B | baseline/final/flaky/mutation fixtures e denominadores completos |
| RF-023 recovery/rollback | ADR-009/010, recovery/effect events | WP-18, 20, 21 | ART-F/REC-F + residue report |
| RF-024 progresso local | EventEnvelope/CatalogPort | WP-11, 16, 19 | reconnect/read projection sem efeito |

## Requisitos não funcionais P0

| Família | Evidência dominante |
|---|---|
| RNF-001–004 segurança/isolamento/privacidade/identidade | threat model, ADR-012, SEC corpus, QG-01/02, principal/scope negatives |
| RNF-005–009 desempenho/capacidade/concorrência | MP-P0 aprovado, workloads frios/quentes, writer/backpressure tests |
| RNF-010–013 continuidade/confiabilidade/auditoria/telemetria | DB-F, ART-F, REC-F, cadeia/replay/redaction |
| RNF-014 modularidade | contract suites Provider/Tool/Catalog/Artifact/Verifier e import graph |
| RNF-016 portabilidade | matriz Windows/Linux por build/filesystem; sem badge inferido |
| RNF-017 local-first | provider local/fake sem dependência cloud obrigatória |
| RNF-018 manutenção | clean install, lock, typecheck/lint/test/contracts + coverage por risco |
| RNF-019 usabilidade/revisão | relatório estruturado e teste de compreensão dos cinco estados |
| RNF-020 governança/replay | candidate/bundle/report/manifest/request/context/tool/verifier fingerprints; replay ≠ reexecução |
| RNF-021 custo | Usage/PriceBook/Budget separados; hard limit/reconciliation |
| RNF-022 tolerância a falhas | matriz DB-F01–16, ART-F01–16, REC-F01–18 e provider/process faults |

## Lacunas que continuam reais

- MP-P0 ainda é template draft; limites/TTL não estão aprovados.
- G0/G1 não foram executados.
- Schemas/DDL foram validados estruturalmente, mas nenhuma implementação P0 existe neste workspace.
- Sandbox virtualized é candidato, não controle demonstrado.
- Provider real/credenciais/egress aguardam WP-22 e fechamento de SEC-INC-001.
- P1/P2, cloud, multiusuário, plugins, MCP, editor, marketplace e não repúdio externo permanecem fora do P0.
