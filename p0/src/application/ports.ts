/**
 * Application ports for P0 v1
 * Based on docs/implementation/contracts/ports_v1.md
 * Frozen documental v1 per ADR-006
 */

import type { Result } from "./result.ts";
import type { PortError } from "./port-error.ts";

// ============================================================================
// Common types
// ============================================================================

/**
 * Entity identifier kinds for P0
 * Based on ADR-003 and ADR-007
 */
export type EntityIdKind =
  | "project"
  | "workspace"
  | "principal"
  | "task"
  | "manifest"
  | "plan"
  | "step"
  | "event"
  | "correlation"
  | "call"
  | "policy_decision"
  | "approval"
  | "approval_use"
  | "effect_intent"
  | "verification"
  | "usage"
  | "criterion"
  | "attempt"
  | "provider_request"
  | "context_query"
  | "context_item"
  | "context_package"
  | "artifact"
  | "budget_set"
  | "budget_reservation"
  | "price_book"
  | "capability_grant"
  | "recovery_run";

// ============================================================================
// ClockPort and IdGeneratorPort
// ============================================================================

export interface ClockPort {
  /**
   * Returns current UTC time in canonical form per ADR-003
   */
  nowUtc(): string;

  /**
   * Returns current monotonic time in milliseconds
   * Non-decreasing within the process, used for duration/deadline
   */
  nowMonotonicMs(): number;
}

export interface IdGeneratorPort {
  /**
   * Generate next ID of the given kind
   */
  next(kind: EntityIdKind): Result<string, PortError>;
}

// ============================================================================
// ProviderPort
// ============================================================================

export type ProviderFeature = "supported" | "unsupported" | "unknown";

export type ProviderSignal =
  | Readonly<{ kind: "output_delta"; sequence: number; text: string }>
  | Readonly<{
      kind: "tool_proposal";
      sequence: number;
      proposal: unknown;
    }>
  | Readonly<{
      kind: "usage_observation";
      sequence: number;
      observation: unknown;
    }>
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
    target: Readonly<{
      provider_id: string;
      endpoint_profile: string;
      model_id: string;
    }>,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>>;

  generate(
    request: unknown,
    sink: ProviderSignalSink,
    signal: AbortSignal
  ): Promise<ProviderTerminal>;
}

// ============================================================================
// ToolCatalogPort
// ============================================================================

export interface ToolCatalogPort {
  resolveExact(
    tool_id: string,
    tool_version: string
  ): Result<unknown, PortError>;

  listAllowed(
    allowed: ReadonlyArray<
      Readonly<{ tool_id: string; tool_version: string }>
    >
  ): Result<ReadonlyArray<unknown>, PortError>;

  fingerprint(): Result<string, PortError>;
}

// ============================================================================
// PolicyPort
// ============================================================================

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

// ============================================================================
// GovernanceBundlePort
// ============================================================================

export interface GovernanceBundlePort {
  resolveApprovedExact(
    reference: Readonly<{
      bundle_id: string;
      bundle_fingerprint: string;
      at_utc: string;
    }>
  ): Result<unknown, PortError>;
}

// ============================================================================
// ToolPort
// ============================================================================

export type ToolSignal =
  | Readonly<{ kind: "stdout"; sequence: number; bytes: Uint8Array }>
  | Readonly<{ kind: "stderr"; sequence: number; bytes: Uint8Array }>
  | Readonly<{
      kind: "progress";
      sequence: number;
      value: number;
      unit: string;
    }>;

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

// ============================================================================
// CatalogPort
// ============================================================================

export interface CatalogTransaction {
  readBudgetAccounting(
    budget_set_id: string
  ): Result<
    Readonly<{
      budget_set_id: string;
      budget_fingerprint: string;
      last_ledger_sequence: number;
      lines: ReadonlyArray<
        Readonly<{
          unit: string;
          currency: string | null;
          hard_limit: number;
          confirmed: number;
          active_reserved: number;
          possible_overage: number;
        }>
      >;
    }>,
    PortError
  >;

  appendEvent(event: unknown): Result<void, PortError>;
  insertTaskRecord(manifest: unknown, task: unknown): Result<void, PortError>;
  insertPlanRecord(
    plan: unknown,
    steps: ReadonlyArray<unknown>
  ): Result<void, PortError>;
  insertContextQuery(query: unknown): Result<void, PortError>;
  insertContextItems(items: ReadonlyArray<unknown>): Result<void, PortError>;
  insertContextPackage(context_package: unknown): Result<void, PortError>;
  insertProviderCapabilitySnapshot(
    snapshot: unknown
  ): Result<void, PortError>;
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
  insertArtifactStaged(
    metadata: unknown,
    lifecycle: unknown
  ): Result<void, PortError>;
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
  readProviderRequest(
    provider_request_id: string
  ): Result<unknown | null, PortError>;
  readProviderOutcome(
    provider_request_id: string
  ): Result<unknown | null, PortError>;
  readApprovalState(approval_id: string): Result<unknown | null, PortError>;
  readEffectIntent(effect_intent_id: string): Result<unknown | null, PortError>;
  readToolResult(call_id: string): Result<unknown | null, PortError>;
  listPreparedEffects(task_id: string): Result<ReadonlyArray<unknown>, PortError>;
  readActiveBudget(task_id: string): Result<unknown | null, PortError>;
  readBudgetReservation(
    budget_reservation_id: string
  ): Result<unknown | null, PortError>;
  readBudgetLedger(budget_set_id: string): Result<ReadonlyArray<unknown>, PortError>;
  readValidCapabilityGrants(
    task_id: string
  ): Result<ReadonlyArray<unknown>, PortError>;
  readArtifactMetadata(artifact_id: string): Result<unknown | null, PortError>;
  readRecoveryReport(recovery_run_id: string): Result<unknown | null, PortError>;
}

// ============================================================================
// ArtifactStorePort
// ============================================================================

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
  quarantine(
    reference: unknown,
    reason_code: string
  ): Promise<Result<unknown, PortError>>;
  read(reference: unknown): Promise<Result<Uint8Array, PortError>>;
  verify(reference: unknown): Promise<Result<void, PortError>>;
}

// ============================================================================
// VerifierPort
// ============================================================================

export interface VerifierPort {
  verify(
    criterion: unknown,
    evidence: ReadonlyArray<unknown>,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>>;
}
