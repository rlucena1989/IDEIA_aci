/**
 * Tests for FakeVerifier
 */

import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  FakeVerifier,
  type VerifierScript,
} from "../../src/testing/fake-verifier.ts";

test("FakeVerifier - verify with success", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
  ];
  fake.setScript(script);

  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.deepStrictEqual(result.value, { passed: true });
  }
});

test("FakeVerifier - verify with error", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    {
      result: null,
      error: {
        code: "verification.failed",
        retry: "never",
        redacted_message: "Verification failed",
        cause_ref: null,
      },
    },
  ];
  fake.setScript(script);

  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "verification.failed");
  }
});

test("FakeVerifier - verify script exhausted", async () => {
  const fake = new FakeVerifier();
  fake.setScript([]);

  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "unknown");
  }
});

test("FakeVerifier - verify records call", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
  ];
  fake.setScript(script);

  const criterion = { criterion_id: "test" };
  const evidence = [{ evidence_id: "e1" }];

  await fake.verify(criterion, evidence, new AbortController().signal);

  const calls = fake.getCalls();
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0].criterion, criterion);
  assert.deepStrictEqual(calls[0].evidence, evidence);
});

test("FakeVerifier - verify with defensive copy of criterion", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
  ];
  fake.setScript(script);

  const criterion = { criterion_id: "test", mutable: "value" };
  await fake.verify(criterion, [], new AbortController().signal);

  // Modify original
  criterion.mutable = "changed";

  const calls = fake.getCalls();
  assert.strictEqual((calls[0] as { criterion: { mutable: string } }).criterion.mutable, "value");
});

test("FakeVerifier - verify with defensive copy of evidence", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
  ];
  fake.setScript(script);

  const evidence = [{ evidence_id: "e1", mutable: "value" }];
  await fake.verify({}, evidence, new AbortController().signal);

  // Modify original
  evidence[0].mutable = "changed";

  const calls = fake.getCalls();
  assert.strictEqual((calls[0] as { evidence: ReadonlyArray<{ mutable: string }> }).evidence[0].mutable, "value");
});

test("FakeVerifier - verify with abort before processing", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
  ];
  fake.setScript(script);

  const controller = new AbortController();
  controller.abort();

  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    controller.signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "aborted");
  }
});

test("FakeVerifier - verify uses only provided criterion and evidence", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true, based_on: "provided" } },
  ];
  fake.setScript(script);

  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.deepStrictEqual(result.value, { passed: true, based_on: "provided" });
  }
});

test("FakeVerifier - error never becomes pass", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    {
      result: null,
      error: {
        code: "verification.failed",
        retry: "never",
        redacted_message: "Verification failed",
        cause_ref: null,
      },
    },
  ];
  fake.setScript(script);

  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
});

test("FakeVerifier - absence never becomes pass", async () => {
  const fake = new FakeVerifier();
  fake.setScript([]);

  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
});

test("FakeVerifier - reset clears state", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
  ];
  fake.setScript(script);

  await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(fake.getCalls().length, 1);

  fake.reset();

  assert.strictEqual(fake.getCalls().length, 0);
});

test("FakeVerifier - deterministic and pure with same script", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
    { result: { passed: true } },
  ];
  fake.setScript(script);

  const result1 = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  const result2 = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.deepStrictEqual(result1, result2);
});

test("FakeVerifier - no network or filesystem access", async () => {
  const fake = new FakeVerifier();
  const script: VerifierScript[] = [
    { result: { passed: true } },
  ];
  fake.setScript(script);

  // Should complete without any external calls
  const result = await fake.verify(
    { criterion_id: "test" },
    [{ evidence_id: "e1" }],
    new AbortController().signal
  );

  assert.strictEqual(result.ok, true);
});
