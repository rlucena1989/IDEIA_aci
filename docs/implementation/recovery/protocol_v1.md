# Protocolo executável de recovery P0 v1

## Classificação de observação

Cada subject recebe exatamente uma observação:

- consistent;
- missing;
- divergent;
- ambiguous;
- reconciled.

E uma disposição:

- none;
- blocked;
- quarantined;
- replayed_projection;
- reconciled;
- manual_required.

Não existe disposição `retry` no scanner. Uma nova tentativa nasce depois, no coordinator normal, com novos IDs e autorização.

## Algoritmo

~~~text
open_read_mostly
verify_schema_and_integrity
acquire_recovery_lease
record_recovery_run_baseline

for scanner in fixed_scanner_order:
  observations = scanner.observe()
  sort observations by subject_kind, subject_ref
  for observation:
    validate evidence
    persist item if absent
    apply only declared idempotent disposition

build report artifact
persist recovery report
append recovery.reconciled if event chain is writable
apply task.transitioned when required and allowed
release lease
~~~

## Invariantes de idempotência

- `(recovery_run_id, position)` e `(recovery_run_id, subject_kind, subject_ref)` são únicos.
- Reexecutar scanner produz o mesmo observation digest enquanto o estado externo não muda.
- Disposição `replayed_projection` usa compare-and-set do baseline.
- Quarantine repetida permanece terminal e não cria leitura temporariamente permitida.
- Effect reconciliation é única por EffectIntentId; nova evidência contraditória cria correção/incident, não update.
- Report fingerprint cobre ordem dos items, baseline, versões de scanner e resultado.

## Saída operacional

| Outcome | Escrita normal | Execução de task |
|---|---|---|
| completed | liberada após checks | não retoma automaticamente; operador pode criar nova task |
| blocked | somente recovery/diagnóstico | proibida |
| inconclusive | somente recovery/diagnóstico | proibida |

## Evidência mínima por scanner

| Subject | Evidência |
|---|---|
| event_chain | first/last sequence, digests recalculados, registry/projection version |
| artifact | ArtifactId, snapshot de lifecycle corrente, metadata digest, file identity, tamanho/digest observado |
| effect | intent/request/policy/approval refs + observação externa específica da tool |
| provider_call | request ID, transport boundary marker, provider response ID digest quando houver |
| budget | budget/reservation IDs, projeção + lifecycle snapshot corrente, ledger sequences, usage refs |
| process | Job/handle identity, command fingerprint e start marker; nunca PID sozinho |
| projection | baseline sequence/digest, replay digest e versão do reducer |

Evidence bytes ficam em artifact committed; item/evento carrega somente ref/digest redigido.
