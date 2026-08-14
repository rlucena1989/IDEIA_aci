/**
 * Tests for task state machine
 *
 * Tests use node:test and node:assert/strict
 * Cartesian product test covers all state pairs
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  type TaskState,
  isFinalState,
  validateTransition,
  canTransition,
  InvalidTransitionError,
  FINAL_STATES,
} from "../../src/domain/task-transition.ts";

const ALL_STATES: TaskState[] = [
  "created",
  "preflight",
  "contextualizing",
  "planned",
  "running",
  "waiting_approval",
  "verifying",
  "sucesso_verificado",
  "falha",
  "bloqueado",
  "cancelado",
  "inconclusivo",
];

test("FINAL_STATES contains all final states", () => {
  assert.strictEqual(FINAL_STATES.size, 5);
  assert.ok(FINAL_STATES.has("sucesso_verificado"));
  assert.ok(FINAL_STATES.has("falha"));
  assert.ok(FINAL_STATES.has("bloqueado"));
  assert.ok(FINAL_STATES.has("cancelado"));
  assert.ok(FINAL_STATES.has("inconclusivo"));
});

test("isFinalState - final states return true", () => {
  assert.strictEqual(isFinalState("sucesso_verificado"), true);
  assert.strictEqual(isFinalState("falha"), true);
  assert.strictEqual(isFinalState("bloqueado"), true);
  assert.strictEqual(isFinalState("cancelado"), true);
  assert.strictEqual(isFinalState("inconclusivo"), true);
});

test("isFinalState - non-final states return false", () => {
  assert.strictEqual(isFinalState("created"), false);
  assert.strictEqual(isFinalState("preflight"), false);
  assert.strictEqual(isFinalState("contextualizing"), false);
  assert.strictEqual(isFinalState("planned"), false);
  assert.strictEqual(isFinalState("running"), false);
  assert.strictEqual(isFinalState("waiting_approval"), false);
  assert.strictEqual(isFinalState("verifying"), false);
});

test("validateTransition - valid transitions succeed", () => {
  assert.doesNotThrow(() => validateTransition("created", "preflight"));
  assert.doesNotThrow(() => validateTransition("created", "cancelado"));
  assert.doesNotThrow(() => validateTransition("preflight", "contextualizing"));
  assert.doesNotThrow(() => validateTransition("preflight", "bloqueado"));
  assert.doesNotThrow(() => validateTransition("contextualizing", "planned"));
  assert.doesNotThrow(() => validateTransition("planned", "running"));
  assert.doesNotThrow(() => validateTransition("running", "waiting_approval"));
  assert.doesNotThrow(() => validateTransition("running", "verifying"));
  assert.doesNotThrow(() => validateTransition("running", "falha"));
  assert.doesNotThrow(() => validateTransition("running", "inconclusivo"));
  assert.doesNotThrow(() => validateTransition("running", "cancelado"));
  assert.doesNotThrow(() => validateTransition("waiting_approval", "running"));
  assert.doesNotThrow(() => validateTransition("verifying", "sucesso_verificado"));
  assert.doesNotThrow(() => validateTransition("verifying", "falha"));
  assert.doesNotThrow(() => validateTransition("verifying", "bloqueado"));
  assert.doesNotThrow(() => validateTransition("verifying", "inconclusivo"));
});

test("validateTransition - final state cannot transition", () => {
  for (const finalState of FINAL_STATES) {
    for (const targetState of ALL_STATES) {
      assert.throws(
        () => validateTransition(finalState, targetState),
        (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
      );
    }
  }
});

test("validateTransition - invalid transitions throw", () => {
  assert.throws(
    () => validateTransition("created", "running"),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
  assert.throws(
    () => validateTransition("preflight", "planned"),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
  assert.throws(
    () => validateTransition("contextualizing", "running"),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
  assert.throws(
    () => validateTransition("planned", "contextualizing"),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
  assert.throws(
    () => validateTransition("waiting_approval", "verifying"),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
});

test("validateTransition - wrong prefix/alias rejected", () => {
  assert.throws(
    () => validateTransition("created" as TaskState, "CREATED" as TaskState),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
});

test("validateTransition - unknown state rejected", () => {
  assert.throws(
    () => validateTransition("unknown" as TaskState, "created"),
    (err: Error) => err instanceof InvalidTransitionError && err.code === "invalid.transition"
  );
});

test("canTransition - returns true for valid transitions", () => {
  assert.strictEqual(canTransition("created", "preflight"), true);
  assert.strictEqual(canTransition("running", "verifying"), true);
  assert.strictEqual(canTransition("verifying", "sucesso_verificado"), true);
});

test("canTransition - returns false for invalid transitions", () => {
  assert.strictEqual(canTransition("created", "running"), false);
  assert.strictEqual(canTransition("sucesso_verificado", "falha"), false);
  assert.strictEqual(canTransition("falha", "created"), false);
});

test("canTransition - returns false for final state transitions", () => {
  assert.strictEqual(canTransition("sucesso_verificado", "created"), false);
  assert.strictEqual(canTransition("falha", "running"), false);
  assert.strictEqual(canTransition("cancelado", "created"), false);
});

test("Cartesian product - all state pairs tested", () => {
  const validTransitions: Record<string, Set<string>> = {
    created: new Set(["preflight", "cancelado"]),
    preflight: new Set(["contextualizing", "bloqueado", "cancelado"]),
    contextualizing: new Set(["planned", "bloqueado", "cancelado"]),
    planned: new Set(["running", "bloqueado", "cancelado"]),
    running: new Set(["waiting_approval", "verifying", "falha", "inconclusivo", "cancelado"]),
    waiting_approval: new Set(["running", "bloqueado", "cancelado"]),
    verifying: new Set(["sucesso_verificado", "falha", "bloqueado", "inconclusivo", "cancelado"]),
    sucesso_verificado: new Set(),
    falha: new Set(),
    bloqueado: new Set(),
    cancelado: new Set(),
    inconclusivo: new Set(),
  };

  for (const from of ALL_STATES) {
    for (const to of ALL_STATES) {
      const expected = validTransitions[from].has(to);
      const actual = canTransition(from, to);
      assert.strictEqual(actual, expected, `Transition ${from} -> ${to}`);
    }
  }
});

test("InvalidTransitionError - contains from and to states", () => {
  assert.throws(
    () => validateTransition("created", "running"),
    (err: Error) => {
      if (!(err instanceof InvalidTransitionError)) {
        return false;
      }
      assert.strictEqual(err.from, "created");
      assert.strictEqual(err.to, "running");
      assert.strictEqual(err.code, "invalid.transition");
      return true;
    }
  );
});

test("No implicit transition by list order", () => {
  assert.strictEqual(canTransition("created", "contextualizing"), false);
  assert.strictEqual(canTransition("preflight", "planned"), false);
  assert.strictEqual(canTransition("contextualizing", "running"), false);
  assert.strictEqual(canTransition("planned", "waiting_approval"), false);
  assert.strictEqual(canTransition("waiting_approval", "verifying"), false);
});
