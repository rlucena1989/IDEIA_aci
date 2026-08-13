# ADR-010 — Recovery, reconciliação e retomada do P0

- Status: aceita como release candidate; promoção depende de fault injection
- Data: 2026-08-13
- Fecha documentalmente: contrato de recovery de WP-17–WP-21
- Relaciona: ADR-008, ADR-009, RF-004, RF-005, RF-019; RNF-011, RNF-012, RNF-020

## Contexto

Crash pode ocorrer depois de um fato local, de um request remoto, de um efeito no filesystem/processo ou de uma resposta perdida. “Repetir o último passo” pode duplicar custo ou efeito. Recovery precisa distinguir o que é provado, ausente, divergente e ambíguo, preservando a máquina de estados vigente.

## Decisão

### Princípios

1. Recovery observa antes de agir.
2. Ausência de ToolResult/ProviderOutcome não prova que a operação não ocorreu.
3. Intent prepared impede retry automático até reconciliação específica.
4. Replay reconstrói projeção; nunca repete provider/tool.
5. Correção acrescenta fato; não atualiza evento, intent ou resultado antigo.
6. Toda ação de recovery é idempotente pela RecoveryRunId e pelo subject ref.
7. Evidência insuficiente termina bloqueado ou inconclusivo, nunca sucesso.

### Entrada em recovery

Recovery inicia quando houver lease expirado, shutdown não limpo, transaction result desconhecido, task não terminal após restart, artifact divergence, effect prepared sem terminal, provider request sem terminal, active budget reservation vencida, projection mismatch, restore ou solicitação explícita do operador.

Antes de adquirir o writer normal:

1. abrir catálogo sem escrita expansiva;
2. conferir application/schema/migration checksum;
3. executar `quick_check` e `foreign_key_check`;
4. adquirir lease de recovery via `BEGIN IMMEDIATE`;
5. criar RecoveryRun com baseline de sequence/digest;
6. executar scanners determinísticos em ordem fixa;
7. persistir RecoveryItems e evidence refs;
8. aplicar somente disposições autorizadas;
9. produzir RecoveryReport e, se a cadeia permitir, eventos de recovery;
10. transicionar task conforme máquina existente.

Se cadeia/event store estiver corrompido, não é seguro anexar `recovery.started`; o registro em tabelas de recovery e relatório externo é a evidência possível. O catálogo permanece read-only até restauração ou intervenção.

### Ordem dos scanners

| Ordem | Scanner | Regra |
|---:|---|---|
| 1 | migrations/integrity | falha bloqueia todos os demais writes |
| 2 | event chain | recalcula payload/event digests, sequence e causation |
| 3 | projection | replay e comparação; pode reconstruir projeção, não evento |
| 4 | artifacts | combina row/lifecycle/arquivo/tamanho/digest |
| 5 | approvals/intents/results | detecta consumo parcial impossível, intent preparada e terminal |
| 6 | provider calls | request sem outcome é ambígua salvo prova de não envio |
| 7 | budgets | reservation/ledger/usage; preserva possible overage |
| 8 | processos/workspace | observa handle/job/baseline/patch; PID isolado nunca basta |
| 9 | verification/final state | revalida critérios e resíduos antes de qualquer finalização |

### Matriz de efeitos

| Situação | Retry | Disposição |
|---|---|---|
| intent persisted, prova de invoke não iniciado | somente se adapter possui prova forte e nova policy/approval quando aplicável | nova call/intent; antiga reconciliada como no_effect |
| efeito observado e resultado local perdido | não | registrar effect.reconciled com evidência |
| estado externo igual à precondição e tool idempotent provada | não automaticamente | reavaliar plano/policy; nova call separada |
| timeout/crash após possível efeito | não | ambiguous/manual_required |
| processo anterior ainda observável pelo Job/handle confiável | não duplicar | aguardar/encerrar conforme policy e observar |
| apenas PID coincide | não | identidade insuficiente; ambiguous |

Reconciliation não altera EffectIntent. Ela acrescenta `effect.reconciled`; ToolResult original ausente continua ausente.

### Provider e custo

- Request persistida sem prova de envio pode ser reconciliada como `not_sent` somente quando o adapter registrou falha antes da fronteira de transporte.
- Depois de write/acceptance possível, outcome é ambiguous mesmo que provider não ofereça consulta por request ID.
- Retry cria AttemptId, ProviderRequestId e CallId novos, passa novamente por budget/policy e aponta causação.
- Reservation de chamada ambígua vira possible_overage até usage report/reconciliação; não é liberada como zero por timeout.

### Estado da task após restart

O P0 não retoma automaticamente o loop agentic interrompido.

| Estado projetado | Sem ambiguidade material | Com ambiguidade material |
|---|---|---|
| created | permanece created para decisão do operador ou cancelamento | cancelado se nada iniciou; caso incoerente bloqueia catálogo |
| preflight/contextualizing/planned/waiting_approval | task.transitioned para bloqueado | bloqueado; aprovação pendente não é consumida |
| running | task.transitioned para falha se há falha provada; caso contrário inconclusivo | inconclusivo |
| verifying | reexecutar apenas verifier read-only explicitamente idempotente; depois estado permitido | inconclusivo |
| terminal | não reabre; reporta divergence/incident fora da projeção | não reabre |

Recovery não cria estado novo. `bloqueado` e `inconclusivo` conservam a semântica já publicada.

### Shutdown limpo

O shutdown:

- fecha admissão;
- aborta requests e aguarda grace monotônica;
- não considera abort ack como prova de interrupção remota;
- persiste outcomes conhecidos/ambíguos;
- encerra Job/process tree conforme perfil;
- sincroniza artifacts em voo;
- executa checkpoint conforme policy, registra marker e libera lease.

Marker limpo é evidência auxiliar; sua ausência inicia scan, não prova corrupção.

## Fault profile REC-F

| ID | Falha | Esperado |
|---|---|---|
| REC-F01 | crash antes de recovery.started | próxima execução reabre scan; nenhum “completo” |
| REC-F02 | crash entre items | mesma run/subject não duplica disposição |
| REC-F03 | event chain divergente | zero append; modo read-only |
| REC-F04 | projection divergente com chain íntegra | rebuild e comparação antes da troca |
| REC-F05 | staged/final artifact permutations | matriz ADR-009 |
| REC-F06 | ApprovalUse sem EffectIntent | corrupção/rollback esperado; se observado, bloqueia |
| REC-F07 | EffectIntent sem ToolResult | sem retry; reconcile específico |
| REC-F08 | resposta de tool perdida após efeito | effect.reconciled ou ambiguous |
| REC-F09 | ProviderRequest sem outcome | ambiguous salvo prova not_sent |
| REC-F10 | reservation ativa sem terminal | possible_overage/reconciliation |
| REC-F11 | PID reutilizado | não sinalizar/encerrar por PID isolado |
| REC-F12 | processo órfão real | observar/encerrar pelo handle/job e registrar resultado |
| REC-F13 | verifier interrompido | só read-only/idempotente pode repetir |
| REC-F14 | report artifact falha | recovery final não é promoted; continua bloqueado |
| REC-F15 | terminal task com artifact faltante | não reabre; incidente/backup inválido |
| REC-F16 | restore com effect ambíguo | recovery read-only; sem execução automática |
| REC-F17 | relógio UTC recua | deadlines usam monotônico na execução; lease suspeito não é roubado automaticamente |
| REC-F18 | segunda instância durante recovery | writer_busy |

## Gate

WP-21 só promove quando REC-F01–18, DB-F01–16 e ART-F01–16 passam em diretório destrutível isolado, com logs redigidos e oráculo de estado externo. Teste que apenas reinicia o processo sem injetar corte nos boundaries não satisfaz o gate.

## Não garantias

O protocolo não fornece exactly-once, retoma pensamento/modelo, recupera secret perdido, reconstrói output remoto não persistido, desfaz todo efeito ou torna backup recente. Ele transforma desconhecimento em estado/evidência explícitos.
