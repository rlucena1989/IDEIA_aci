# Taxonomia de eventos P0 v1

**Registry:** event-registry-v1.json  
**Estado:** rc.7; cobre o horizonte task-scoped do P0  
**Não cobre:** governança organizacional não vinculada a task e capacidades futuras de P1

## Regra de autoridade

O par event_type + payload_contract + schema_id vem do registry versionado. Divergência ou tipo ausente falha fechado. A aplicação não infere schema pelo nome recebido.

Somente dois eventos alteram a projeção de estado:

| Evento | Efeito |
|---|---|
| task.created | cria projeção no estado created; deve ser sequence 1 |
| task.transitioned | aplica a transição exata from_state → to_state pela máquina WP-03 |

Os demais eventos atuais avançam sequence, last_event_id e last_event_digest, mas não alteram current_state. Isso não significa que sejam descartáveis: policy, aprovação, intent, resultado, verificação e uso alimentam projeções próprias e gates.

## Eventos acrescentados no rc.2

| Evento | Regra material |
|---|---|
| context.query_recorded | registra estratégia, limites e contagens; query bruta fica representada por fingerprint |
| context.package_built | ordem dos items faz parte do fingerprint; somente refs de artifacts comprometidos |
| context.stale_detected | bloqueia uso do package antigo ou registra reconstrução explícita |
| provider.capabilities_recorded | snapshot observado/configurado/unknown; `unknown` nunca vira suporte presumido |
| provider.requested | fato persistido antes do I/O; request, bundle, package e catálogo vinculados por ID/fingerprint |
| provider.completed | exige ProviderOutcome com execution_status `completed`; não prova parse nem critério |
| provider.failed | exige status diferente de `completed`; ambiguidade não autoriza retry automático |
| plan.recorded | preserva revisão/fingerprint anterior, steps como artifact e origem da proposta |

`model.called`, `model.responded`, `model.requested`, `model.completed` e `model.failed` não pertencem ao registry e não são aliases. A decisão está na ADR-006.

## Eventos acrescentados no rc.3

| Evento | Regra material |
|---|---|
| artifact.published | metadata está committed; bytes finais foram reabertos e verificados antes do commit/evento |
| artifact.quarantined | leitura normal bloqueada na mesma transação; payload não contém bytes/trecho suspeito |
| redaction.failed | `bytes_persisted=false` e `bytes_sent=false`; falha não publica artifact nem chama provider |

## Eventos acrescentados no rc.4

| Evento | Regra material |
|---|---|
| recovery.started | baseline de sequence/digest já íntegro; chain corrompida não recebe append |
| effect.reconciled | observação append-only da intent; não cria retry nem altera EffectIntent |
| recovery.reconciled | report artifact committed e contagens conferidas; outcome não reabre task terminal |

## Eventos acrescentados no rc.5

| Evento | Regra material |
|---|---|
| price_book.recorded | snapshot task-scoped, fonte/vigência/fingerprint; nenhum preço “corrente” implícito |
| budget.configured | limites multiunidade congelados; BudgetSet coincide com Manifest |
| budget.reservation_changed | lifecycle explícito por CallId; timeout ambíguo não libera como zero |
| budget.ledger_recorded | append-only por unidade/moeda; não mistura estimado, confirmado e possible overage |

## Eventos acrescentados no rc.6

| Evento | Regra material |
|---|---|
| sandbox.profile_selected | snapshot de controles efetivos; declaração não substitui evidence por SO |
| capability.granted | escopo/validade/policy exatos; não substitui aprovação |
| capability.revoked | impede novas intents/invocações; não afirma interromper efeito em voo |

## Endurecimento do rc.7

O registry passou a carregar `payload_constraints` para invariantes que dependem do par evento/payload, além do JSON Schema comum. O consumidor valida primeiro o schema e depois exige igualdade estrita do campo raiz com um dos valores autorizados. No rc.7 isso fecha `provider.completed.execution_status=completed`, os quatro estados terminais de `provider.failed` e `artifact.published.lifecycle=committed`. Campo ausente, tipo divergente ou valor fora da lista é `invalid.event_payload`.

## Invariantes do reducer

- Sem task.created, nenhum outro evento da tarefa é aceito.
- task.created aparece uma única vez e em sequence 1.
- task.transitioned exige from_state igual ao estado projetado atual.
- A transição precisa ser permitida por WP-03.
- Evento conhecido com affects_task_state false preserva current_state.
- Evento desconhecido ou par tipo/schema divergente falha.
- sequence precisa ser contígua e o previous_event_digest precisa encadear.
- Duplicata de event_id, sequence ou digest não é ignorada.
- Replay da mesma sequência produz projeção estruturalmente idêntica.
- Chegada fora de ordem não é ordenada silenciosamente.
- Estado final impede novo task.transitioned, mas evento corretivo ou evidência posterior conhecida pode ser registrado sem reabrir estado.
- event.corrected não reescreve automaticamente o passado projetado; reprocessamento corretivo exige procedimento explícito e versão de projeção posterior.

## Projeção mínima

~~~text
TaskProjectionV1 {
  task_id
  project_id
  principal_id
  manifest_id
  manifest_fingerprint
  current_state
  last_sequence
  last_event_id
  last_event_digest
}
~~~

Não incluir custo, approval atual, output ou verificação nesta projeção. Cada fato possui autoridade própria.

## Versionamento do registry

- Adicionar tipo muda registry_version e testes.
- Alterar payload schema ou affects_task_state é breaking change da projeção.
- Reader que não conhece a versão do registry não processa a tarefa para escrita.
- Um evento novo não pode ser classificado como não mutador por default.
- Registry é carregado localmente e participa do fingerprint de configuração.

## Limite do registry

O rc.7 fecha os tipos task-scoped e suas restrições condicionais atualmente requeridos para RF-019.2/RNF-020.1, mas não prova sua implementação. Promoção para 1.0.0 exige validators, reducer, store, fault suites e recovery integrados. Eventos de promoção/retirada de governance bundle exigem envelope/agregado organizacional próprio e não são adicionados artificialmente a uma task.
