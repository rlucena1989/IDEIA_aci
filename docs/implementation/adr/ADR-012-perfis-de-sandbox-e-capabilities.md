# ADR-012 — Perfis de sandbox e capability grants

- Status: aceita para contratos P0 v1 release candidate
- Data: 2026-08-13
- Fecha documentalmente: seleção de perfil e vínculo de capability em ToolRequest/EffectIntent
- Relaciona: RF-006, RF-017, RF-018; RNF-001, RNF-002, WP-15, WP-17–WP-20

## Contexto

`effect_class`, policy e aprovação não confinam um processo. O estudo de sandbox distinguiu controles lógicos, host controlado e virtualização, e mostrou que Job Object, validação de paths, worktree ou container isolados não devem ser chamados de sandbox forte sem composição e prova. Os contratos anteriores ainda não vinculavam a intent ao perfil e às capabilities efetivamente concedidas.

## Decisão

### Perfil

Cada task seleciona exatamente um SandboxProfile snapshot no Manifest. O snapshot registra controles efetivos por superfície como `enforced`, `not_enforced`, `unsupported` ou `unknown`; desconhecido não satisfaz requisito.

Níveis P0:

| Nível | Significado permitido |
|---|---|
| logical_readonly | validação/policy; nenhuma contenção host forte; apenas operações read-only de fixture confiável |
| controlled_host | root/process/resource controls no host, com limitações publicadas; não executa fixture hostil |
| virtualized | boundary separado aprovado pela matriz do SO; ainda depende de egress/mount/secret policy |

`hostile_input_allowed=true` exige nível virtualized, evidence artifact committed e todos os controles obrigatórios enforced. Mesmo assim, a alegação vale apenas para a matriz testada.

### Capability grant

Uma capability grant é uma concessão do coordinator/policy, não do modelo nem da tool. Ela vincula:

- task e principal;
- SandboxProfile fingerprint;
- kind, resource type e resource normalizado;
- permissions fechadas e constraints;
- policy decision;
- validade, max uses e fingerprint.

Kinds P0: filesystem_read, filesystem_write, process_spawn, network_egress, secret_use, git_mutation e external_mutation.

Grant não substitui aprovação. A operação precisa simultaneamente de capability válida, policy allow/approval_required satisfeita e intent preparada. Aprovação não amplia grant; grant não aprova ação de alto risco.

### Vínculo à execução

- ToolDefinition declara required_capabilities.
- ToolRequest contém SandboxProfile fingerprint e CapabilityGrantIds exatas; request fingerprint cobre ambos.
- EffectIntent repete os vínculos e é rejeitada se uma grant expirou/revogou/diverge antes do invoke.
- ToolPort recebe a intent e revalida grants no último instante.
- Capability desconhecida/ausente/expirada/revogada falha antes da tool.
- Emergency stop revoga novas invocações logicamente e cria eventos de revogação; não prova interrupção de efeito já iniciado.

### Network e secrets

- Network default é deny em todo perfil P0. Grant de egress especifica destino/protocolo/porta/duração; wildcard amplo não é permitido por default.
- `secret_use` referencia handle opaco; resource não contém valor. Adapter injeta apenas no processo autorizado, pelo menor tempo, e redige ambiente/erro.
- D5 nunca aparece em Artifact, ContextPackage, ProviderRequest ou canonical JSON persistido.

## Testes obrigatórios

| ID | Caso | Esperado |
|---|---|---|
| SBX-C01 | perfil ausente/unknown | tool bloqueada |
| SBX-C02 | tool requer grant ausente | deny.capability |
| SBX-C03 | grant de outra task/principal/perfil | deny.capability |
| SBX-C04 | resource/permission muda depois da policy | fingerprint mismatch |
| SBX-C05 | grant expira/revoga antes de invoke | deny.capability |
| SBX-C06 | approval existe, capability não | nenhuma ToolPort call |
| SBX-C07 | capability existe, policy deny | nenhuma ToolPort call |
| SBX-C08 | network sem grant exata | zero egress |
| SBX-C09 | secret handle fora da grant | zero injeção |
| SBX-C10 | hostile_input_allowed em nível não virtualized | schema/semantic invalid |
| SBX-C11 | evidence de isolamento ausente/quarantined | hostile input bloqueado |
| SBX-C12 | adapter tenta ampliar path/process/network | deny.scope + incident signal |

## Não garantias

O contrato descreve e vincula controles; não os implementa. Nenhum perfil vira “forte” por declarar enforced. A alegação só nasce da matriz adversarial por SO/build/filesystem/runtime e expira quando qualquer componente material muda.
