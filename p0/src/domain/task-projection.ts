/**
 * Pure task projection (WP-08).
 *
 * Reconstructs TaskProjectionV1 from already-validated EventEnvelopeV1
 * events (schema + registry are preconditions; no JCS/JSON Schema validation
 * happens here). No I/O, no clock, no sorting: the fold runs strictly in the
 * received order and fails closed on any divergence.
 *
 * Only task.created (sequence 1) creates the projection; task.transitioned
 * delegates the transition rule to the WP-03 state machine; any other known
 * event advances last_sequence/last_event_id/last_event_digest without
 * changing current_state. Unknown types, wrong payload contracts, broken
 * sequence/chain, duplicate ids/digests, bad causation references and
 * foreign-task events are never ignored.
 */

import { getRegistryEntry } from "./event-registry.ts";
import { validateTransition } from "./task-transition.ts";
import type { TaskState } from "./task-state.ts";

/**
 * Minimal envelope shape consumed by the reducer (already validated upstream).
 */
export interface EventEnvelopeV1 {
  readonly contract: string;
  readonly domain: string;
  readonly event_id: string;
  readonly task_id: string;
  readonly sequence: number;
  readonly occurred_at: string;
  readonly recorded_at: string;
  readonly principal_id: string;
  readonly project_id: string;
  readonly step_id: string | null;
  readonly event_type: string;
  readonly correlation_id: string;
  readonly causation_event_id: string | null;
  readonly payload_contract: string;
  readonly payload: unknown;
  readonly payload_digest: string;
  readonly previous_event_digest: string | null;
  readonly fingerprint_profile: string;
  readonly event_digest: string;
}

/**
 * task.created payload (const contract, initial_state "created").
 */
export interface TaskCreatedPayload {
  readonly contract: "ideia.task-created/1";
  readonly manifest_id: string;
  readonly manifest_fingerprint: string;
  readonly initial_state: "created";
}

/**
 * task.transitioned payload (from_state/to_state follow TaskState).
 */
export interface TaskTransitionedPayload {
  readonly contract: "ideia.task-transitioned/1";
  readonly from_state: TaskState;
  readonly to_state: TaskState;
  readonly reason_code: string;
  readonly reason: string;
}

/**
 * Minimal task projection (taxonomia_eventos_v1.md, "Projeção mínima").
 */
export interface TaskProjectionV1 {
  readonly task_id: string;
  readonly project_id: string;
  readonly principal_id: string;
  readonly manifest_id: string;
  readonly manifest_fingerprint: string;
  readonly current_state: TaskState;
  readonly last_sequence: number;
  readonly last_event_id: string;
  readonly last_event_digest: string;
}

/** No task.created seen yet (empty list or first event is not task.created). */
export class MissingInitialEventError extends Error {
  readonly code = "event.missing_initial";

  constructor(message: string) {
    super(message);
    this.name = "MissingInitialEventError";
  }
}

/** Duplicated task.created, event_id or event_digest. */
export class DuplicateEventError extends Error {
  readonly code = "event.duplicate";
  readonly value: string;

  constructor(value: string, message: string) {
    super(message);
    this.name = "DuplicateEventError";
    this.value = value;
  }
}

/** event_type known but payload_contract does not match the registry. */
export class PayloadContractMismatchError extends Error {
  readonly code = "event.payload_contract";
  readonly eventType: string;

  constructor(eventType: string, message: string) {
    super(message);
    this.name = "PayloadContractMismatchError";
    this.eventType = eventType;
  }
}

/** Sequence does not start at 1 or is not contiguous. */
export class SequenceError extends Error {
  readonly code = "event.sequence";
  readonly expected: number;
  readonly actual: number;

  constructor(actual: number, expected: number) {
    super(`sequence esperado ${expected}, recebido ${actual}`);
    this.name = "SequenceError";
    this.expected = expected;
    this.actual = actual;
  }
}

/** previous_event_digest does not chain (null expected first, else last digest). */
export class ChainError extends Error {
  readonly code = "event.chain";

  constructor(message: string) {
    super(message);
    this.name = "ChainError";
  }
}

/** causation_event_id points to itself or to an event not yet seen. */
export class CausationError extends Error {
  readonly code = "event.causation";
  readonly value: string;

  constructor(value: string, message: string) {
    super(message);
    this.name = "CausationError";
    this.value = value;
  }
}

/** Event belongs to another task. */
export class ForeignTaskEventError extends Error {
  readonly code = "event.foreign_task";

  constructor(taskId: string, expectedTaskId: string) {
    super(`evento de outra task: ${taskId} (esperado ${expectedTaskId})`);
    this.name = "ForeignTaskEventError";
  }
}

/** task.transitioned from_state does not match the projected current_state. */
export class FromStateMismatchError extends Error {
  readonly code = "event.from_state_mismatch";
  readonly fromState: string;
  readonly currentState: TaskState;

  constructor(fromState: string, currentState: TaskState) {
    super(`from_state "${fromState}" não corresponde a current_state "${currentState}"`);
    this.name = "FromStateMismatchError";
    this.fromState = fromState;
    this.currentState = currentState;
  }
}

const TASK_CREATED_CONTRACT = "ideia.task-created/1";
const TASK_TRANSITIONED_CONTRACT = "ideia.task-transitioned/1";

function readTaskCreatedPayload(payload: unknown): TaskCreatedPayload {
  if (payload === null || typeof payload !== "object") {
    throw new PayloadContractMismatchError("task.created", "payload não é objeto");
  }
  const p = payload as Record<string, unknown>;
  if (
    p.contract !== TASK_CREATED_CONTRACT ||
    p.initial_state !== "created" ||
    typeof p.manifest_id !== "string" ||
    typeof p.manifest_fingerprint !== "string"
  ) {
    throw new PayloadContractMismatchError("task.created", "payload fora do formato esperado");
  }
  return {
    contract: TASK_CREATED_CONTRACT,
    manifest_id: p.manifest_id,
    manifest_fingerprint: p.manifest_fingerprint,
    initial_state: "created",
  };
}

function readTaskTransitionedPayload(payload: unknown): TaskTransitionedPayload {
  if (payload === null || typeof payload !== "object") {
    throw new PayloadContractMismatchError("task.transitioned", "payload não é objeto");
  }
  const p = payload as Record<string, unknown>;
  if (
    p.contract !== TASK_TRANSITIONED_CONTRACT ||
    typeof p.reason_code !== "string" ||
    typeof p.reason !== "string" ||
    typeof p.from_state !== "string" ||
    typeof p.to_state !== "string"
  ) {
    throw new PayloadContractMismatchError("task.transitioned", "payload fora do formato esperado");
  }
  // Estados fora dos 12 valores são rejeitados pela máquina WP-03 em validateTransition.
  return {
    contract: TASK_TRANSITIONED_CONTRACT,
    from_state: p.from_state as TaskState,
    to_state: p.to_state as TaskState,
    reason_code: p.reason_code,
    reason: p.reason,
  };
}

/**
 * Creates the projection from task.created at sequence 1 (previous digest null).
 */
export function createProjection(event: EventEnvelopeV1): TaskProjectionV1 {
  const entry = getRegistryEntry(event.event_type);
  if (entry.event_type !== "task.created") {
    throw new MissingInitialEventError(`primeiro evento deve ser task.created, recebido ${event.event_type}`);
  }
  if (event.sequence !== 1) {
    throw new SequenceError(event.sequence, 1);
  }
  if (event.previous_event_digest !== null) {
    throw new ChainError("primeiro evento deve ter previous_event_digest null");
  }
  const payload = readTaskCreatedPayload(event.payload);
  return {
    task_id: event.task_id,
    project_id: event.project_id,
    principal_id: event.principal_id,
    manifest_id: payload.manifest_id,
    manifest_fingerprint: payload.manifest_fingerprint,
    current_state: payload.initial_state,
    last_sequence: event.sequence,
    last_event_id: event.event_id,
    last_event_digest: event.event_digest,
  };
}

/**
 * Applies one event to a projection, purely. Throws on any divergence;
 * task.transitioned delegates the rule to the WP-03 machine.
 */
export function applyEvent(projection: TaskProjectionV1, event: EventEnvelopeV1): TaskProjectionV1 {
  if (event.task_id !== projection.task_id) {
    throw new ForeignTaskEventError(event.task_id, projection.task_id);
  }

  const entry = getRegistryEntry(event.event_type);

  if (entry.event_type === "task.created") {
    throw new DuplicateEventError(event.event_id, "task.created duplicado");
  }

  if (event.payload_contract !== entry.payload_contract) {
    throw new PayloadContractMismatchError(
      event.event_type,
      `esperado ${entry.payload_contract}, recebido ${event.payload_contract}`
    );
  }

  if (event.sequence !== projection.last_sequence + 1) {
    throw new SequenceError(event.sequence, projection.last_sequence + 1);
  }

  if (event.previous_event_digest !== projection.last_event_digest) {
    throw new ChainError(
      `esperado previous_event_digest ${projection.last_event_digest}, recebido ${event.previous_event_digest ?? "null"}`
    );
  }

  if (event.causation_event_id === event.event_id) {
    throw new CausationError(event.event_id, "causation_event_id aponta para o próprio evento");
  }

  let nextState: TaskState = projection.current_state;
  if (entry.event_type === "task.transitioned") {
    const payload = readTaskTransitionedPayload(event.payload);
    if (payload.from_state !== projection.current_state) {
      throw new FromStateMismatchError(payload.from_state, projection.current_state);
    }
    // Delega à máquina WP-03; InvalidTransitionError propaga para falha fechada.
    validateTransition(payload.from_state, payload.to_state);
    nextState = payload.to_state;
  }

  return {
    task_id: projection.task_id,
    project_id: projection.project_id,
    principal_id: projection.principal_id,
    manifest_id: projection.manifest_id,
    manifest_fingerprint: projection.manifest_fingerprint,
    current_state: nextState,
    last_sequence: event.sequence,
    last_event_id: event.event_id,
    last_event_digest: event.event_digest,
  };
}

/**
 * Folds events in the received order. Duplicate event_id/event_digest and
 * causation references to unseen events are rejected; out-of-order input is
 * never sorted.
 */
export function project(events: readonly EventEnvelopeV1[]): TaskProjectionV1 {
  if (events.length === 0) {
    throw new MissingInitialEventError("lista vazia: nenhum task.created");
  }

  let projection = createProjection(events[0]);
  const seenEventIds = new Set<string>([events[0].event_id]);
  const seenEventDigests = new Set<string>([events[0].event_digest]);

  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    if (seenEventIds.has(event.event_id)) {
      throw new DuplicateEventError(event.event_id, `event_id duplicado: ${event.event_id}`);
    }
    if (seenEventDigests.has(event.event_digest)) {
      throw new DuplicateEventError(event.event_digest, `event_digest duplicado: ${event.event_digest}`);
    }
    if (event.causation_event_id !== null && !seenEventIds.has(event.causation_event_id)) {
      throw new CausationError(
        event.causation_event_id,
        `causation_event_id ${event.causation_event_id} não existe entre os eventos anteriores`
      );
    }
    projection = applyEvent(projection, event);
    seenEventIds.add(event.event_id);
    seenEventDigests.add(event.event_digest);
  }

  return projection;
}
