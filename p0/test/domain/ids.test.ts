/**
 * Tests for typed IDs
 *
 * Tests use node:test and node:assert/strict.
 *
 * P2-R06: parse/create behavior is driven by the normative vectors in
 * docs/implementation/contracts/vectors/id-vectors.json (29 valid, 10
 * invalid). New vectors are picked up automatically — they are not duplicated
 * in this file. Only the cases that go beyond the vectors (non-string input,
 * cross-type prefix swap) are asserted manually.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  InvalidIdError,
  parseProjectId,
  parseWorkspaceId,
  parsePrincipalId,
  parseTaskId,
  parseManifestId,
  parsePlanId,
  parseStepId,
  parseEventId,
  parseCorrelationId,
  parseCallId,
  parsePolicyDecisionId,
  parseApprovalId,
  parseApprovalUseId,
  parseNonce,
  parseEffectIntentId,
  parseVerificationId,
  parseUsageId,
  parseCriterionId,
  parseAttemptId,
  parseProviderRequestId,
  parseContextQueryId,
  parseContextItemId,
  parseContextPackageId,
  parseArtifactId,
  parseBudgetSetId,
  parseBudgetReservationId,
  parsePriceBookId,
  parseCapabilityGrantId,
  parseRecoveryRunId,
  createProjectId,
  createWorkspaceId,
  createPrincipalId,
  createTaskId,
  createManifestId,
  createPlanId,
  createStepId,
  createEventId,
  createCorrelationId,
  createCallId,
  createPolicyDecisionId,
  createApprovalId,
  createApprovalUseId,
  createNonce,
  createEffectIntentId,
  createVerificationId,
  createUsageId,
  createCriterionId,
  createAttemptId,
  createProviderRequestId,
  createContextQueryId,
  createContextItemId,
  createContextPackageId,
  createArtifactId,
  createBudgetSetId,
  createBudgetReservationId,
  createPriceBookId,
  createCapabilityGrantId,
  createRecoveryRunId,
} from "../../src/domain/ids.ts";
import type { UuidV4Generator } from "../../src/ports/id-generator.ts";

class FakeUuidGenerator implements UuidV4Generator {
  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  generate(): string {
    return this.value;
  }
}

const VECTORS_URL = new URL(
  "../../../docs/implementation/contracts/vectors/id-vectors.json",
  import.meta.url
);

interface IdVector {
  type: string;
  value: string;
  reason?: string;
}

interface IdVectors {
  contract: string;
  valid: IdVector[];
  invalid: IdVector[];
}

const vectors = JSON.parse(readFileSync(VECTORS_URL, "utf8")) as IdVectors;

const parsers: Record<string, (value: unknown) => { value: string }> = {
  ProjectId: parseProjectId,
  WorkspaceId: parseWorkspaceId,
  PrincipalId: parsePrincipalId,
  TaskId: parseTaskId,
  ManifestId: parseManifestId,
  PlanId: parsePlanId,
  StepId: parseStepId,
  EventId: parseEventId,
  CorrelationId: parseCorrelationId,
  CallId: parseCallId,
  PolicyDecisionId: parsePolicyDecisionId,
  ApprovalId: parseApprovalId,
  ApprovalUseId: parseApprovalUseId,
  Nonce: parseNonce,
  EffectIntentId: parseEffectIntentId,
  VerificationId: parseVerificationId,
  UsageId: parseUsageId,
  CriterionId: parseCriterionId,
  AttemptId: parseAttemptId,
  ProviderRequestId: parseProviderRequestId,
  ContextQueryId: parseContextQueryId,
  ContextItemId: parseContextItemId,
  ContextPackageId: parseContextPackageId,
  ArtifactId: parseArtifactId,
  BudgetSetId: parseBudgetSetId,
  BudgetReservationId: parseBudgetReservationId,
  PriceBookId: parsePriceBookId,
  CapabilityGrantId: parseCapabilityGrantId,
  RecoveryRunId: parseRecoveryRunId,
};

const creators: Record<string, (generator: UuidV4Generator) => { value: string }> = {
  ProjectId: createProjectId,
  WorkspaceId: createWorkspaceId,
  PrincipalId: createPrincipalId,
  TaskId: createTaskId,
  ManifestId: createManifestId,
  PlanId: createPlanId,
  StepId: createStepId,
  EventId: createEventId,
  CorrelationId: createCorrelationId,
  CallId: createCallId,
  PolicyDecisionId: createPolicyDecisionId,
  ApprovalId: createApprovalId,
  ApprovalUseId: createApprovalUseId,
  Nonce: createNonce,
  EffectIntentId: createEffectIntentId,
  VerificationId: createVerificationId,
  UsageId: createUsageId,
  CriterionId: createCriterionId,
  AttemptId: createAttemptId,
  ProviderRequestId: createProviderRequestId,
  ContextQueryId: createContextQueryId,
  ContextItemId: createContextItemId,
  ContextPackageId: createContextPackageId,
  ArtifactId: createArtifactId,
  BudgetSetId: createBudgetSetId,
  BudgetReservationId: createBudgetReservationId,
  PriceBookId: createPriceBookId,
  CapabilityGrantId: createCapabilityGrantId,
  RecoveryRunId: createRecoveryRunId,
};

test("id-vectors.json - every valid vector parses and round-trips its value", () => {
  assert.ok(vectors.valid.length >= 1, "vector file has no valid cases");
  for (const vector of vectors.valid) {
    const parser = parsers[vector.type];
    assert.ok(parser, `no parser registered for valid vector type "${vector.type}"`);
    const id = parser(vector.value);
    assert.strictEqual(id.value, vector.value, `value mismatch for ${vector.type}`);
  }
});

test("id-vectors.json - every invalid vector throws InvalidIdError", () => {
  assert.ok(vectors.invalid.length >= 1, "vector file has no invalid cases");
  for (const vector of vectors.invalid) {
    const parser = parsers[vector.type];
    assert.ok(parser, `no parser registered for invalid vector type "${vector.type}"`);
    assert.throws(
      () => parser(vector.value),
      (err: Error) => err instanceof InvalidIdError && err.code === "invalid.id",
      `expected InvalidIdError for ${vector.type}: ${vector.reason ?? "no reason given"}`
    );
  }
});

test("id-vectors.json - valid vectors cover every registered parser type", () => {
  const coveredTypes = new Set(vectors.valid.map((vector) => vector.type));
  const parserTypes = Object.keys(parsers);
  assert.strictEqual(
    coveredTypes.size,
    parserTypes.length,
    "every parser type must appear at least once in the valid vectors"
  );
  for (const type of parserTypes) {
    assert.ok(coveredTypes.has(type), `missing valid vector for "${type}"`);
  }
});

test("create* - every creator produces the canonical value from the vectors", () => {
  const generator = new FakeUuidGenerator("123e4567-e89b-42d3-a456-426614174000");
  const byType = new Map(vectors.valid.map((vector) => [vector.type, vector.value]));
  for (const [type, create] of Object.entries(creators)) {
    const expected = byType.get(type);
    assert.ok(expected, `no valid vector for "${type}"`);
    assert.strictEqual(create(generator).value, expected, `unexpected value for ${type}`);
  }
});

test("create* - invalid UUID from generator throws InvalidIdError", () => {
  const generator = new FakeUuidGenerator("invalid-uuid");
  for (const create of Object.values(creators)) {
    assert.throws(
      () => create(generator),
      (err: Error) => err instanceof InvalidIdError && err.code === "invalid.id"
    );
  }
});

test("parse* - non-string input fails (beyond vector coverage)", () => {
  for (const parser of Object.values(parsers)) {
    assert.throws(
      () => parser(123),
      (err: Error) => err instanceof InvalidIdError && err.code === "invalid.id"
    );
  }
});

test("prefix swapped between two valid IDs fails (beyond vector coverage)", () => {
  const taskId = parseTaskId("tsk_123e4567-e89b-42d3-a456-426614174000");
  assert.throws(
    () => parseEventId(taskId.value),
    (err: Error) => err instanceof InvalidIdError && err.code === "invalid.id"
  );
});
