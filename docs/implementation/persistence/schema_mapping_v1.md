# Mapeamento contratos ↔ SQLite P0 v1

**Estado:** normativo para WP-07B/WP-12  
**DDL:** [p0_v1.sql](p0_v1.sql)

## Regra de armazenamento

`canonical_json` contém exatamente os bytes UTF-8 JCS do contrato validado, armazenados como TEXT. `json_valid` do SQLite é apenas defesa adicional: antes do insert, a aplicação limita bytes/profundidade, rejeita duplicate keys, valida o schema, executa invariantes, canonicaliza, calcula/recalcula o fingerprint e compara os campos relacionais com o mesmo objeto. Na leitura, contratos usados como autoridade são revalidados e seu fingerprint é recalculado.

Colunas relacionais não criam uma segunda verdade. Elas indexam IDs, escopo, estados e unicidades extraídos do JSON canônico ou formam projeções explicitamente marcadas. Divergência entre coluna e JSON é corrupção, bloqueia escrita normal e aciona recovery.

## Mapeamento

| Contrato/fato | Tabela(s) | Escrita pela porta | Observação |
|---|---|---|---|
| TaskManifest | `task_manifests` | `insertTaskRecord` | bytes canônicos imutáveis; antecede TaskRun |
| TaskRun | `task_runs` | `insertTaskRecord` | admission record imutável; repete pins críticos do Manifest |
| TaskProjection | `task_projections` | `compareAndSetTaskProjection` | CAS + guards de evento/sequence/from-to/aresta; nunca fonte primária |
| EventEnvelope/payload | `events` | `appendEvent` | envelope em colunas + payload JCS; cadeia append-only |
| ArtifactMetadata/lifecycle | `artifacts`, `artifact_lifecycle` | `insertArtifactStaged`, `publishArtifact`, `quarantineArtifact` | `artifacts` é projeção; cada estado completo fica no journal |
| ContextQuery | `context_queries` | `insertContextQuery` | objeto completo + índices |
| ContextItem | `context_items` | `insertContextItems` | objeto completo; artifact e source version pinados |
| ContextPackage | `context_packages`, `context_package_items` | `insertContextPackage` | package completo + ordem relacional contínua |
| ProviderCapabilitiesSnapshot | `provider_capability_snapshots` | `insertProviderCapabilitySnapshot` | precisa existir antes da request |
| ProviderRequest/Outcome | `provider_requests`, `provider_outcomes` | métodos homônimos | request única e exatamente um terminal |
| PlanRecord/PlanStep | `plans`, `plan_steps` | `insertPlanRecord` | record e steps em um commit, conferidos contra steps artifact |
| PolicyDecision | `policy_decisions` | `insertPolicyDecision` | append-only |
| Sandbox/Capabilities | `sandbox_profiles`, `capability_grants`, `capability_revocations` | métodos homônimos | snapshots/fatos append-only |
| Approval | `approval_grants`, `approval_revocations`, `approval_uses` | grant/revocation/`consumeApproval` | policy decision + task/call/principal/request/nonce exatos e uso único |
| EffectIntent/grants | `effect_intents`, `effect_intent_grants` | `insertEffectIntent`/`consumeApproval` | intent e ligações imutáveis |
| ToolResult | `tool_results` | `insertToolResult` | terminal observado, append-only |
| VerificationResult | `verification_results` | `insertVerification` | evidência imutável |
| UsageRecord | `usage_records` | `insertUsage` | estimated/reported/unknown não se sobrescrevem |
| PriceBook | `price_books` | `insertPriceBook` | snapshot exato por task/provider/model |
| BudgetSet/limits | `budget_sets`, `budget_limits` | `insertBudgetSet` | configuração imutável |
| BudgetReservation/lifecycle | `budget_reservations`, `budget_reservation_lifecycle`, `budget_reservation_lines` | `changeBudgetReservation` | projeção + snapshots; lines imutáveis |
| BudgetLedgerEntry | `budget_ledger` | `changeBudgetReservation` | forma normalizada reconstruível, sequence append-only |
| RecoveryStarted | `recovery_runs` | `insertRecoveryRun` | baseline imutável |
| EffectReconciliation | `effect_reconciliations` | `insertEffectReconciliation` | no máximo uma por EffectIntentId |
| Recovery items/report | `recovery_items`, `recovery_reports` | métodos homônimos | observações/report append-only |
| Migração/lease | `schema_migrations`, `writer_lease` | adapter interno | não são contratos de domínio |

GovernanceBundle, EvaluationReport e MeasurementProfile são documentos organizacionais provisionados no governance root e verificados pelo `GovernanceBundlePort`; não são artificialmente atribuídos a uma task. O TaskManifest/TaskRun preserva os pins e `evaluation_task_id` permite resolver o results artifact task-scoped.

## Ordem das operações compostas

- criar task: Manifest → TaskRun → Sandbox/BudgetSet → `task.created` → projeção, um commit;
- criar/alterar artifact: projeção inicial + snapshot 1, ou novo snapshot → atualização da projeção → evento/CAS, um commit;
- reservar/conciliar budget: reservation/lines/snapshot ou novo snapshot → ledger → evento, um commit;
- consumir approval: ApprovalUse → EffectIntent/grants → evento, um commit;
- gravar plano: PlanRecord → PlanSteps → evento, um commit.

Nenhuma dessas transações envolve filesystem, provider, tool ou callback async. A etapa externa ocorre antes/depois conforme o protocolo e a incerteza fica registrada.

## Checagens obrigatórias do adapter

- PRAGMAs lidos de volta conforme ADR-008;
- prepared statements; zero identificador SQL dinâmico;
- coluna/JSON e FKs/escopo conferidos antes de cada insert;
- journals com sequence contínua e snapshot correspondente à projeção;
- transação abortada em qualquer falha de validator/constraint/CAS;
- leitura rejeita JSON/fingerprint divergente em vez de “consertar” silenciosamente;
- restore/recovery compara projeções com fatos append-only.

O script `validate-ddl.mjs` prova apenas que a migração abre em memória, que FKs/integridade estão coerentes, que os guards esperados existem e que os smoke tests selecionados se comportam. O conjunto completo depende de WP-12/21 e dos fault profiles.
