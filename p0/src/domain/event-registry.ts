/**
 * Static v1 event registry (WP-08).
 *
 * Mirrors docs/implementation/contracts/event-registry-v1.json exactly
 * (registry_version 1.0.0-rc.7): 33 events with event_type, payload_contract,
 * schema_id, affects_task_state and payload_constraints (only where the
 * normative file declares them). Lookup is closed: an unknown event type
 * throws UnknownEventTypeError instead of being ignored.
 */

export interface EventRegistryEntry {
  readonly event_type: string;
  readonly payload_contract: string;
  readonly schema_id: string;
  readonly affects_task_state: boolean;
  readonly payload_constraints?: Readonly<Record<string, readonly string[]>>;
}

/**
 * Union of the 33 event types registered in rc.7.
 */
export type EventType =
  | "task.created"
  | "task.transitioned"
  | "task.cancellation_requested"
  | "policy.decided"
  | "approval.granted"
  | "approval.consumed"
  | "approval.revoked"
  | "effect.prepared"
  | "tool.resulted"
  | "verification.recorded"
  | "usage.recorded"
  | "context.query_recorded"
  | "context.package_built"
  | "context.stale_detected"
  | "provider.capabilities_recorded"
  | "provider.requested"
  | "provider.completed"
  | "provider.failed"
  | "plan.recorded"
  | "artifact.published"
  | "artifact.quarantined"
  | "redaction.failed"
  | "recovery.started"
  | "effect.reconciled"
  | "recovery.reconciled"
  | "price_book.recorded"
  | "budget.configured"
  | "budget.reservation_changed"
  | "budget.ledger_recorded"
  | "sandbox.profile_selected"
  | "capability.granted"
  | "capability.revoked"
  | "event.corrected";

/**
 * Error for an event type not present in the registry.
 */
export class UnknownEventTypeError extends Error {
  readonly code = "event.unknown";
  readonly eventType: string;

  constructor(eventType: string) {
    super(`Unknown event type: ${eventType}`);
    this.name = "UnknownEventTypeError";
    this.eventType = eventType;
  }
}

/**
 * The 33 registry entries, in the same order as the normative JSON.
 */
export const EVENT_REGISTRY_V1: readonly EventRegistryEntry[] = [
  {
    event_type: "task.created",
    payload_contract: "ideia.task-created/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/task-created.schema.json",
    affects_task_state: true,
  },
  {
    event_type: "task.transitioned",
    payload_contract: "ideia.task-transitioned/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/task-transitioned.schema.json",
    affects_task_state: true,
  },
  {
    event_type: "task.cancellation_requested",
    payload_contract: "ideia.cancellation-request/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/cancellation-request.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "policy.decided",
    payload_contract: "ideia.policy-decision/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/policy-decision.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "approval.granted",
    payload_contract: "ideia.approval-grant/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/approval-grant.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "approval.consumed",
    payload_contract: "ideia.approval-use/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/approval-use.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "approval.revoked",
    payload_contract: "ideia.approval-revocation/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/approval-revocation.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "effect.prepared",
    payload_contract: "ideia.effect-intent/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/effect-intent.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "tool.resulted",
    payload_contract: "ideia.tool-result/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/tool-result.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "verification.recorded",
    payload_contract: "ideia.verification-result/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/verification-result.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "usage.recorded",
    payload_contract: "ideia.usage-record/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/usage-record.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "context.query_recorded",
    payload_contract: "ideia.context-query/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/context-query.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "context.package_built",
    payload_contract: "ideia.context-package/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/context-package.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "context.stale_detected",
    payload_contract: "ideia.context-stale/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/context-stale.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "provider.capabilities_recorded",
    payload_contract: "ideia.provider-capabilities-snapshot/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/provider-capabilities-snapshot.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "provider.requested",
    payload_contract: "ideia.provider-request/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/provider-request.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "provider.completed",
    payload_contract: "ideia.provider-outcome/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/provider-outcome.schema.json",
    payload_constraints: {
      execution_status: ["completed"],
    },
    affects_task_state: false,
  },
  {
    event_type: "provider.failed",
    payload_contract: "ideia.provider-outcome/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/provider-outcome.schema.json",
    payload_constraints: {
      execution_status: ["failed", "cancelled", "timed_out", "ambiguous"],
    },
    affects_task_state: false,
  },
  {
    event_type: "plan.recorded",
    payload_contract: "ideia.plan-record/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/plan-record.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "artifact.published",
    payload_contract: "ideia.artifact-metadata/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/artifact-metadata.schema.json",
    payload_constraints: {
      lifecycle: ["committed"],
    },
    affects_task_state: false,
  },
  {
    event_type: "artifact.quarantined",
    payload_contract: "ideia.artifact-quarantine/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/artifact-quarantine.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "redaction.failed",
    payload_contract: "ideia.redaction-failure/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/redaction-failure.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "recovery.started",
    payload_contract: "ideia.recovery-started/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/recovery-started.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "effect.reconciled",
    payload_contract: "ideia.effect-reconciliation/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/effect-reconciliation.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "recovery.reconciled",
    payload_contract: "ideia.recovery-reconciliation/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/recovery-reconciliation.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "price_book.recorded",
    payload_contract: "ideia.price-book/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/price-book.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "budget.configured",
    payload_contract: "ideia.budget-set/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/budget-set.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "budget.reservation_changed",
    payload_contract: "ideia.budget-reservation/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/budget-reservation.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "budget.ledger_recorded",
    payload_contract: "ideia.budget-ledger-entry/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/budget-ledger-entry.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "sandbox.profile_selected",
    payload_contract: "ideia.sandbox-profile/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/sandbox-profile.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "capability.granted",
    payload_contract: "ideia.capability-grant/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/capability-grant.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "capability.revoked",
    payload_contract: "ideia.capability-revocation/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/capability-revocation.schema.json",
    affects_task_state: false,
  },
  {
    event_type: "event.corrected",
    payload_contract: "ideia.event-correction/1",
    schema_id: "https://schemas.ideia.invalid/p0/v1/event-correction.schema.json",
    affects_task_state: false,
  },
];

const REGISTRY_BY_TYPE: ReadonlyMap<string, EventRegistryEntry> = new Map(
  EVENT_REGISTRY_V1.map((entry) => [entry.event_type, entry])
);

/**
 * Closed lookup: throws UnknownEventTypeError for types outside the registry.
 */
export function getRegistryEntry(eventType: string): EventRegistryEntry {
  const entry = REGISTRY_BY_TYPE.get(eventType);
  if (!entry) {
    throw new UnknownEventTypeError(eventType);
  }
  return entry;
}
