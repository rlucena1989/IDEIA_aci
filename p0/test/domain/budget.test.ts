/**
 * Tests for budget accounting and hard limit gate
 *
 * Tests use node:test and node:assert/strict
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  computeBudget,
  InvalidBudgetError,
  type BudgetState,
  type BudgetDecision,
} from "../../src/domain/budget.ts";

test("computeBudget - under limit allows start", () => {
  const state = computeBudget(100, 30, 20, 0);
  assert.strictEqual(state.decision, "can_start");
  assert.strictEqual(state.accounted, 50);
  assert.strictEqual(state.remaining, 50);
});

test("computeBudget - at exact limit blocks start", () => {
  const state = computeBudget(100, 60, 40, 0);
  assert.strictEqual(state.decision, "hard_limit_reached");
  assert.strictEqual(state.accounted, 100);
  assert.strictEqual(state.remaining, 0);
});

test("computeBudget - over limit blocks start", () => {
  const state = computeBudget(100, 70, 40, 0);
  assert.strictEqual(state.decision, "hard_limit_reached");
  assert.strictEqual(state.accounted, 110);
  assert.strictEqual(state.remaining, 0);
});

test("computeBudget - zero confirmed and reserved", () => {
  const state = computeBudget(100, 0, 0, 0);
  assert.strictEqual(state.decision, "can_start");
  assert.strictEqual(state.accounted, 0);
  assert.strictEqual(state.remaining, 100);
});

test("computeBudget - zero hard limit blocks immediately", () => {
  const state = computeBudget(0, 0, 0, 0);
  assert.strictEqual(state.decision, "hard_limit_reached");
  assert.strictEqual(state.accounted, 0);
  assert.strictEqual(state.remaining, 0);
});

test("computeBudget - possibleOverage is reported separately", () => {
  const state = computeBudget(100, 30, 20, 15);
  assert.strictEqual(state.possibleOverage, 15);
  assert.strictEqual(state.decision, "can_start");
  assert.strictEqual(state.accounted, 50);
});

test("computeBudget - possibleOverage does not affect accounted", () => {
  const state = computeBudget(100, 30, 20, 50);
  assert.strictEqual(state.possibleOverage, 50);
  assert.strictEqual(state.accounted, 50);
  assert.strictEqual(state.decision, "can_start");
});

test("computeBudget - NaN throws", () => {
  assert.throws(
    () => computeBudget(NaN, 30, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
  assert.throws(
    () => computeBudget(100, NaN, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
});

test("computeBudget - Infinity throws", () => {
  assert.throws(
    () => computeBudget(Infinity, 30, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
  assert.throws(
    () => computeBudget(100, Infinity, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
  assert.throws(
    () => computeBudget(-Infinity, 30, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
});

test("computeBudget - negative throws", () => {
  assert.throws(
    () => computeBudget(-10, 30, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
  assert.throws(
    () => computeBudget(100, -5, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
  assert.throws(
    () => computeBudget(100, 30, -10, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
  assert.throws(
    () => computeBudget(100, 30, 20, -5),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
});

test("computeBudget - non-integer throws", () => {
  assert.throws(
    () => computeBudget(100.5, 30, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
  assert.throws(
    () => computeBudget(100, 30.7, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
});

test("computeBudget - above MAX_SAFE_INTEGER throws", () => {
  assert.throws(
    () => computeBudget(Number.MAX_SAFE_INTEGER + 1, 30, 20, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
});

test("computeBudget - overflow on addition throws", () => {
  assert.throws(
    () => computeBudget(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1, 0),
    (err: Error) => err instanceof InvalidBudgetError && err.code === "invalid.budget"
  );
});

test("computeBudget - MAX_SAFE_INTEGER boundary", () => {
  const state = computeBudget(Number.MAX_SAFE_INTEGER, 0, 0, 0);
  assert.strictEqual(state.decision, "can_start");
  assert.strictEqual(state.hardLimit, Number.MAX_SAFE_INTEGER);
});

test("computeBudget - large values within safe range", () => {
  const state = computeBudget(9007199254740990, 4000000000000000, 3000000000000000, 0);
  assert.strictEqual(state.decision, "can_start");
  assert.strictEqual(state.accounted, 7000000000000000);
  assert.strictEqual(state.remaining, 2007199254740990);
});

test("computeBudget - accounted is confirmed plus reserved", () => {
  const state = computeBudget(100, 30, 20, 0);
  assert.strictEqual(state.accounted, 50);
  assert.strictEqual(state.confirmed, 30);
  assert.strictEqual(state.reserved, 20);
});

test("computeBudget - remaining is max of zero and hardLimit minus accounted", () => {
  const state1 = computeBudget(100, 30, 20, 0);
  assert.strictEqual(state1.remaining, 50);

  const state2 = computeBudget(100, 150, 0, 0);
  assert.strictEqual(state2.remaining, 0);
});

test("computeBudget - decision is hard_limit_reached when accounted >= hardLimit", () => {
  const state1 = computeBudget(100, 100, 0, 0);
  assert.strictEqual(state1.decision, "hard_limit_reached");

  const state2 = computeBudget(100, 101, 0, 0);
  assert.strictEqual(state2.decision, "hard_limit_reached");
});

test("computeBudget - decision is can_start when accounted < hardLimit", () => {
  const state = computeBudget(100, 99, 0, 0);
  assert.strictEqual(state.decision, "can_start");
});

test("computeBudget - pure and deterministic", () => {
  const state1 = computeBudget(100, 30, 20, 0);
  const state2 = computeBudget(100, 30, 20, 0);
  assert.deepStrictEqual(state1, state2);
});

test("computeBudget - no unit conversion or policy", () => {
  const state = computeBudget(100, 30, 20, 0);
  assert.strictEqual(state.hardLimit, 100);
  assert.strictEqual(state.confirmed, 30);
  assert.strictEqual(state.reserved, 20);
  assert.strictEqual(state.possibleOverage, 0);
});

test("computeBudget - boundary at 0", () => {
  const state = computeBudget(0, 0, 0, 0);
  assert.strictEqual(state.decision, "hard_limit_reached");
  assert.strictEqual(state.remaining, 0);
});
