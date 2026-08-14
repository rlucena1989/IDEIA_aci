/**
 * Tests for the pure task projection reducer (WP-08).
 *
 * Covers the acceptance criteria: creation only by task.created at sequence 1,
 * contiguous sequence, previous digest chaining, from_state match, transition
 * delegated to the WP-03 machine, non-mutating events preserving state,
 * unknown/out-of-order/duplicate events failing closed, deterministic replay,
 * causation references and foreign-task rejection.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  createProjection,
  applyEvent,
  project,
  MissingInitialEventError,
  DuplicateEventError,
  PayloadContractMismatchError,
  SequenceError,
  ChainError,
  CausationError,
  ForeignTaskEventError,
  FromStateMismatchError,
  type EventEnvelopeV1,
  type TaskProjectionV1,
} from "../../src/domain/task-projection.ts";
import { UnknownEventTypeError } from "../../src/domain/event-registry.ts";
import { InvalidTransitionError } from "../../src/domain/task-transition.ts";

const TASK_ID = "tsk_11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "prj_11111111-1111-4111-8111-111111111111";
const PRINCIPAL_ID = "prn_11111111-1111-4111-8111-111111111111";
const MANIFEST_ID = "mft_11111111-1111-4111-8111-111111111111";
const MANIFEST_FINGERPRINT = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

let digestCounter = 0;
let eventIdCounter = 0;

function nextDigest(): string {
  digestCounter += 1;
  return `sha256:${digestCounter.toString(16).padStart(64, "0")}`;
}

function nextEventId(): string {
  eventIdCounter += 1;
  return `evt_${eventIdCounter}`;
}

interface EnvelopeOverrides {
  event_id?: string;
  task_id?: string;
  sequence?: number;
  event_type?: string;
  principal_id?: string;
  project_id?: string;
  causation_event_id?: string | null;
  payload_contract?: string;
  payload?: unknown;
  previous_event_digest?: string | null;
  event_digest?: string;
}

function envelope(overrides: EnvelopeOverrides = {}): EventEnvelopeV1 {
  return {
    contract: "ideia.event-envelope/1",
    domain: "IDEIA-P0",
    event_id: overrides.event_id ?? nextEventId(),
    task_id: overrides.task_id ?? TASK_ID,
    sequence: overrides.sequence ?? 1,
    occurred_at: "2024-01-01T00:00:00.000Z",
    recorded_at: "2024-01-01T00:00:00.000Z",
    principal_id: overrides.principal_id ?? PRINCIPAL_ID,
    project_id: overrides.project_id ?? PROJECT_ID,
    step_id: null,
    event_type: overrides.event_type ?? "task.created",
    correlation_id: "cor_11111111-1111-4111-8111-111111111111",
    causation_event_id: overrides.causation_event_id ?? null,
    payload_contract: overrides.payload_contract ?? "ideia.task-created/1",
    payload: overrides.payload ?? {},
    payload_digest: nextDigest(),
    previous_event_digest: overrides.previous_event_digest ?? null,
    fingerprint_profile: "jcs-sha256-v1",
    event_digest: overrides.event_digest ?? nextDigest(),
  };
}

function createdEvent(sequence = 1, overrides: EnvelopeOverrides = {}): EventEnvelopeV1 {
  return envelope({
    sequence,
    event_type: "task.created",
    payload_contract: "ideia.task-created/1",
    payload: {
      contract: "ideia.task-created/1",
      manifest_id: MANIFEST_ID,
      manifest_fingerprint: MANIFEST_FINGERPRINT,
      initial_state: "created",
    },
    ...overrides,
  });
}

function transitionedEvent(from: string, to: string, sequence: number, overrides: EnvelopeOverrides = {}): EventEnvelopeV1 {
  return envelope({
    sequence,
    event_type: "task.transitioned",
    payload_contract: "ideia.task-transitioned/1",
    payload: {
      contract: "ideia.task-transitioned/1",
      from_state: from,
      to_state: to,
      reason_code: "test",
      reason: "teste de transição",
    },
    ...overrides,
  });
}

function nonMutatingEvent(sequence: number, overrides: EnvelopeOverrides = {}): EventEnvelopeV1 {
  return envelope({
    sequence,
    event_type: "policy.decided",
    payload_contract: "ideia.policy-decision/1",
    payload: { contract: "ideia.policy-decision/1" },
    ...overrides,
  });
}

function chained(previous: EventEnvelopeV1, overrides: EnvelopeOverrides = {}): EnvelopeOverrides {
  return { previous_event_digest: previous.event_digest, ...overrides };
}

test("task.created em sequence 1 cria a projeção", () => {
  const e1 = createdEvent(1);
  const projection = project([e1]);
  assert.equal(projection.task_id, TASK_ID);
  assert.equal(projection.project_id, PROJECT_ID);
  assert.equal(projection.principal_id, PRINCIPAL_ID);
  assert.equal(projection.manifest_id, MANIFEST_ID);
  assert.equal(projection.manifest_fingerprint, MANIFEST_FINGERPRINT);
  assert.equal(projection.current_state, "created");
  assert.equal(projection.last_sequence, 1);
  assert.equal(projection.last_event_id, e1.event_id);
  assert.equal(projection.last_event_digest, e1.event_digest);
});

test("lista vazia falha (sem task.created)", () => {
  assert.throws(
    () => project([]),
    (err: Error) => err instanceof MissingInitialEventError && err.code === "event.missing_initial"
  );
});

test("evento antes de task.created falha", () => {
  const first = nonMutatingEvent(1);
  assert.throws(
    () => project([first]),
    (err: Error) => err instanceof MissingInitialEventError && err.code === "event.missing_initial"
  );
  const firstTransition = transitionedEvent("created", "preflight", 1);
  assert.throws(
    () => project([firstTransition]),
    (err: Error) => err instanceof MissingInitialEventError && err.code === "event.missing_initial"
  );
});

test("task.created duplicado falha", () => {
  const e1 = createdEvent(1);
  const e2 = createdEvent(2, chained(e1));
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof DuplicateEventError && err.code === "event.duplicate"
  );
});

test("sequence deve começar em 1", () => {
  const e1 = createdEvent(2);
  assert.throws(
    () => project([e1]),
    (err: Error) => err instanceof SequenceError && err.code === "event.sequence"
  );
});

test("sequence deve ser contígua", () => {
  const e1 = createdEvent(1);
  const e3 = nonMutatingEvent(3, chained(e1));
  assert.throws(
    () => project([e1, e3]),
    (err: Error) => err instanceof SequenceError && err.code === "event.sequence"
  );
});

test("previous digest null no primeiro evento", () => {
  const e1 = createdEvent(1, { previous_event_digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" });
  assert.throws(
    () => project([e1]),
    (err: Error) => err instanceof ChainError && err.code === "event.chain"
  );
});

test("previous digest deve encadear com o último evento", () => {
  const e1 = createdEvent(1);
  const e2 = nonMutatingEvent(2, {
    previous_event_digest: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof ChainError && err.code === "event.chain"
  );
});

test("from_state diferente da projeção falha", () => {
  const e1 = createdEvent(1);
  const e2 = transitionedEvent("running", "verifying", 2, chained(e1));
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof FromStateMismatchError && err.code === "event.from_state_mismatch"
  );
});

test("transição inválida delega à máquina WP-03 e falha", () => {
  const e1 = createdEvent(1);
  const e2 = transitionedEvent("created", "sucesso_verificado", 2, chained(e1));
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
});

test("transições válidas atualizam o estado", () => {
  const e1 = createdEvent(1);
  const e2 = transitionedEvent("created", "preflight", 2, chained(e1));
  const e3 = transitionedEvent("preflight", "contextualizing", 3, chained(e2));
  const projection = project([e1, e2, e3]);
  assert.equal(projection.current_state, "contextualizing");
  assert.equal(projection.last_sequence, 3);
  assert.equal(projection.last_event_id, e3.event_id);
});

test("evento conhecido não mutador preserva current_state mas avança", () => {
  const e1 = createdEvent(1);
  const e2 = nonMutatingEvent(2, chained(e1));
  const projection = project([e1, e2]);
  assert.equal(projection.current_state, "created");
  assert.equal(projection.last_sequence, 2);
  assert.equal(projection.last_event_id, e2.event_id);
  assert.equal(projection.last_event_digest, e2.event_digest);
});

test("evento desconhecido não é ignorado", () => {
  const e1 = createdEvent(1);
  const e2 = envelope({
    sequence: 2,
    event_type: "model.called",
    payload_contract: "ideia.model-call/1",
    ...chained(e1),
  });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof UnknownEventTypeError && err.code === "event.unknown"
  );
});

test("par tipo/schema incorreto falha", () => {
  const e1 = createdEvent(1);
  const e2 = envelope({
    sequence: 2,
    event_type: "policy.decided",
    payload_contract: "ideia.tool-result/1",
    ...chained(e1),
  });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof PayloadContractMismatchError && err.code === "event.payload_contract"
  );
});

test("entrada fora de ordem não é classificada", () => {
  const e1 = createdEvent(1);
  const e2 = transitionedEvent("created", "preflight", 2, chained(e1));
  const e3 = nonMutatingEvent(3, chained(e2));
  // e3 (sequence 3) chega antes de e2 (sequence 2): contiguidade quebra.
  assert.throws(
    () => project([e1, e3, e2]),
    (err: Error) => err instanceof SequenceError && err.code === "event.sequence"
  );
});

test("replay da mesma lista produz valor estruturalmente igual", () => {
  const e1 = createdEvent(1);
  const e2 = transitionedEvent("created", "preflight", 2, chained(e1));
  const e3 = nonMutatingEvent(3, chained(e2));
  const e4 = transitionedEvent("preflight", "bloqueado", 4, chained(e3));
  const events = [e1, e2, e3, e4];
  const a = project(events);
  const b = project(events);
  assert.deepEqual(a, b);
});

test("event_id duplicado falha", () => {
  const e1 = createdEvent(1);
  const e2 = nonMutatingEvent(2, { ...chained(e1), event_id: e1.event_id });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof DuplicateEventError && err.code === "event.duplicate"
  );
});

test("event_digest duplicado falha", () => {
  const e1 = createdEvent(1);
  const e2 = nonMutatingEvent(2, { ...chained(e1), event_digest: e1.event_digest });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof DuplicateEventError && err.code === "event.duplicate"
  );
});

test("causation para o próprio evento falha", () => {
  const e1 = createdEvent(1);
  const selfId = nextEventId();
  const e2 = nonMutatingEvent(2, { ...chained(e1), event_id: selfId, causation_event_id: selfId });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof CausationError && err.code === "event.causation"
  );
});

test("causation para evento ainda não visto falha", () => {
  const e1 = createdEvent(1);
  const e2 = nonMutatingEvent(2, { ...chained(e1), causation_event_id: "evt_999" });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof CausationError && err.code === "event.causation"
  );
});

test("causation válida para evento anterior é aceita", () => {
  const e1 = createdEvent(1);
  const e2 = nonMutatingEvent(2, { ...chained(e1), causation_event_id: e1.event_id });
  const projection = project([e1, e2]);
  assert.equal(projection.last_sequence, 2);
  assert.equal(projection.current_state, "created");
});

test("evento de outra task falha", () => {
  const e1 = createdEvent(1);
  const e2 = nonMutatingEvent(2, { ...chained(e1), task_id: "tsk_22222222-2222-4222-8222-222222222222" });
  assert.throws(
    () => project([e1, e2]),
    (err: Error) => err instanceof ForeignTaskEventError && err.code === "event.foreign_task"
  );
});

test("estado final: terminal bloqueia novo transitioned, mas não mutador ainda avança", () => {
  const e1 = createdEvent(1);
  const e2 = transitionedEvent("created", "preflight", 2, chained(e1));
  const e3 = transitionedEvent("preflight", "bloqueado", 3, chained(e2));
  const terminal = project([e1, e2, e3]);
  assert.equal(terminal.current_state, "bloqueado");
  // Reabrir estado terminal falha pela máquina WP-03.
  const e4 = transitionedEvent("bloqueado", "running", 4, chained(e3));
  assert.throws(
    () => project([e1, e2, e3, e4]),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
  // Evidência/evento corretivo posterior é registrado sem reabrir estado.
  const e5 = nonMutatingEvent(4, chained(e3));
  const withEvidence = project([e1, e2, e3, e5]);
  assert.equal(withEvidence.current_state, "bloqueado");
  assert.equal(withEvidence.last_sequence, 4);
});

test("event.corrected não reescreve o passado e preserva o estado", () => {
  const e1 = createdEvent(1);
  const corrected = envelope({
    sequence: 2,
    event_type: "event.corrected",
    payload_contract: "ideia.event-correction/1",
    payload: { contract: "ideia.event-correction/1", target_event_id: e1.event_id },
    ...chained(e1),
  });
  const projection = project([e1, corrected]);
  assert.equal(projection.current_state, "created");
  assert.equal(projection.last_sequence, 2);
  assert.equal(projection.last_event_id, corrected.event_id);
});

test("createProjection e applyEvent são puros (entrada não é mutada)", () => {
  const e1 = createdEvent(1);
  const snapshot = JSON.parse(JSON.stringify(e1)) as EventEnvelopeV1;
  const projection = createProjection(e1);
  const e2 = transitionedEvent("created", "preflight", 2, chained(e1));
  const applied = applyEvent(projection, e2);
  assert.notEqual(applied, projection);
  assert.deepEqual(e1, snapshot);
});

test("payload de task.created fora do formato esperado falha fechado", () => {
  const e1 = createdEvent(1, {
    payload: { contract: "ideia.task-created/1", manifest_id: MANIFEST_ID, manifest_fingerprint: MANIFEST_FINGERPRINT, initial_state: "preflight" },
  });
  assert.throws(
    () => project([e1]),
    (err: Error) => err instanceof PayloadContractMismatchError && err.code === "event.payload_contract"
  );
});

test("projeção resultante é congelada (readonly shape)", () => {
  const projection = project([createdEvent(1)]) as TaskProjectionV1;
  assert.equal(typeof projection.current_state, "string");
  assert.equal(typeof projection.last_sequence, "number");
});
