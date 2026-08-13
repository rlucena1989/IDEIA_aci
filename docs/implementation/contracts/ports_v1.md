# Portas de aplicação P0 v1

**Estado:** freeze documental v1 conforme ADR-006  
**Escopo:** semântica de aplicação; JSON persistido continua regido pelos schemas v1

## Convenções comuns

~~~ts
export type Result<T, E> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: E }>;

export type PortError = Readonly<{
  code: string;
  retry: "never" | "safe" | "ambiguous" | "manual";
  redacted_message: string;
  cause_ref: string | null;
}>;
~~~

- `code` é estável, documentado e não contém dados de entrada.
- `redacted_message` já está apta a log; stack, prompt, segredo e output bruto não entram nela.
- `cause_ref` referencia evidência local redigida ou é `null`; nunca contém o erro bruto.
- Toda coleção retornada é `readonly`; adapters e fakes fazem cópia defensiva.
- Ausência de capacidade, registro, fixture ou versão falha explicitamente. Não há fallback para `latest`, tool semelhante, provider alternativo ou caminho permissivo.
- `AbortSignal` solicita cancelamento; não prova que processamento remoto ou efeito externo parou.

## ClockPort e IdGeneratorPort

~~~ts
export interface ClockPort {
  nowUtc(): string;
  nowMonotonicMs(): number;
}

export type EntityIdKind =
  | "project" | "workspace" | "principal" | "task" | "manifest"
  | "plan" | "step" | "event" | "correlation" | "call"
  | "policy_decision" | "approval" | "approval_use"
  | "effect_intent" | "verification" | "usage" | "criterion"
  | "attempt" | "provider_request" | "context_query" | "context_item"
  | "context_package" | "artifact" | "budget_set" | "budget_reservation"
  | "price_book" | "capability_grant" | "recovery_run";

export interface IdGeneratorPort {
  next(kind: EntityIdKind): Result<string, PortError>;
}
~~~

`nowUtc` produz a forma canônica da ADR-003. `nowMonotonicMs` é não decrescente dentro do processo e serve para duração/deadline, não auditoria. O gerador não é relógio nem fonte de ordem.

## ProviderPort

~~~ts
export type ProviderFeature = "supported" | "unsupported" | "unknown";

export type ProviderSignal =
  | Readonly<{ kind: "output_delta"; sequence: number; text: string }>
  | Readonly<{ kind: "tool_proposal"; sequence: number; proposal: unknown }>
  | Readonly<{ kind: "usage_observation"; sequence: number; observation: unknown }>
  | Readonly<{ kind: "diagnostic"; sequence: number; code: string }>;

export interface ProviderSignalSink {
  accept(signal: ProviderSignal): Result<void, PortError>;
}

export type ProviderTerminal = Readonly<{
  status: "completed" | "failed" | "cancelled" | "timed_out" | "ambiguous";
  finish_reason: string | null;
  output: unknown | null;
  provider_response_id: string | null;
  error: PortError | null;
}>;

export interface ProviderPort {
  probe(
    target: Readonly<{ provider_id: string; endpoint_profile: string; model_id: string }>,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>>;

  generate(
    request: unknown,
    sink: ProviderSignalSink,
    signal: AbortSignal
  ): Promise<ProviderTerminal>;
}
~~~

Regras:

- `request` valida como `ideia.provider-request/1` antes da chamada;
- instruction/context refs são materializadas por um resolver read-only injetado na construção do adapter; ele só recebe os ArtifactIds já autorizados na request e não faz busca livre no store;
- sinais possuem sequence iniciada em zero, contígua e única por call;
- sinais são não confiáveis, limitados e redigidos antes de persistir;
- tool proposal nunca chama ToolPort por efeito colateral;
- `generate` retorna exatamente um terminal mesmo quando o sink rejeita um sinal;
- status `completed` não implica parse válido, critério atendido ou sucesso da tarefa;
- timeout/cancelamento depois de possível processamento remoto pode ser `ambiguous`;
- adapter não faz retry interno; coordinator aplica política explícita a uma nova `call_id`.

## ToolCatalogPort

~~~ts
export interface ToolCatalogPort {
  resolveExact(
    tool_id: string,
    tool_version: string
  ): Result<unknown, PortError>;

  listAllowed(
    allowed: ReadonlyArray<Readonly<{ tool_id: string; tool_version: string }>>
  ): Result<ReadonlyArray<unknown>, PortError>;

  fingerprint(): Result<string, PortError>;
}
~~~

`resolveExact` não negocia versão. A definição retornada valida como `ideia.tool-definition/1`. `listAllowed` preserva a ordem da lista solicitada e falha se qualquer item estiver ausente ou duplicado com bytes divergentes.

## PolicyPort

~~~ts
export interface PolicyPort {
  decide(
    request: unknown,
    context: Readonly<{
      request_fingerprint: string;
      policy_fingerprint: string;
      governance_bundle_fingerprint: string;
    }>
  ): Result<unknown, PortError>;
}
~~~

Entrada valida como ToolRequest e saída como PolicyDecision. Erro, timeout lógico, enum desconhecido ou dependência ausente produz erro convertido pelo coordinator em `deny`; a porta não inventa aprovação.

## GovernanceBundlePort

~~~ts
export interface GovernanceBundlePort {
  resolveApprovedExact(
    reference: Readonly<{
      bundle_id: string;
      bundle_fingerprint: string;
      at_utc: string;
    }>
  ): Result<unknown, PortError>;
}
~~~

A porta consulta apenas um snapshot imutável carregado e validado antes de o processo aceitar tasks. Ela não lê arquivos durante a admissão, não promove bundles e não oferece `latest`. O retorno só é `ok` quando bundle, candidato, EvaluationReport, MeasurementProfile e results artifact satisfazem o [protocolo de admissão](../governance/admission_v1.md); qualquer referência ausente, expirada, divergente ou não aprovada falha fechado.

## ToolPort

~~~ts
export type ToolSignal =
  | Readonly<{ kind: "stdout"; sequence: number; bytes: Uint8Array }>
  | Readonly<{ kind: "stderr"; sequence: number; bytes: Uint8Array }>
  | Readonly<{ kind: "progress"; sequence: number; value: number; unit: string }>;

export interface ToolSignalSink {
  accept(signal: ToolSignal): Result<void, PortError>;
}

export interface ToolPort {
  invoke(
    intent: unknown,
    sink: ToolSignalSink,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>>;

  reconcile(
    prepared_intent: unknown,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>>;
}
~~~

`intent` valida como EffectIntent, já persistida. O adapter revalida target, precondições, escopo e perfil de sandbox imediatamente antes do efeito. Saída de `invoke` valida como ToolResult. Erro de transporte depois de possível efeito é `retry: "ambiguous"`. `reconcile` observa; não repete a operação.

## CatalogPort

~~~ts
export interface CatalogTransaction {
  readBudgetAccounting(budget_set_id: string): Result<Readonly<{
    budget_set_id: string;
    budget_fingerprint: string;
    last_ledger_sequence: number;
    lines: ReadonlyArray<Readonly<{
      unit: string;
      currency: string | null;
      hard_limit: number;
      confirmed: number;
      active_reserved: number;
      possible_overage: number;
    }>>;
  }>, PortError>;
  appendEvent(event: unknown): Result<void, PortError>;
  insertTaskRecord(manifest: unknown, task: unknown): Result<void, PortError>;
  insertPlanRecord(plan: unknown, steps: ReadonlyArray<unknown>): Result<void, PortError>;
  insertContextQuery(query: unknown): Result<void, PortError>;
  insertContextItems(items: ReadonlyArray<unknown>): Result<void, PortError>;
  insertContextPackage(context_package: unknown): Result<void, PortError>;
  insertProviderCapabilitySnapshot(snapshot: unknown): Result<void, PortError>;
  insertProviderRequest(request: unknown): Result<void, PortError>;
  insertProviderOutcome(outcome: unknown): Result<void, PortError>;
  insertPolicyDecision(decision: unknown): Result<void, PortError>;
  insertSandboxProfile(profile: unknown): Result<void, PortError>;
  insertCapabilityGrant(grant: unknown): Result<void, PortError>;
  insertCapabilityRevocation(revocation: unknown): Result<void, PortError>;
  insertApprovalGrant(grant: unknown): Result<void, PortError>;
  consumeApproval(
    use: unknown,
    intent: unknown,
    event: unknown
  ): Result<void, PortError>;
  insertEffectIntent(intent: unknown): Result<void, PortError>;
  insertToolResult(result: unknown): Result<void, PortError>;
  insertVerification(result: unknown): Result<void, PortError>;
  insertUsage(record: unknown): Result<void, PortError>;
  insertPriceBook(price_book: unknown): Result<void, PortError>;
  insertBudgetSet(budget_set: unknown): Result<void, PortError>;
  changeBudgetReservation(
    reservation: unknown,
    lifecycle: unknown,
    ledger_entries: ReadonlyArray<unknown>,
    events: ReadonlyArray<unknown>
  ): Result<void, PortError>;
  insertArtifactStaged(metadata: unknown, lifecycle: unknown): Result<void, PortError>;
  publishArtifact(
    metadata: unknown,
    lifecycle: unknown,
    event: unknown
  ): Result<void, PortError>;
  quarantineArtifact(
    quarantine: unknown,
    lifecycle: unknown,
    event: unknown
  ): Result<void, PortError>;
  insertRecoveryRun(run: unknown): Result<void, PortError>;
  insertEffectReconciliation(reconciliation: unknown): Result<void, PortError>;
  insertRecoveryItems(items: ReadonlyArray<unknown>): Result<void, PortError>;
  insertRecoveryReport(report: unknown): Result<void, PortError>;
  compareAndSetTaskProjection(
    expected_last_sequence: number,
    next_projection: unknown
  ): Result<void, PortError>;
}

export interface CatalogPort {
  transact<T>(
    operation: (transaction: CatalogTransaction) => Result<T, PortError>
  ): Result<T, PortError>;

  readTaskEvents(task_id: string): Result<ReadonlyArray<unknown>, PortError>;
  readTaskRecord(task_id: string): Result<unknown | null, PortError>;
  readTaskManifest(manifest_id: string): Result<unknown | null, PortError>;
  readTaskProjection(task_id: string): Result<unknown | null, PortError>;
  readPlanRecord(plan_id: string, revision: number): Result<unknown | null, PortError>;
  readContextPackage(context_package_id: string): Result<unknown | null, PortError>;
  readProviderRequest(provider_request_id: string): Result<unknown | null, PortError>;
  readProviderOutcome(provider_request_id: string): Result<unknown | null, PortError>;
  readApprovalState(approval_id: string): Result<unknown | null, PortError>;
  readEffectIntent(effect_intent_id: string): Result<unknown | null, PortError>;
  readToolResult(call_id: string): Result<unknown | null, PortError>;
  listPreparedEffects(task_id: string): Result<ReadonlyArray<unknown>, PortError>;
  readActiveBudget(task_id: string): Result<unknown | null, PortError>;
  readBudgetReservation(budget_reservation_id: string): Result<unknown | null, PortError>;
  readBudgetLedger(budget_set_id: string): Result<ReadonlyArray<unknown>, PortError>;
  readValidCapabilityGrants(task_id: string): Result<ReadonlyArray<unknown>, PortError>;
  readArtifactMetadata(artifact_id: string): Result<unknown | null, PortError>;
  readRecoveryReport(recovery_run_id: string): Result<unknown | null, PortError>;
}
~~~

O callback de `transact` é síncrono e não pode retornar Promise. Throw, retorno `ok: false` ou violação de constraint faz rollback integral. Append de evento e compare-and-set da projeção pertencem à mesma transação. Nenhum método oferece update/delete de evento aceito.

`readBudgetAccounting` existe dentro da transação deliberadamente: o budget service calcula `confirmed + active_reserved + nova_reserva` sobre esse snapshot e grava reservation/lifecycle/ledger/evento antes do commit. Leitura feita antes de `BEGIN IMMEDIATE` não autoriza reserva. Os números continuam inteiros seguros no contrato da porta e são convertidos a BigInt antes de qualquer soma.

As consultas externas são exatas e read-only. Nenhuma aceita kind, nome de tabela, predicado, coluna, SQL ou `latest` fornecido pelo chamador. Objetos persistidos retornam por cópia e passam novamente pelo validator/fingerprint; divergência é erro de integridade, não `null`.

`consumeApproval` é uma operação composta deliberada: grava ApprovalUse, EffectIntent e evento no mesmo commit, com unicidade de `approval_id` e `nonce`. Não deve ser desmembrada por adapters.

`insertTaskRecord` preserva o TaskManifest canônico antes do TaskRun que o referencia; manifest, run, BudgetSet inicial e `task.created` pertencem à mesma transação de criação. `insertPlanRecord` grava record e PlanSteps na mesma transação depois de conferir o artifact. `insertContextItems` antecede o package e preserva os objetos completos. `insertProviderCapabilitySnapshot` precisa ocorrer antes da ProviderRequest que o referencia. `insertEffectReconciliation` aceita no máximo um fato por EffectIntentId; evidência posterior contraditória usa correção/incidente, não update.

`insertArtifactStaged`, `changeBudgetReservation`, `publishArtifact` e `quarantineArtifact` também são operações compostas. Toda criação/transição de artifact ou reservation acrescenta snapshot canônico ao journal de lifecycle; a projeção corrente só muda se o novo journal row já existir na mesma transação. O fake pode implementá-las em memória, mas precisa demonstrar rollback integral quando qualquer fato falha. A enumeração de métodos não autoriza gravação genérica: cada objeto passa pelo validator e pelas invariantes de sua operação.

## ArtifactStorePort

~~~ts
export interface ArtifactStorePort {
  stage(
    bytes: Uint8Array,
    metadata: unknown,
    limits: Readonly<{
      max_single_artifact_bytes: number;
      remaining_task_artifact_bytes: number;
      max_staging_bytes: number;
      max_open_artifacts: number;
      deadline_monotonic_ms: number;
    }>
  ): Promise<Result<unknown, PortError>>;

  commit(staged: unknown): Promise<Result<unknown, PortError>>;
  quarantine(reference: unknown, reason_code: string): Promise<Result<unknown, PortError>>;
  read(reference: unknown): Promise<Result<Uint8Array, PortError>>;
  verify(reference: unknown): Promise<Result<void, PortError>>;
}
~~~

`stage` limita bytes e calcula digest sobre cópia local. `commit` revalida tamanho/digest e promove por operação atômica no mesmo volume. `read` nunca serve item staged, quarantined ou ausente. Lifecycle, metadata e recuperação são detalhados no contrato de artifacts; até esse freeze, WP-13 permanece condicionado.

## VerifierPort

~~~ts
export interface VerifierPort {
  verify(
    criterion: unknown,
    evidence: ReadonlyArray<unknown>,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>>;
}
~~~

Saída valida como VerificationResult. Exceção, timeout, evidência ausente ou versão desconhecida não vira `pass`. O verificador não lê estado fora das referências autorizadas.

## Ordem obrigatória de uma proposta de tool

~~~text
ProviderSignal(tool_proposal)
  -> limite/parse
  -> ToolCatalogPort.resolveExact
  -> schema + manifesto + plano + SandboxProfile + CapabilityGrants
  -> ToolRequest normalizada
  -> request_fingerprint
  -> PolicyPort.decide
  -> aprovação, se exigida
  -> CatalogPort: EffectIntent prepared (+ ApprovalUse quando aplicável)
  -> ToolPort.invoke
  -> CatalogPort: ToolResult/evento
  -> VerifierPort
~~~

Qualquer falha interrompe a sequência no ponto correspondente. Não existe salto direto de provider para tool.

## Contract tests mínimos compartilhados

| ID | Propriedade |
|---|---|
| PORT-01 | fixture ausente falha fechado |
| PORT-02 | entrada e retorno não compartilham referência mutável |
| PORT-03 | ordem FIFO e sequence contígua |
| PORT-04 | abort antes da chamada não inicia I/O |
| PORT-05 | abort durante chamada retorna terminal conhecido ou ambíguo |
| PORT-06 | tool proposal não produz invocação implícita |
| PORT-07 | versão exata ausente não cai em latest |
| PORT-08 | erro de policy não vira allow |
| PORT-09 | transação falha faz rollback de todos os fatos |
| PORT-10 | segundo consumo de approval/nonce falha |
| PORT-11 | artifact com digest divergente não é servido |
| PORT-12 | erro do verifier nunca vira pass |
| PORT-13 | erro redigido não contém input, prompt, output ou secret |
| PORT-14 | fake não consulta I/O, tempo ou aleatoriedade implícita |
| PORT-15 | governance resolve somente id + fingerprint exatos e bundle aprovado/vigente |
| PORT-16 | bundle/report/MP/artifact divergente ou ausente bloqueia admissão |
| PORT-17 | duas reservas concorrentes não usam o mesmo snapshot contábil para ultrapassar limite |
| PORT-18 | consulta exata revalida JSON/fingerprint e não oferece SQL/kind/latest genérico |
