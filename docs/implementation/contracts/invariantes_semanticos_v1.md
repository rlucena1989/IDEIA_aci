# Invariantes semânticos dos contratos P0 v1

JSON Schema valida forma local. As regras abaixo também são obrigatórias e devem ter testes próprios.

## Ordem de validação

1. limitar bytes e profundidade antes do parse;
2. rejeitar chaves duplicadas e JSON inválido;
3. validar schema sem fetch remoto, coerção ou defaults;
4. normalizar somente campos cujo contrato prevê normalização;
5. validar invariantes relacionais e temporais;
6. redigir conteúdo persistível;
7. calcular fingerprint;
8. persistir fatos que precedem efeito;
9. somente então autorizar a próxima etapa.

Falha em qualquer etapa não cai em caminho permissivo.

## IDs, nomes e tempo

- O tipo esperado deve conferir o prefixo; UUID válido com prefixo de outro tipo falha.
- Gerador duplicado falha; não busca ou atualiza o registro já existente.
- Nomes estáveis nunca são usados como caminho, comando ou autorização sem adapter específico.
- occurred_at e recorded_at são UTC de auditoria; duração e deadline usam relógio monotônico durante a execução.
- recorded_at não antecede occurred_at.
- Comparação temporal usa instantes parseados; não compara strings arbitrárias.

## TaskManifest

- workspace_root é resolvido pelo host, deve existir, ser diretório e permanecer dentro dos roots autorizados.
- A forma resolvida e a forma apresentada são registradas separadamente quando divergirem; fingerprint usa a forma canônica efetiva.
- read_paths e write_paths são lógicos, relativos ao workspace, usam barra normal, não contêm vazio, NUL, ponto, ponto-ponto, barra duplicada ou backslash.
- Cada path é resolvido com defesa contra symlink/junction e revalidado imediatamente antes do efeito.
- write_paths deve ser subconjunto efetivo de read_paths.
- criterion_id é único no manifesto.
- Cada critério obrigatório possui método e verifier existentes.
- Cada allowed_tool existe no registry exatamente na versão indicada.
- operation_timeout_ms não excede task_timeout_ms.
- cancellation_grace_ms não excede operation_timeout_ms.
- O hard limit zero é válido e impede a primeira operação cobrável.
- budget_set_id e budget_fingerprint resolvem para BudgetSet da mesma task; todos os limites do set são aplicados.
- governance bundle id/fingerprint resolvem exatamente para bundle aprovado/vigente pelo protocolo de admissão; não existe escolha implícita de latest.
- sandbox profile id/version/fingerprint resolvem para SandboxProfile da mesma task e do host/ambiente observado.
- policy_fingerprint e config_fingerprint são recalculados; não são aceitos apenas por declaração.
- Campos D5 contêm somente handles; presença de material secreto bloqueia.
- O Manifest canônico é persistido antes do TaskRun e nunca sofre update/delete. ID/fingerprint sem bytes recuperáveis não satisfaz auditoria.

## PlanStep

- plan_id e task_id são iguais em todos os passos do mesmo plano.
- position é único, começa em zero e é contíguo.
- step_id é único.
- criterion_ids existem no manifesto.
- tool e versão pertencem a allowed_tools.
- effect_class é igual à ToolDefinition registrada; o plano não pode rebaixá-la.
- Mudança de tool, versão, efeito, alvo, risco, critério ou orçamento produz novo fingerprint de plano e invalida aprovação dependente.

## ContextQuery, ContextItem e ContextPackage

- Query, item e package pertencem à mesma task/project/principal do manifesto ativo.
- `candidate_count = accepted_count + rejected_count`; contagens são obtidas depois dos filtros de root, principal, projeto, data class e trust class.
- `read_paths` passam pela mesma resolução defensiva do manifesto; query não amplia escopo.
- Range possui `start < end_exclusive`; linha usa base zero e end exclusivo, byte usa offset dos bytes exatos da versão digerida.
- `source_version` é recalculada na observação e novamente antes de materializar a ProviderRequest.
- `content_ref` resolve para o `content_artifact_id` comprometido, com mesmo digest, tamanho, media type e estado committed.
- Conteúdo de file, event, tool_result, user_input e memory é dado não confiável. `trust_class: instruction` só é aceito para fonte/configuração explicitamente autorizada pelo bundle; texto recuperado não se autopromove.
- `redaction_status` não possui valor failed: falha de redação impede criar item/package e produz evento `redaction.failed` quando esse contrato for integrado.
- Positions do package são únicas, começam em zero e são contíguas. Ordem, items, exclusions e destination participam do fingerprint.
- IDs de item e query não se repetem no mesmo package. Totais são recalculados a partir dos refs; estimativa de tokens nunca é tratada como uso reportado.
- `validated_at >= created_at`, `expires_at > validated_at`; package expirado ou stale não entra em nova request.
- D5 nunca entra em package destinado a provider. D3/D4 remoto exigem decisão de egress vinculada; classe desconhecida falha.
- `destination: local` ainda exige minimização, classificação e redação; local não significa confiável.
- `context.stale_detected` exige digests diferentes e bloqueia o package antigo ou registra um novo package; não atualiza bytes/fingerprint antigos.

## ProviderCapabilities, ProviderRequest e ProviderOutcome

- Capability `unknown` não satisfaz requisito de structured output, tool calling, usage reporting ou idempotency.
- Snapshot é específico de provider/endpoint/model/revision observada. Mudança de endpoint, modelo, configuração ou descoberta produz novo fingerprint.
- ProviderRequest pertence a um único AttemptId, ProviderRequestId e CallId; cada retry cria os três novamente e preserva causação.
- Request referencia bundle, capabilities, prompt, package e catálogo pelos fingerprints exatos usados. Qualquer divergência antes do I/O bloqueia.
- BudgetSet/Reservation pertencem à mesma task/call, estão active, cobrem os máximos da request e foram comprometidos antes de `provider.requested`/I/O.
- Instruction artifacts e todos os items do package são committed, íntegros, ainda autorizados e materializados por allowlist exata; provider adapter não enumera o store.
- Tool list é subconjunto exato do manifesto e do catálogo fingerprintado. Lista vazia impede aceitar tool proposal.
- `response_schema_id` é null quando o output contract não usa schema. Quando preenchido, resolve localmente e capability structured_output precisa ser supported ou o coordinator usa estratégia explicitamente diferente.
- ProviderRequest remota exige egress_decision_id. Local usa null, mas endpoint precisa estar classificado local por configuração confiável.
- D5 nunca é enviado; presença de D5 bloqueia inclusive endpoint local. D3/D4 remoto exigem policy allow explícita para package/request exatos.
- `provider.requested` é persistido antes do I/O. Falha nessa persistência impede a chamada.
- Sinais têm sequence contígua por call, são limitados e não possuem autoridade. Tool proposal precisa percorrer todo o broker.
- Um request possui exatamente um terminal persistido. `provider.completed` exige `execution_status: completed`; `provider.failed` exige outro status.
- completed pode ter `parse_status: invalid`; isso bloqueia consumo como plano/tool/decisão e não se converte em provider.failed retroativamente.
- Para status completed, `error_code` é null e output refs são ambos null ou ambos não null. Para os demais, error_code é obrigatório; output parcial pode ser artifact quarantined, mas não evidência válida.
- `started_at <= finished_at`; duration vem do relógio monotônico.
- `result_digest` usa purpose provider-result sobre o objeto sem o próprio campo.
- `retry_disposition: safe` só é permitido quando não houve aceitação remota ou existe idempotência provada. `ambiguous` nunca inicia retry automático.
- Provider response ID bruto não é persistido por padrão; registra-se digest quando necessário para reconciliação.

## GovernanceBundle, EvaluationReport e MeasurementProfile

- Bundle é imutável por `(bundle_id, bundle_version, bundle_fingerprint)`; mudança em provider/model/prompt/policy/tools/context/limits/eval cria nova versão/fingerprint.
- `candidate_fingerprint` usa purpose `governance-candidate` sobre a projeção formada por `contract`, `bundle_id`, `bundle_version`, `provider`, `prompts`, `policy`, `tool_catalog_fingerprint`, `context_strategy`, `limits_profile_fingerprint` e `measurement_profile_fingerprint`, sem campos de status, avaliação, aprovação ou os dois fingerprints.
- `bundle_fingerprint` usa purpose `governance-bundle` sobre o bundle completo sem o próprio campo; portanto inclui `candidate_fingerprint`, status, EvaluationReport e aprovação sem criar dependência circular.
- Bundle approved referencia EvaluationReport existente, íntegro, cujo `candidate_fingerprint` coincide exatamente com o do bundle.
- EvaluationReport `promote` exige todos os hard_gates pass, nenhum denominator/case ausente, results artifact committed e MP-P0 baseline_approved.
- Gate passed_cases não excede total_cases e outcome pass exige igualdade para gates 100%; regra específica do gate continua no gate catalog.
- started_at <= finished_at; case_count coincide com resultados únicos do artifact e com denominadores aplicáveis. `results_artifact_id` pertence a `evaluation_task_id`.
- Métrica racional usa denominator positivo; unidades/métricas distintas não são agregadas sem função versionada.
- Baseline/candidate, corpus/split, runner e measurement profile fingerprints correspondem aos bytes/configuração efetivos.
- Report `hold`, `reject` ou `inconclusive` não promove bundle. Um revisor/modelo não altera verdict sem novo report.
- Bundle approved possui aprovador autorizado, approved_at/effective_at coerentes e não está expirado/retired na admissão da task.
- GovernanceBundle não contém secret; provider credential permanece handle fora do bundle.
- MeasurementProfile draft/exploratory pode ter null e serve só a exploração. baseline_approved exige environment/limits completos, fixtures/workloads não vazios, approval/evidence e profile_fingerprint.
- Resultado de ambiente/fixture divergente recebe novo profile fingerprint e não satisfaz gate antigo.
- Threshold provisório não é editado pós-resultado; decisão reter/revisar/rejeitar cria nova versão/evidência.

## PlanRecord

- Primeira revisão é 1 e possui previous_plan_fingerprint null. Revisões seguintes são contíguas e apontam exatamente o fingerprint anterior.
- `steps_ref` resolve para `steps_artifact_id` committed; o artifact contém exatamente `step_count` PlanSteps schema-valid do mesmo plan/task.
- Positions dos PlanSteps começam em zero, são contíguas e únicas; todos os critérios referenciados existem.
- Plano vindo de provider referencia a ProviderRequest terminal completed com parse valid. Plano determinístico ou fornecido pelo usuário usa source_provider_request_id null e registra sua causação por evento.
- Revisão preserva a anterior; não há update in-place de steps ou fingerprint.

## ArtifactMetadata, quarentena e redação

- ArtifactId identifica metadata/lifecycle; ArtifactRef digest identifica bytes. Igualdade de digest não permite trocar ArtifactId, task, classe ou retenção.
- `artifact.published` exige lifecycle committed, ArtifactRef íntegra e lifecycle `staged -> committed` na mesma transação do evento.
- Staged, quarantined e tombstoned nunca são servidos como evidência ou input de provider/tool/verifier.
- `created_at <= lifecycle_changed_at`; expires_at, quando presente, é posterior à criação.
- `producer_call_id` corresponde à chamada que produziu os bytes ou é null para input/config/snapshot sem call.
- D5 é rejeitado pelo schema de artifact; secret handle não é convertido em artifact.
- Metadata fingerprint usa purpose artifact-metadata sobre metadata sem o próprio fingerprint.
- Cada lifecycle row preserva o ArtifactMetadata canônico e seu fingerprint. A tabela `artifacts` é apenas projeção corrente; transição sem novo snapshot append-only é inválida.
- ArtifactLifecycle sequence 1 é `null -> staged`; depois, sequence é contínua e somente `staged -> committed|quarantined`, `committed -> quarantined|tombstoned` ou `quarantined -> tombstoned` é aceita.
- Quarentena só parte de staged/committed, bloqueia leitura na mesma transação e nunca inclui bytes/path/trecho no evento.
- Artifact quarantined/tombstoned não volta a committed. Tombstone não prova secure erase.
- Falha de redação produz `redaction.failed` apenas se bytes_persisted e bytes_sent são false. Se houve possível envio/persistência, o caso é incidente/ambiguous e não usa esse payload como alegação de contenção.
- Redaction reason e subject ref são digests/códigos; detector não persiste o trecho detectado.
- Limites de artifact precisam estar presentes e ser conferidos durante streaming; ultrapassagem não publica output truncado.

## Recovery e EffectReconciliation

- RecoveryStarted referencia baseline sequence/digest que corresponde exatamente ao último evento íntegro da task.
- Scanner profile, ordem e versões participam do report fingerprint.
- RecoveryItems são únicos por run/subject e ordenados deterministicamente; reexecução sem mudança externa não cria disposição diferente.
- `effect.reconciled` referencia Intent existente e mantém task/call exatos. Evidence é resolvível e específica da tool/target.
- Observation `ambiguous` exige disposition no_retry ou manual_required; nunca record_observation que libere nova tentativa.
- Observation no_effect só é aceita com prova forte de que a fronteira de efeito não foi cruzada; ausência de ToolResult não basta.
- RecoveryReconciliation report/ref resolve para artifact committed e íntegro; counts são recalculadas dos items.
- `remaining_ambiguities > 0` implica outcome inconclusive ou blocked e impede sucesso verificado.
- recommended_final_state é recomendação; a mudança ocorre por `task.transitioned` separada e precisa ser permitida pela máquina.
- Recovery não reabre estado terminal e não reescreve evento, intent, result, approval use, usage ou ledger.
- Cadeia divergente não recebe novo EventEnvelope; recovery fica em registro/out-of-band read-only até restauração/intervenção.
- Retry posterior cria novos IDs e refaz budget, policy e approval; reconciliation não é autorização.

## ToolDefinition e ToolRequest

- input_schema_id e output_schema_id resolvem somente no catálogo local aprovado.
- Registry rejeita definição incompleta, versão duplicada com bytes diferentes e schema futuro.
- default_policy é piso, não teto: policy pode restringir, nunca tornar a execução mais permissiva que controles obrigatórios.
- ToolRequest é validado contra o input schema da ToolDefinition e normalizado antes da policy.
- tool, versão, effect_class, task, step e principal devem corresponder ao plano e manifesto ativos.
- target e arguments não podem conter paths ambíguos, valores não redigidos ou campos não previstos pelo input schema.
- preconditions são conferidas imediatamente antes da invocação.
- idempotency_key só é aceita quando a ToolDefinition declara idempotent ou conditional e a condição foi provada.
- Declaração do modelo não altera effect_class, risco, idempotência ou precondição.
- required_capabilities vêm da ToolDefinition e são subconjunto exato dos CapabilityGrantIds válidos na ToolRequest.
- SandboxProfile fingerprint e grants participam do request_fingerprint; mudança ou revogação depois da policy bloqueia invoke.

## SandboxProfile e CapabilityGrant

- Profile pertence à task/Manifest e os controles declarados correspondem ao host probe; campo unknown/unsupported/not_enforced não satisfaz capability que exige enforcement.
- hostile_input_allowed só é válido em virtualized, com todos os controles enforced e evidence artifact committed/íntegro.
- logical_readonly não executa process, write, git mutation, network, secret ou external mutation.
- controlled_host não é sandbox forte e não aceita fixture marcada hostile.
- Grant pertence à mesma task/principal/profile, possui `valid_from < expires_at` e policy decision allow/approval_required satisfeita.
- Kind e resource_type precisam corresponder: filesystem→workspace_path, process→executable, network→network_destination, secret→secret_handle, git→git_repository, external→external_resource.
- resource é normalizado pelo adapter do kind antes do fingerprint; não é concatenado em path/comando/URL.
- Permissions e constraints são allowlist fechada por capability/version. Campo desconhecido nega.
- max_uses null só é aceito para grants de sessão explicitamente permitidas; grants de efeito mutável têm limite explícito conforme policy.
- Revocation impede nova ToolRequest/EffectIntent/invoke. Efeito em voo permanece no journal e pode ficar ambiguous.
- Approval nunca cria/amplia capability; capability nunca substitui policy/approval.
- Grant secret_use carrega handle opaco. Material D5 no resource/constraints bloqueia e aciona incidente.

## Fingerprint da request

request_fingerprint é calculado sobre ToolRequest inteiro, validado e normalizado, com purpose tool-request. Ele vincula:

- task, step, principal e call;
- tool e versão;
- effect_class;
- argumentos e alvo;
- precondições;
- idempotency key.

Nova tentativa possui novo call_id. Reuso de request_fingerprint não implica autorização para repetir.

## PolicyDecision

- A decisão é calculada para o request_fingerprint exato e a policy efetiva.
- Erro, timeout, policy desconhecida, campo desconhecido ou dependência indisponível produz deny.
- approval_requirements é objeto somente para approval_required e null nos demais casos.
- allow não dispensa intent, evento ou verificação.
- reason e reason_code são redigidos antes de persistir.
- A mesma entrada e policy versionadas devem produzir a mesma decisão.

## ApprovalGrant e ApprovalUse

- ApprovalGrant só nasce do `policy_decision_id` approval_required exato para a mesma task, call, principal, request e policy.
- granted_at é anterior a expires_at.
- O principal que concede deve ser autenticado e autorizado; a concessão não pode ser emitida pelo modelo.
- request_fingerprint já vincula ação, parâmetros, alvo e precondições; tool é repetida para revisão humana.
- Nomes de limite são únicos e os limites são aplicados antes da invocação.
- max_uses é exatamente um no P0.
- nonce é único e imprevisível.
- O relógio atual deve estar dentro da validade no instante do consumo.
- ApprovalUse, EffectIntent prepared e evento correspondente repetem exatamente task/call/principal/request da grant e são gravados na mesma transação.
- Unicidade em approval_id e nonce impede segundo consumo.
- Rejeição, expiração, request alterada, policy alterada ou emergency stop impedem consumo.
- Revogação não desfaz efeito já iniciado; ele continua no journal até resultado conhecido ou inconclusivo.

## EffectIntent

- Existe PolicyDecision anterior para o mesmo task_id, call_id, principal_id e request_fingerprint.
- Para allow, approval_id é null.
- Para approval_required, approval_id não é null e possui ApprovalUse na mesma transação.
- Para deny, nenhum EffectIntent é criado.
- precondition_snapshot_digest é recalculado na preparação.
- Intent prepared é persistida antes da invocação, inclusive para operação pura ou read-only.
- Intent prepared sem ToolResult após reinício é suspeita; não autoriza retry automático.
- sandbox_profile_fingerprint e CapabilityGrantIds são iguais à ToolRequest fingerprintada; todas continuam válidas imediatamente antes do invoke.

## ToolResult

- task_id, step_id e call_id correspondem à EffectIntent.
- started_at não sucede finished_at.
- duration_ms vem do relógio monotônico e não é recalculada pela diferença do relógio UTC.
- result_digest usa purpose tool-result sobre o objeto sem result_digest.
- output, stdout e stderr são redigidos e limitados antes da persistência.
- Referência de artefato é conferida por tamanho e digest antes de servir como evidência.
- pure e read_only usam effect_status not_applicable, salvo descoberta de efeito não declarado, que bloqueia a tool.
- Efeito confirmado usa observed_success ou observed_failure.
- Timeout, crash ou resposta perdida depois de possível efeito usa ambiguous até reconciliação.
- ambiguous impede sucesso verificado e retry automático.
- exit_code isolado não prova efeito nem critério.

## VerificationResult

- criterion_id existe no manifesto e method/verifier/version correspondem ao critério.
- Toda verificação contém pelo menos uma evidência resolvível.
- pass exige que todas as evidências obrigatórias sejam íntegras e atuais.
- Resposta textual do modelo não substitui comando, artefato ou estado externo exigido.
- independent_from_executor false é permitido, mas aparece no relatório e não pode ser ocultado.
- sucesso_verificado requer pass em todo critério obrigatório e ausência de efeito ou resíduo desconhecido.

## EventEnvelope

- event_id é único globalmente.
- sequence é único por task, começa em um e cresce sem lacunas.
- Insert defensivo no SQLite exige sequence exatamente `max + 1`, previous digest do evento imediatamente anterior, correlation da TaskRun e causation na mesma task/passado.
- No sequence um, previous_event_digest é null; nos demais, é o event_digest anterior da tarefa.
- task, project, principal e correlation permanecem coerentes com a tarefa.
- step_id é null somente para evento sem passo aplicável.
- causation_event_id não aponta para o próprio evento e, quando presente, já existe.
- payload valida no payload_contract indicado.
- payload_digest é recalculado com purpose payload.
- event_digest é recalculado com purpose event e o próprio campo omitido.
- Append de evento e atualização de projeção ocorrem na mesma transação.
- Evento aceito não sofre update/delete pela API comum; correção cria evento novo.
- O par event_type e payload_contract corresponde exatamente ao event-registry versionado.
- Somente task.created e task.transitioned do registry rc.7 alteram a projeção de estado.
- `payload_constraints` do registry é aplicado depois do JSON Schema, com igualdade estrita no campo raiz; ausência, tipo ou valor divergente falham fechado.
- `provider.completed` só aceita ProviderOutcome completed; `provider.failed` aceita failed, cancelled, timed_out ou ambiguous.
- Para cada ProviderRequest persistida existe no máximo um evento terminal. Terminal ausente após recovery permanece suspeito, não é completado por inferência.
- Evento `context.package_built` não torna o package válido se artifact, source version, scope ou validade falharem na leitura.
- `artifact.published` exige ArtifactMetadata committed; `artifact.quarantined` bloqueia a mesma ArtifactId; `redaction.failed` não pode encobrir possível exposição.
- `recovery.started` só entra em cadeia íntegra; `recovery.reconciled` não altera estado por si só.

## UsageRecord e orçamento

- reported usa source provider; estimated usa local_estimator; unknown usa none e value null.
- Estimativa nunca substitui nem sobrescreve uso reportado.
- Unidade currency_minor exige currency ISO 4217 em três letras maiúsculas; outras unidades usam null.
- Registros de unidades diferentes não são somados sem conversão explicitamente versionada.
- confirmed, reserved e possible_overage permanecem campos conceitualmente separados.
- Ao atingir accounted maior ou igual ao hard limit, nenhuma nova operação cobrável inicia.
- Uso em voo ou atrasado pode virar possible_overage e deve permanecer visível.

## PriceBook, BudgetSet, Reservation e ledger

- PriceBook é task/provider/model/região específico, não expirado e sua source/vigência/fingerprint são verificáveis.
- Entry usa razão exata price_minor/unit_quantity; floats, denominador zero e overflow falham.
- Entries duplicadas para o mesmo meter/condições são rejeitadas ou desambiguadas por regra versionada; seleção implícita é proibida.
- BudgetSet pertence à task do Manifest, tem pares unit/currency únicos e action stop_new_billable.
- Cada unidade aplicável é comparada separadamente contra confirmed + active reserved + nova reserva. Igual ao limite já bloqueia início.
- A leitura de confirmed/active reserved e a gravação da nova reserva ocorrem no mesmo `BEGIN IMMEDIATE`; snapshot lido antes da transação não autoriza I/O.
- Reservation possui uma linha única por unit/currency, CallId único e timestamps `created_at <= changed_at <= expires_at` enquanto active.
- Lifecycle parte de active uma única vez; linhas não mudam e status terminal não volta a active. Cada estado completo recebe novo `reservation_fingerprint` e snapshot no journal append-only; a projeção corrente só aponta para ele na mesma transação.
- BudgetReservationLifecycle sequence 1 é `null -> active`; sequence 2 é a única transição e parte de active para um dos quatro estados terminais.
- Reservation/ledger/evento são atômicos e precedem I/O cobrável.
- Ledger sequence começa em 1 por BudgetSet, é contígua e append-only. EventId e EntryFingerprint são únicos.
- Ledger insert exige evento da mesma task do BudgetSet e reservation/usage, quando presentes, do mesmo escopo.
- Confirmed referencia UsageId reportado quando aplicável. Estimated não vira confirmed por update.
- Timeout/ambiguous preserva possible_overage; liberação como zero exige prova not_sent/no charge.
- Moedas não são convertidas no P0. Preço zero não elimina quotas em outras unidades.

## Regras transacionais mínimas

| Operação | Fatos atômicos |
|---|---|
| criar tarefa | TaskManifest, TaskRun, SandboxProfile, BudgetSet/limits, task.created e projeção |
| decidir policy | request fingerprint, decisão e evento |
| preparar efeito aprovado | ApprovalUse, EffectIntent prepared e evento |
| observar tool | ToolResult, journal, usage aplicável e evento |
| verificar | VerificationResult, evidências e evento |
| finalizar | estado final e evento depois de todos os guards |

Nenhuma transação SQLite torna o efeito externo atômico. O journal registra incerteza em vez de prometer exatamente uma vez.
