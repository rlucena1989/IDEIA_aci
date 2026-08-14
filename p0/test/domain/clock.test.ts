/**
 * Tests for clock implementations
 *
 * Tests use node:test and node:assert/strict
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  FakeAuditClock,
  FakeMonotonicClock,
} from "../../src/domain/clock.ts";
import {
  SystemAuditClock,
  SystemMonotonicClock,
} from "../../src/adapters/system-clock.ts";

test("SystemAuditClock - returns current UTC time", () => {
  const clock = new SystemAuditClock();
  const now = clock.nowUtc();

  assert.ok(now instanceof Date);
  assert.ok(now.getTime() > 0);
});

test("SystemMonotonicClock - returns non-decreasing time", () => {
  const clock = new SystemMonotonicClock();
  const t1 = clock.nowMs();
  const t2 = clock.nowMs();

  assert.ok(t2 >= t1);
  assert.ok(t1 >= 0n);
});

test("FakeAuditClock - initial time is set correctly", () => {
  const initial = new Date("2024-01-01T00:00:00.000Z");
  const clock = new FakeAuditClock(initial);
  const now = clock.nowUtc();

  assert.strictEqual(now.getTime(), initial.getTime());
  assert.strictEqual(now.toISOString(), initial.toISOString());
});

test("FakeAuditClock - does not read Date.now", () => {
  const clock = new FakeAuditClock(new Date("2024-01-01T00:00:00.000Z"));
  const t1 = clock.nowUtc();

  const t2 = clock.nowUtc();
  assert.strictEqual(t2.getTime(), t1.getTime());
});

test("FakeAuditClock - advance by positive milliseconds", () => {
  const clock = new FakeAuditClock(new Date("2024-01-01T00:00:00.000Z"));
  const initial = clock.nowUtc().getTime();
  clock.advance(1000);

  const now = clock.nowUtc();
  assert.strictEqual(now.getTime(), initial + 1000);
});

test("FakeAuditClock - advance by zero milliseconds", () => {
  const clock = new FakeAuditClock(new Date("2024-01-01T00:00:00.000Z"));
  const initial = clock.nowUtc().getTime();
  clock.advance(0);

  const now = clock.nowUtc();
  assert.strictEqual(now.getTime(), initial);
});

test("FakeAuditClock - advance by negative milliseconds throws", () => {
  const clock = new FakeAuditClock();
  assert.throws(() => clock.advance(-100), /Cannot advance audit clock backwards/);
});

test("FakeAuditClock - setTime changes time", () => {
  const clock = new FakeAuditClock();
  const newTime = new Date("2024-06-15T12:30:00.000Z");
  clock.setTime(newTime);

  const now = clock.nowUtc();
  assert.strictEqual(now.getTime(), newTime.getTime());
});

test("FakeAuditClock - returns defensive copy", () => {
  const clock = new FakeAuditClock(new Date("2024-01-01T00:00:00.000Z"));
  const t1 = clock.nowUtc();
  const originalTime = t1.getTime();

  // Mutate the returned date
  t1.setTime(t1.getTime() + 1000);

  const t2 = clock.nowUtc();
  assert.strictEqual(t2.getTime(), originalTime);
});

test("FakeMonotonicClock - initial time is set correctly", () => {
  const clock = new FakeMonotonicClock(1000n);
  assert.strictEqual(clock.nowMs(), 1000n);
});

test("FakeMonotonicClock - does not read performance.now", () => {
  const clock = new FakeMonotonicClock(0n);
  const t1 = clock.nowMs();

  const t2 = clock.nowMs();
  assert.strictEqual(t2, t1);
});

test("FakeMonotonicClock - advance by positive milliseconds", () => {
  const clock = new FakeMonotonicClock(0n);
  clock.advance(1000n);

  assert.strictEqual(clock.nowMs(), 1000n);
});

test("FakeMonotonicClock - advance by zero milliseconds", () => {
  const clock = new FakeMonotonicClock(1000n);
  clock.advance(0n);

  assert.strictEqual(clock.nowMs(), 1000n);
});

test("FakeMonotonicClock - advance by negative milliseconds throws", () => {
  const clock = new FakeMonotonicClock(1000n);
  assert.throws(() => clock.advance(-100n), /Cannot advance monotonic clock backwards/);
});

test("FakeMonotonicClock - setTime with larger value", () => {
  const clock = new FakeMonotonicClock(1000n);
  clock.setTime(5000n);

  assert.strictEqual(clock.nowMs(), 5000n);
});

test("FakeMonotonicClock - setTime with same value", () => {
  const clock = new FakeMonotonicClock(1000n);
  clock.setTime(1000n);

  assert.strictEqual(clock.nowMs(), 1000n);
});

test("FakeMonotonicClock - setTime with smaller value throws", () => {
  const clock = new FakeMonotonicClock(1000n);
  assert.throws(() => clock.setTime(500n), /Cannot set monotonic clock backwards/);
});

test("FakeMonotonicClock - initial negative time throws", () => {
  assert.throws(() => new FakeMonotonicClock(-100n), /Initial monotonic time cannot be negative/);
});

test("FakeMonotonicClock - time is non-decreasing across multiple advances", () => {
  const clock = new FakeMonotonicClock(0n);

  const t1 = clock.nowMs();
  clock.advance(100n);
  const t2 = clock.nowMs();
  clock.advance(50n);
  const t3 = clock.nowMs();
  clock.advance(0n);
  const t4 = clock.nowMs();

  assert.ok(t2 > t1);
  assert.ok(t3 > t2);
  assert.strictEqual(t4, t3);
});
