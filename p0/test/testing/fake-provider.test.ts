/**
 * Tests for FakeProvider
 */

import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  FakeProvider,
  type ProviderProbeScript,
  type ProviderGenerateScript,
} from "../../src/testing/fake-provider.ts";

test("FakeProvider - probe with success", async () => {
  const fake = new FakeProvider();
  const script: ProviderProbeScript[] = [
    { result: { provider_id: "test", model_id: "gpt-4" } },
  ];
  fake.setProbeScript(script);

  const result = await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    new AbortController().signal
  );

  assert.strictEqual(result.ok, true);
  if (result.ok) {
    assert.deepStrictEqual(result.value, { provider_id: "test", model_id: "gpt-4" });
  }
});

test("FakeProvider - probe with error", async () => {
  const fake = new FakeProvider();
  const script: ProviderProbeScript[] = [
    {
      result: null,
      error: {
        code: "provider.unavailable",
        retry: "never",
        redacted_message: "Provider unavailable",
        cause_ref: null,
      },
    },
  ];
  fake.setProbeScript(script);

  const result = await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "provider.unavailable");
  }
});

test("FakeProvider - probe script exhausted", async () => {
  const fake = new FakeProvider();
  fake.setProbeScript([]);

  const result = await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    new AbortController().signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "unknown");
  }
});

test("FakeProvider - probe records call", async () => {
  const fake = new FakeProvider();
  const script: ProviderProbeScript[] = [{ result: {} }];
  fake.setProbeScript(script);

  await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    new AbortController().signal
  );

  const calls = fake.getCalls();
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0], {
    provider_id: "test",
    endpoint_profile: "default",
    model_id: "gpt-4",
  });
});

test("FakeProvider - probe with abort before processing", async () => {
  const fake = new FakeProvider();
  const script: ProviderProbeScript[] = [{ result: {} }];
  fake.setProbeScript(script);

  const controller = new AbortController();
  controller.abort();

  const result = await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    controller.signal
  );

  assert.strictEqual(result.ok, false);
  if (!result.ok) {
    assert.strictEqual(result.error.code, "aborted");
  }
});

test("FakeProvider - generate with success", async () => {
  const fake = new FakeProvider();
  const script: ProviderGenerateScript[] = [
    {
      signals: [
        { kind: "output_delta", sequence: 0, text: "Hello" },
        { kind: "output_delta", sequence: 1, text: " World" },
      ],
      terminal: {
        status: "completed",
        finish_reason: "stop",
        output: "Hello World",
        provider_response_id: "resp-123",
        error: null,
      },
    },
  ];
  fake.setGenerateScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.generate(
    { test: "request" },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.status, "completed");
  assert.strictEqual(result.output, "Hello World");
});

test("FakeProvider - generate with error", async () => {
  const fake = new FakeProvider();
  const script: ProviderGenerateScript[] = [
    {
      signals: [],
      terminal: {
        status: "failed",
        finish_reason: "error",
        output: null,
        provider_response_id: null,
        error: {
          code: "provider.invalid_response",
          retry: "never",
          redacted_message: "Invalid response",
          cause_ref: null,
        },
      },
    },
  ];
  fake.setGenerateScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.generate(
    { test: "request" },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.status, "failed");
  assert.strictEqual(result.error?.code, "provider.invalid_response");
});

test("FakeProvider - generate script exhausted", async () => {
  const fake = new FakeProvider();
  fake.setGenerateScript([]);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.generate(
    { test: "request" },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.status, "failed");
});

test("FakeProvider - generate records call", async () => {
  const fake = new FakeProvider();
  const script: ProviderGenerateScript[] = [
    {
      signals: [],
      terminal: {
        status: "completed",
        finish_reason: "stop",
        output: null,
        provider_response_id: null,
        error: null,
      },
    },
  ];
  fake.setGenerateScript(script);

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  await fake.generate({ test: "request" }, sink, new AbortController().signal);

  const calls = fake.getCalls();
  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0], { test: "request" });
});

test("FakeProvider - generate with contiguous sequence", async () => {
  const fake = new FakeProvider();
  const script: ProviderGenerateScript[] = [
    {
      signals: [
        { kind: "output_delta", sequence: 0, text: "A" },
        { kind: "output_delta", sequence: 1, text: "B" },
        { kind: "output_delta", sequence: 2, text: "C" },
      ],
      terminal: {
        status: "completed",
        finish_reason: "stop",
        output: null,
        provider_response_id: null,
        error: null,
      },
    },
  ];
  fake.setGenerateScript(script);

  const receivedSequences: number[] = [];
  const sink = {
    accept: (signal: unknown) => {
      const sig = signal as { sequence: number };
      receivedSequences.push(sig.sequence);
      return { ok: true as const, value: undefined };
    },
  };

  await fake.generate({ test: "request" }, sink, new AbortController().signal);

  assert.deepStrictEqual(receivedSequences, [0, 1, 2]);
});

test("FakeProvider - generate with abort before processing", async () => {
  const fake = new FakeProvider();
  const script: ProviderGenerateScript[] = [
    {
      signals: [],
      terminal: {
        status: "completed",
        finish_reason: "stop",
        output: null,
        provider_response_id: null,
        error: null,
      },
    },
  ];
  fake.setGenerateScript(script);

  const controller = new AbortController();
  controller.abort();

  const sink = {
    accept: (signal: unknown) => {
      return { ok: true as const, value: undefined };
    },
  };

  const result = await fake.generate(
    { test: "request" },
    sink,
    controller.signal
  );

  assert.strictEqual(result.status, "cancelled");
  assert.strictEqual(result.error?.code, "aborted");
});

test("FakeProvider - generate with abort during signal processing", async () => {
  const fake = new FakeProvider();
  const script: ProviderGenerateScript[] = [
    {
      signals: [
        { kind: "output_delta", sequence: 0, text: "A" },
        { kind: "output_delta", sequence: 1, text: "B" },
      ],
      terminal: {
        status: "completed",
        finish_reason: "stop",
        output: null,
        provider_response_id: null,
        error: null,
      },
    },
  ];
  fake.setGenerateScript(script);

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

  const result = await fake.generate(
    { test: "request" },
    sink,
    controller.signal
  );

  assert.strictEqual(result.status, "cancelled");
  assert.strictEqual(result.error?.code, "aborted");
});

test("FakeProvider - generate with sink failure", async () => {
  const fake = new FakeProvider();
  const script: ProviderGenerateScript[] = [
    {
      signals: [
        { kind: "output_delta", sequence: 0, text: "A" },
      ],
      terminal: {
        status: "completed",
        finish_reason: "stop",
        output: null,
        provider_response_id: null,
        error: null,
      },
    },
  ];
  fake.setGenerateScript(script);

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

  const result = await fake.generate(
    { test: "request" },
    sink,
    new AbortController().signal
  );

  assert.strictEqual(result.status, "failed");
  assert.strictEqual(result.error?.code, "unknown");
});

test("FakeProvider - reset clears state", async () => {
  const fake = new FakeProvider();
  const script: ProviderProbeScript[] = [{ result: {} }];
  fake.setProbeScript(script);

  await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    new AbortController().signal
  );

  assert.strictEqual(fake.getCalls().length, 1);

  fake.reset();

  assert.strictEqual(fake.getCalls().length, 0);
});

test("FakeProvider - deterministic and pure with same script", async () => {
  const fake = new FakeProvider();
  const script: ProviderProbeScript[] = [
    { result: { test: "value" } },
    { result: { test: "value" } },
  ];
  fake.setProbeScript(script);

  const result1 = await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    new AbortController().signal
  );

  const result2 = await fake.probe(
    { provider_id: "test", endpoint_profile: "default", model_id: "gpt-4" },
    new AbortController().signal
  );

  assert.deepStrictEqual(result1, result2);
});
