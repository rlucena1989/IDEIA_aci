# Matriz independente de testes dos contratos P0 v1

Esta matriz precede a implementação. O autor do validator não pode remover um caso para fazer o código passar.

## Harness

Cada caso registra:

- case_id;
- schema_id;
- fixture ou mutação aplicada;
- resultado esperado valid ou invalid;
- error_code estável esperado;
- camada schema, semantic, transaction ou canonicalization;
- RF/RNF relacionado.

Erros não dependem do texto emitido por Ajv. O adapter converte detalhes do validator para códigos do domínio sem incluir valor sensível.

## Casos transversais

| ID | Entrada/mutação | Esperado | Camada |
|---|---|---|---|
| CT-X01 | contrato válido mínimo | valid | schema |
| CT-X02 | remover cada campo required, um por vez | invalid.required | schema |
| CT-X03 | adicionar campo desconhecido em cada objeto fechado | invalid.unknown_field | schema |
| CT-X04 | trocar contract /1 por /2 | invalid.contract_version | schema |
| CT-X05 | enviar string onde integer é exigido | invalid.type | schema |
| CT-X06 | inteiro maior que MAX_SAFE_INTEGER | invalid.range | schema |
| CT-X07 | timestamp sem milissegundos ou sem Z | invalid.timestamp | schema |
| CT-X08 | timestamp estruturalmente correto, mas data inexistente | invalid.timestamp | semantic |
| CT-X09 | ID em maiúsculas | invalid.id | schema |
| CT-X10 | ID de outro tipo no campo | invalid.id_type | schema |
| CT-X11 | JSON bruto com chave duplicada | invalid.duplicate_key | pre-parse |
| CT-X12 | schema URI ausente do catálogo local | invalid.schema_ref | semantic |
| CT-X13 | validator tenta resolver URI por rede | invalid.validator_config | architecture |
| CT-X14 | validator faz coerção, default ou removeAdditional | invalid.validator_config | architecture |

## TaskManifest

| ID | Caso | Esperado |
|---|---|---|
| CT-M01 | workspace root inexistente | invalid.workspace |
| CT-M02 | root resolve fora dos roots autorizados | deny.scope |
| CT-M03 | read/write path com ponto-ponto, backslash, NUL ou absoluto | deny.scope |
| CT-M04 | write path fora do read scope efetivo | deny.scope |
| CT-M05 | criterion_id duplicado | invalid.duplicate |
| CT-M06 | critério obrigatório sem verifier disponível | blocked.capability |
| CT-M07 | allowed_tool inexistente ou versão divergente | blocked.capability |
| CT-M08 | operation timeout maior que task timeout | invalid.timeout |
| CT-M09 | cancellation grace maior que operation timeout | invalid.timeout |
| CT-M10 | hard limit zero | valid; primeira operação cobrável negada |
| CT-M11 | currency_minor com currency null | invalid.currency |
| CT-M12 | unidade não monetária com currency preenchida | invalid.currency |
| CT-M13 | fingerprint declarado diverge do snapshot | invalid.fingerprint |
| CT-M14 | BudgetSet ausente/diverge da task | invalid.reference |
| CT-M15 | SandboxProfile ausente/diverge do host snapshot | blocked.capability |
| CT-M16 | GovernanceBundle id/fingerprint ausente ou divergente | blocked.governance_bundle |
| CT-M17 | TaskRun/evento gravados sem Manifest canônico recuperável | invalid.transaction |

## PlanStep e ToolRequest

| ID | Caso | Esperado |
|---|---|---|
| CT-P01 | posições 0, 1, 3 | invalid.plan_sequence |
| CT-P02 | step_id duplicado | invalid.duplicate |
| CT-P03 | critério ausente do manifesto | invalid.reference |
| CT-P04 | tool não permitida | deny.tool |
| CT-P05 | effect_class menor que a ToolDefinition | deny.effect_mismatch |
| CT-P06 | argumento adicional proibido pelo schema da tool | invalid.unknown_field |
| CT-P07 | target normalizado muda depois da policy | deny.fingerprint_mismatch |
| CT-P08 | precondição mudou antes de invoke | blocked.precondition |
| CT-P09 | idempotency key em tool non_idempotent | deny.idempotency |
| CT-P10 | declaração do modelo tenta reduzir risco | sem efeito na decisão |
| CT-P11 | ToolRequest omite grant requerida pela ToolDefinition | deny.capability |
| CT-P12 | profile/grant muda depois da policy | deny.fingerprint_mismatch |

## Policy e aprovação

| ID | Caso | Esperado |
|---|---|---|
| CT-A01 | policy retorna enum desconhecido | deny.policy_invalid |
| CT-A02 | policy lança, expira ou fica indisponível | deny.policy_unavailable |
| CT-A03 | approval_required com requirements null | invalid.approval_requirements |
| CT-A04 | allow ou deny com requirements objeto | invalid.approval_requirements |
| CT-A05 | grant emitido para request fingerprint diferente | deny.approval_mismatch |
| CT-A06 | principal diferente | deny.approval_mismatch |
| CT-A07 | policy fingerprint diferente | deny.approval_mismatch |
| CT-A08 | expires_at igual/anterior a granted_at | invalid.approval_time |
| CT-A09 | consumo após expiração | deny.approval_expired |
| CT-A10 | segundo consumo do mesmo approval ou nonce | deny.approval_replay |
| CT-A11 | emergency stop entre grant e consumo | deny.emergency_stop |
| CT-A12 | mudança em argumento, alvo, tool, versão, precondição ou budget | deny.fingerprint_mismatch |
| CT-A13 | crash após consumo e antes de invoke | intent prepared; reconciliar, não repetir |
| CT-A14 | deny seguido de EffectIntent | invalid.transaction |
| CT-A15 | ApprovalGrant aponta PolicyDecision diferente, ainda que request/policy coincidam | deny.approval_mismatch |
| CT-A16 | ApprovalUse/EffectIntent diverge em task/call/principal/request | invalid.transaction |

## Contexto, provider e plano

| ID | Caso | Esperado |
|---|---|---|
| CT-CTX01 | candidate != accepted + rejected | invalid.context_count |
| CT-CTX02 | range vazio ou invertido | invalid.context_range |
| CT-CTX03 | content artifact ausente/quarantined/digest divergente | invalid.evidence |
| CT-CTX04 | item recuperado tenta se declarar instruction | deny.context_authority |
| CT-CTX05 | positions com lacuna/duplicata | invalid.context_order |
| CT-CTX06 | mesmo conjunto em ordem diferente | package_fingerprint diferente |
| CT-CTX07 | source muda antes do request | context.stale_detected; I/O bloqueado |
| CT-CTX08 | package expirado | blocked.context_expired |
| CT-CTX09 | D5 em qualquer destination | deny.data_class |
| CT-CTX10 | D3/D4 remoto sem egress allow exato | deny.egress |
| CT-CTX11 | redaction falha | nenhum item/package/request persistível |
| CT-CTX12 | canário de outro project/principal | zero item aceito |
| CT-PR01 | capability necessária unknown | blocked.capability |
| CT-PR02 | bundle/package/catalog fingerprint diverge | invalid.fingerprint |
| CT-PR03 | provider.requested não commitou | provider não chamado |
| CT-PR04 | tool proposal com lista vazia | deny.tool |
| CT-PR05 | tool proposal tenta invocação direta | zero ToolPort calls |
| CT-PR06 | stream sequence pula/duplica | invalid.provider_stream |
| CT-PR07 | completed com parse invalid | terminal preservado; output não consumido |
| CT-PR08 | timeout após possível aceitação | ambiguous; sem retry automático |
| CT-PR09 | segundo terminal para a mesma request | invalid.provider_terminal |
| CT-PR10 | status completed em provider.failed | invalid.event_payload |
| CT-PR11 | status não completed em provider.completed | invalid.event_payload |
| CT-PR12 | weak-model emite JSON/tool malformado | parse invalid; nenhum efeito |
| CT-PL01 | primeira revisão diferente de 1/previous não null | invalid.plan_revision |
| CT-PL02 | revisão pula ou aponta fingerprint errado | invalid.plan_revision |
| CT-PL03 | steps artifact diverge de count/plan/task | invalid.reference |
| CT-PL04 | provider plan sem parse valid | blocked.plan_source |

## Resultados, eventos e verificação

| ID | Caso | Esperado |
|---|---|---|
| CT-E01 | ToolResult sem EffectIntent | invalid.reference |
| CT-E02 | call/task/step divergem da intent | invalid.reference |
| CT-E03 | started_at depois de finished_at | invalid.time |
| CT-E04 | duration calculada apenas por UTC após ajuste de relógio | invalid.duration_source |
| CT-E05 | read_only com efeito observado inesperado | blocked.undeclared_effect |
| CT-E06 | resposta perdida após possível efeito | effect_status ambiguous |
| CT-E07 | retry automático depois de ambiguous | invalid.retry |
| CT-E08 | exit code zero sem verificação | não prova pass |
| CT-E09 | VerificationResult sem evidence | invalid.required |
| CT-E10 | pass com artifact ausente ou digest divergente | invalid.evidence |
| CT-E11 | sequence inicial diferente de 1 | invalid.event_sequence |
| CT-E12 | lacuna, duplicata ou regressão de sequence | invalid.event_sequence |
| CT-E13 | primeiro evento com previous digest | invalid.event_chain |
| CT-E14 | evento posterior com previous null/incorreto | invalid.event_chain |
| CT-E15 | payload_digest divergente | invalid.payload_digest |
| CT-E16 | event_digest calculado incluindo a si mesmo | invalid.event_digest |
| CT-E17 | causation aponta para o próprio evento ou futuro | invalid.causation |
| CT-E18 | correção tenta update do evento anterior | deny.event_mutation |
| CT-E19 | projeção avança sem evento exato em sequence/id/digest | invalid.task_projection_update |
| CT-E20 | task.transitioned payload diverge de estado antigo/novo | invalid.task_projection_update |
| CT-E21 | evento não mutador altera current_state | invalid.task_projection_update |

## Artifacts e recovery

| ID | Caso | Esperado |
|---|---|---|
| CT-AR01 | D5 em ArtifactMetadata | invalid.data_class |
| CT-AR02 | artifact.published com lifecycle staged/quarantined | invalid.event_payload |
| CT-AR03 | committed metadata com arquivo ausente | artifact.missing; quarantine |
| CT-AR04 | tamanho/digest diverge na leitura | artifact.digest_mismatch; zero bytes retornados |
| CT-AR05 | read de staged/quarantined/tombstoned | deny.artifact_lifecycle |
| CT-AR06 | mesma digest, ArtifactId de outra task | deny.scope |
| CT-AR07 | transição quarantined -> committed | invalid.artifact_transition |
| CT-AR08 | redaction.failed com bytes_persisted/sent true | invalid.event_payload |
| CT-AR09 | limite ausente | artifact.limit_missing |
| CT-AR10 | limite cruza durante chunk | abort; nada published |
| CT-AR11 | projeção muda sem lifecycle snapshot correspondente | invalid.artifact_transition |
| CT-AR12 | snapshot antigo sofre update/delete | deny.immutable |
| CT-RC01 | baseline sequence/digest diverge | invalid.recovery_baseline |
| CT-RC02 | mesmo subject duas vezes na run | invalid.duplicate |
| CT-RC03 | chain corrompida tenta append recovery.started | deny.event_append |
| CT-RC04 | intent sem result é repetida automaticamente | invalid.retry |
| CT-RC05 | no_effect baseado só em ausência de result | invalid.reconciliation_evidence |
| CT-RC06 | ambiguous com disposição que libera retry | invalid.reconciliation |
| CT-RC07 | report counts divergem dos items | invalid.recovery_count |
| CT-RC08 | report artifact não committed | invalid.evidence |
| CT-RC09 | remaining ambiguities com outcome completed | invalid.recovery_outcome |
| CT-RC10 | recovery altera Intent/evento antigo | deny.immutable |
| CT-RC11 | retry posterior reutiliza CallId/approval | deny.replay |
| CT-RC12 | task terminal é reaberta | invalid.transition |
| CT-RC13 | segunda EffectReconciliation para a mesma intent | invalid.duplicate |

## Uso e orçamento

| ID | Caso | Esperado |
|---|---|---|
| CT-U01 | reported com source diferente de provider | invalid.usage_source |
| CT-U02 | estimated com source diferente de local_estimator | invalid.usage_source |
| CT-U03 | unknown com número | invalid.usage_unknown |
| CT-U04 | unknown com source diferente de none | invalid.usage_unknown |
| CT-U05 | soma direta de unidades diferentes | invalid.usage_unit |
| CT-U06 | accounted exatamente igual ao hard limit | hard_limit_reached |
| CT-U07 | usage atrasado cruza limite | possible_overage preservado |
| CT-U08 | PriceBook com float/denominator zero | invalid.price |
| CT-U09 | PriceBook expirado | blocked.price_book |
| CT-U10 | BudgetSet duplica unit/currency | invalid.duplicate |
| CT-U11 | uma de várias unidades cruza limite | zero nova call |
| CT-U12 | reservation/event/ledger parcialmente gravados | rollback integral |
| CT-U13 | reservation terminal volta a active | invalid.transition |
| CT-U14 | timeout ambíguo libera reserva como zero | invalid.reconciliation |
| CT-U15 | moedas diferentes somadas/convertidas | invalid.currency |
| CT-U16 | preço zero tratado como quota infinita | invalid.budget_policy |
| CT-U17 | projeção da reservation muda sem lifecycle snapshot | invalid.transition |
| CT-U18 | snapshot antigo da reservation sofre update/delete | deny.immutable |
| CT-U19 | duas reservations leem saldo antes da transação e ambas tentam commit | no máximo a primeira cabe; segunda reavalia ou falha |
| CT-U20 | ledger pula sequence ou referencia evento/reservation/usage de outra task | invalid.budget_ledger_sequence |

## Sandbox e capabilities

| ID | Caso | Esperado |
|---|---|---|
| CT-SB01 | controle required está unknown/not_enforced | blocked.capability |
| CT-SB02 | hostile_input_allowed fora de virtualized | invalid.sandbox_profile |
| CT-SB03 | evidence artifact ausente/quarantined | blocked.isolation_evidence |
| CT-SB04 | grant de outra task/principal/profile | deny.capability |
| CT-SB05 | kind/resource_type incompatíveis | invalid.capability_scope |
| CT-SB06 | grant expirou/revogou antes de invoke | deny.capability |
| CT-SB07 | approval válida sem grant | zero ToolPort calls |
| CT-SB08 | grant válida com policy deny | zero ToolPort calls |
| CT-SB09 | network destination/port fora da grant | zero egress |
| CT-SB10 | secret material no resource/constraints | deny.secret_material |
| CT-SB11 | logical_readonly tenta process/write | deny.sandbox_profile |
| CT-SB12 | adapter amplia resource após fingerprint | deny.fingerprint_mismatch |

## Governança, avaliação e MP-P0

| ID | Caso | Esperado |
|---|---|---|
| CT-GV01 | bundle approved sem report/aprovador/effective_at | invalid.governance_bundle |
| CT-GV02 | report candidate diverge do bundle | invalid.fingerprint |
| CT-GV03 | mudança de prompt/model/policy/tool mantém fingerprint | invalid.fingerprint |
| CT-GV04 | bundle expired/retired usado em nova task | blocked.governance_bundle |
| CT-GV05 | secret material no bundle | deny.secret_material |
| CT-GV06 | status/report/aprovação muda candidate fingerprint | invalid.fingerprint |
| CT-GV07 | report/aprovação muda, mas bundle final mantém fingerprint | invalid.fingerprint |
| CT-GV08 | componente runtime diverge do bundle pinado | governance.runtime_mismatch |
| CT-EV01 | promote com hard gate fail/blocked | invalid.evaluation_verdict |
| CT-EV02 | passed_cases > total_cases | invalid.evaluation_count |
| CT-EV03 | results artifact ausente/quarantined | invalid.evidence |
| CT-EV04 | corpus/runner/MP fingerprint diverge | invalid.fingerprint |
| CT-EV05 | mesmo report omite tentativa/caso pré-registrado | invalid.evaluation_denominator |
| CT-EV06 | results artifact pertence a task diferente de evaluation_task_id | invalid.evidence_scope |
| CT-EV07 | report aponta fingerprint final do bundle em vez do candidato | invalid.fingerprint |
| CT-MP01 | draft usado como gate | blocked.measurement_profile |
| CT-MP02 | baseline_approved com null/fixture/workload vazio | invalid.measurement_profile |
| CT-MP03 | ambiente diverge do profile aprovado | invalid.measurement_environment |
| CT-MP04 | threshold editado pós-resultado sem nova versão | invalid.measurement_version |

## Canonicalização

Os casos JCS-P0 e JCS-R são carregados diretamente de canonicalization/vectors.json e canonicalization/rejections.json. Além deles:

| ID | Caso | Esperado |
|---|---|---|
| CT-C01 | mesma propriedade em ordem diferente | bytes e digest iguais |
| CT-C02 | array em ordem diferente | bytes e digest diferentes |
| CT-C03 | mudança de purpose | digest diferente |
| CT-C04 | mudança material de ToolRequest | request fingerprint diferente |
| CT-C05 | NFC e NFD visualmente equivalentes | bytes e digest diferentes |
| CT-C06 | artifact digest usa bytes crus | não coincide por regra com fingerprint JCS |

## Pendências antes do release

- limites de bytes, profundidade, itens e tamanho de string dependem de OD-DP-08 e MP-P0;
- fixtures de path, symlink e junction dependem da matriz de SO;
- timestamps precisam de corpus RFC 3339 adicional;
- schema meta-validation e execução desta matriz dependem de WP-05;
- casos transacionais dependem de WP-11 a WP-17.
