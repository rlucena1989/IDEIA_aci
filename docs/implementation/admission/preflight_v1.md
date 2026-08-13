# Pre-admissão e criação de task P0 v1

**Estado:** protocolo normativo para WP-16  
**Objetivo:** impedir TaskRun parcial ou pins divergentes antes do primeiro evento

## Fronteiras

Pre-admissão acontece antes de `task.created` e não chama provider, tool, processo, rede ou filesystem mutável. Ela pode ler configuração/governance já carregada, resolver o workspace de modo read-only e validar contratos. Falha retorna erro de admissão e persiste zero TaskRun; IDs eventualmente gerados são descartados e nunca reutilizados.

O estado de task `preflight` começa depois de `task.created`. Ele registra probes/capabilities e outros fatos task-scoped que exigem uma task existente. Nenhum probe desconhecido vira suporte presumido.

## Ordem

~~~text
capture accepted_at_utc + accepted_at_monotonic
limit/parse/validate TaskManifest bytes
resolve workspace/scope read-only
generate TaskId and remaining IDs in memory
build and validate task-scoped SandboxProfile + BudgetSet
GovernanceBundlePort.resolveApprovedExact
compare every repeated pin across Manifest/TaskRun/Sandbox/Budget
check task deadline using monotonic clock

CatalogPort.transact:
  insert canonical TaskManifest + TaskRun
  insert SandboxProfile
  insert BudgetSet + limits
  append task.created sequence 1
  create TaskProjection(created) with CAS baseline 0

append task.transitioned created -> preflight in a later atomic event/projection transaction
~~~

`TaskRun.created_at` e `task.created.occurred_at` usam `accepted_at_utc`, ainda que o commit ocorra depois. `recorded_at` usa o instante real do commit e não pode anteceder `occurred_at`. O deadline monotônico inclui a pre-admissão; persistência tardia não reinicia o budget de tempo.

## Igualdades obrigatórias

Manifest e TaskRun repetem exatamente project/workspace/principal, manifest fingerprint, GovernanceBundle, BudgetSet e SandboxProfile. BudgetSet e SandboxProfile pertencem ao TaskId recém-gerado e repetem seus fingerprints. Policy/provider/tool catalog declarados no Manifest coincidem com o bundle e os componentes carregados. DDL/FKs reforçam parte dessas igualdades; o restante continua semantic check obrigatório.

## Falhas

- antes/durante a transação: zero TaskRun/evento/projeção/budget/profile parcial;
- retorno de commit perdido: consultar TaskId/ManifestId/correlation exatos; não repetir insert por suposição;
- depois de `task.created`: toda falha vira fato/transição permitida, nunca delete da task;
- bundle/MP/evidência inválidos: falha antes da criação;
- timeout de pre-admissão: `admission.timeout`, zero I/O externo e zero retry interno.

## Testes mínimos

- mutar cada pin repetido impede commit;
- injetar falha antes de cada insert/append/CAS deixa zero linha do conjunto;
- duplicate TaskId/ManifestId/correlation/budget ID falha, sem atualizar existente;
- commit perdido é resolvido por consulta exata;
- relógio UTC regressivo não afeta deadline monotônico, mas bloqueia timestamp inválido;
- nenhuma falha pré-task cria evento “corrigido” para task inexistente;
- task criada sempre possui Manifest, TaskRun, SandboxProfile, BudgetSet, `task.created` e projeção coerentes.

O protocolo não decide legitimidade organizacional do bundle, não preenche MP-P0 e não transforma pre-admissão em gate de produto.
