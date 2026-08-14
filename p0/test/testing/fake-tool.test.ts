/**
 * Tests for FakeTool
 */

import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  FakeTool,
  type ToolInvokeScript,
  type ToolReconcileScript,
} from "../../src/testing/fake-tool.ts";

test("FakeTool - invoke with success", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    {
      signals: [
        { kind: "stdout", sequence: 0, bytes: new Uint8Array([72, 101, 108, 108, 111]) },
      ],
      result: { exit_code: 0 },
    },
  ];
  fake.setInvokeScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.deepStrictEqual(result.value, { exit_code: 0 });
  }
});

test("FakeTool - invoke with error", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    {
      signals: [],
      result: null,
      error: {
        code: "tool.execution_failed",
        retry: "never",
        redacted_message: "Tool execution failed",
        cause_ref: null,
      },
    },
  ];
  fake.setInvokeScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "tool.execution_failed");
  }
});

test("FakeTool - invoke script exhausted", async () => {
  const fake = new FakeTool();
  fake.setInvokeScript([]);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "unknown");
  }
});

test("FakeTool - invoke records call", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    {
      signals: [],
      result: { exit_code: 0 },
    },
  ];
  fake.setInvokeScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  await fake.invoke({ tool_id: "test", args: [] }, sink, new AbortController().signal);

  const calls = fake.getCalls();
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0], { tool_id: "test", args: [] });
});

test("FakeTool - invoke with contiguous sequence", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    {
      signals: [
        { kind: "stdout", sequence: 0, bytes: new Uint8Array([65]) },
        { kind: "stdout", sequence: 1, bytes: new Uint8Array([66]) },
        { kind: "stdout", sequence: 2, bytes: new Uint8Array([67]) },
      ],
      result: { exit_code: 0 },
    },
  ];
  fake.setInvokeScript(script);

  const receivedSequences: number[] = [];
  const sink = {
    accept: (signal: unknown) => {
      const sig = signal as { sequence: number };
      receivedSequences.push(sig.sequence);
      return { ok: true as const, value: undefined };
    },
  };

  await fake.invoke({ tool_id: "test", args: [] }, sink, new AbortController().signal);

  assert.deepStrictEqual(receivedSequences, [0, 1, 2]);
});

test("FakeTool - invoke with abort before processing", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    {
      signals: [],
      result: { exit_code: 0 },
    },
  ];
  fake.setInvokeScript(script);

  const controller = new AbortController();
  controller.abort();

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    controller.signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "aborted");
  }
});

test("FakeTool - invoke with abort during signal processing", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    {
      signals: [
        { kind: "stdout", sequence: 0, bytes: new Uint8Array([65]) },
        { kind: "stdout", sequence: 1, bytes: new Uint8Array([66]) },
      ],
      result: { exit_code: 0 },
    },
  ];
  fake.setInvokeScript(script);

  let callCount = 0;
  const controller = new AbortController();
  const sink = {
    accept: (signal: unknown) => {
      callCount++;
      if (callCount === 1) {
        controller.abort();
      }
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    controller.signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "aborted");
  }
});

test("FakeTool - invoke with sink failure", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    {
      signals: [
        { kind: "stdout", sequence: 0, bytes: new Uint8Array([65]) },
      ],
      result: { exit_code: 0 },
    },
  ];
  fake.setInvokeScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return {
        ok: false as const,
        error: {
          code: "unknown",
          retry: "never" as const,
          redacted_message: "Sink error",
          cause_ref: null,
        },
      };
    },
  };

  const result = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "unknown");
  }
});

test("FakeTool - reconcile with success", async () => {
  const fake = new FakeTool();
  const script: ToolReconcileScript[] = [
    { result: { reconciled: true } },
  ];
  fake.setReconcileScript(script);

  const result = await fake.reconcile(
    { tool_id: "test", prepared_intent: {} },
    new AbortController().signal
  );

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.deepStrictEqual(result.value, { reconciled: true });
  }
});

test("FakeTool - reconcile with error", async () => {
  const fake = new FakeTool();
  const script: ToolReconcileScript[] = [
    {
      result: null,
      error: {
        code: "tool.not_found",
        retry: "never",
        redacted_message: "Tool not found",
        cause_ref: null,
      },
    },
  ];
  fake.setReconcileScript(script);

  const result = await fake.reconcile(
    { tool_id: "test", prepared_intent: {} },
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "tool.not_found");
  }
});

test("FakeTool - reconcile script exhausted", async () => {
  const fake = new FakeTool();
  fake.setReconcileScript([]);

  const result = await fake.reconcile(
    { tool_id: "test", prepared_intent: {} },
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "unknown");
  }
});

test("FakeTool - reconcile records call", async () => {
  const fake = new FakeTool();
  const script: ToolReconcileScript[] = [
    { result: { reconciled: true } },
  ];
  fake.setReconcileScript(script);

  await fake.reconcile(
    { tool_id: "test", prepared_intent: {} },
    new AbortController().signal
  );

  const calls = fake.getCalls();
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0], { tool_id: "test", prepared_intent: {} });
});

test("FakeTool - reconcile with abort before processing", async () => {
  const fake = new FakeTool();
  const script: ToolReconcileScript[] = [
    { result: { reconciled: true } },
  ];
  fake.setReconcileScript(script);

  const controller = new AbortController();
  controller.abort();

  const result = await fake.reconcile(
    { tool_id: "test", prepared_intent: {} },
    controller.signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "aborted");
  }
});

test("FakeTool - reset clears state", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    { signals: [], result: { exit_code: 0 } },
  ];
  fake.setInvokeScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  await fake.invoke({ tool_id: "test", args: [] }, sink, new AbortController().signal);

  assert.strictEqual(fake.getCalls().length, 1);

  fake.reset();

  assert.strictEqual(fake.getCalls().length, 0);
});

test("FakeTool - deterministic and pure with same script", async () => {
  const fake = new FakeTool();
  const script: ToolInvokeScript[] = [
    { signals: [], result: { exit_code: 0 } },
    { signals: [], result: { exit_code: 0 } },
  ];
  fake.setInvokeScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result1 = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    new AbortController().signal
  );

  const result2 = await fake.invoke(
    { tool_id: "test", args: [] },
    sink,
    new AbortController().signal
  );

  assert.deepStrictEqual(result1, result2);
});
