/**
 * Tests for contract validation
 *
 * Tests use node:test and node:assert/strict
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContract,
  UnknownContractError,
  ContractValidationError,
  getContractIds,
} from "../../src/contracts/validate.ts";

test("validateContract - valid task-manifest passes", () => {
  const data = {
    contract: "ideia.task-manifest/1",
    manifest_id: "mft_123e4567-e89b-42d3-a456-426614174000",
    project_id: "prj_123e4567-e89b-42d3-a456-426614174000",
    workspace_id: "wsp_123e4567-e89b-42d3-a456-426614174000",
    principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
    objective: "Fix bug in authentication",
    workspace_root: "/workspace",
    scope: {
      read_paths: ["/workspace/src/"],
      write_paths: ["/workspace/src/"]
    },
    criteria: [
      {
        criterion_id: "crt_123e4567-e89b-42d3-a456-426614174000",
        description: "Code compiles",
        required: true,
        verification: {
          method: "command",
          verifier_id: "compiler",
          verifier_version: "1.0.0"
        }
      }
    ],
    governance: {
      bundle_id: "governance-bundle",
      bundle_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    budget: {
      budget_set_id: "bgt_123e4567-e89b-42d3-a456-426614174000",
      budget_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    timeouts: {
      task_timeout_ms: 300000,
      operation_timeout_ms: 60000,
      cancellation_grace_ms: 5000
    },
    policy: {
      policy_id: "default",
      policy_version: "1.0.0",
      policy_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    provider: {
      provider_id: "openai",
      model_id: "gpt-4",
      config_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    sandbox: {
      profile_id: "default",
      profile_version: "1.0.0",
      profile_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    allowed_tools: [
      {
        tool_id: "editor",
        tool_version: "1.0.0"
      }
    ],
    created_at: "2024-01-01T00:00:00.000Z"
  };

  const result = validateContract("ideia.task-manifest/1", data);
  assert.strictEqual(result, data);
});

test("validateContract - missing required field fails", () => {
  const data = {
    contract: "ideia.task-manifest/1",
    manifest_id: "mft_123e4567-e89b-42d3-a456-426614174000",
    project_id: "prj_123e4567-e89b-42d3-a456-426614174000",
    workspace_id: "wsp_123e4567-e89b-42d3-a456-426614174000",
    principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
    // missing objective
    workspace_root: "/workspace",
    scope: {
      read_paths: ["/workspace/src/"],
      write_paths: ["/workspace/src/"]
    },
    criteria: [
      {
        criterion_id: "crt_123e4567-e89b-42d3-a456-426614174000",
        description: "Code compiles",
        required: true,
        verification: {
          method: "command",
          verifier_id: "compiler",
          verifier_version: "1.0.0"
        }
      }
    ],
    governance: {
      bundle_id: "governance-bundle",
      bundle_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    budget: {
      budget_set_id: "bgt_123e4567-e89b-42d3-a456-426614174000",
      budget_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    timeouts: {
      task_timeout_ms: 300000,
      operation_timeout_ms: 60000,
      cancellation_grace_ms: 5000
    },
    policy: {
      policy_id: "default",
      policy_version: "1.0.0",
      policy_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    provider: {
      provider_id: "openai",
      model_id: "gpt-4",
      config_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    sandbox: {
      profile_id: "default",
      profile_version: "1.0.0",
      profile_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    allowed_tools: [
      {
        tool_id: "editor",
        tool_version: "1.0.0"
      }
    ],
    created_at: "2024-01-01T00:00:00.000Z"
  };

  assert.throws(
    () => validateContract("ideia.task-manifest/1", data),
    (err: Error) => err instanceof ContractValidationError && err.code === "contract.validation.failed"
  );
});

test("validateContract - unknown field fails", () => {
  const data = {
    contract: "ideia.task-manifest/1",
    manifest_id: "mft_123e4567-e89b-42d3-a456-426614174000",
    project_id: "prj_123e4567-e89b-42d3-a456-426614174000",
    workspace_id: "wsp_123e4567-e89b-42d3-a456-426614174000",
    principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
    objective: "Fix bug",
    workspace_root: "/workspace",
    scope: {
      read_paths: ["/workspace/src/"],
      write_paths: ["/workspace/src/"]
    },
    criteria: [
      {
        criterion_id: "crt_123e4567-e89b-42d3-a456-426614174000",
        description: "Code compiles",
        required: true,
        verification: {
          method: "command",
          verifier_id: "compiler",
          verifier_version: "1.0.0"
        }
      }
    ],
    governance: {
      bundle_id: "governance-bundle",
      bundle_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    budget: {
      budget_set_id: "bgt_123e4567-e89b-42d3-a456-426614174000",
      budget_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    timeouts: {
      task_timeout_ms: 300000,
      operation_timeout_ms: 60000,
      cancellation_grace_ms: 5000
    },
    policy: {
      policy_id: "default",
      policy_version: "1.0.0",
      policy_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    provider: {
      provider_id: "openai",
      model_id: "gpt-4",
      config_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    sandbox: {
      profile_id: "default",
      profile_version: "1.0.0",
      profile_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    allowed_tools: [
      {
        tool_id: "editor",
        tool_version: "1.0.0"
      }
    ],
    created_at: "2024-01-01T00:00:00.000Z",
    unknown_field: "should fail"
  };

  assert.throws(
    () => validateContract("ideia.task-manifest/1", data),
    (err: Error) => err instanceof ContractValidationError && err.code === "contract.validation.failed"
  );
});

test("validateContract - wrong type fails", () => {
  const data = {
    contract: "ideia.task-manifest/1",
    manifest_id: 123, // should be string
    project_id: "prj_123e4567-e89b-42d3-a456-426614174000",
    workspace_id: "wsp_123e4567-e89b-42d3-a456-426614174000",
    principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
    objective: "Fix bug",
    workspace_root: "/workspace",
    scope: {
      read_paths: ["/workspace/src/"],
      write_paths: ["/workspace/src/"]
    },
    criteria: [
      {
        criterion_id: "crt_123e4567-e89b-42d3-a456-426614174000",
        description: "Code compiles",
        required: true,
        verification: {
          method: "command",
          verifier_id: "compiler",
          verifier_version: "1.0.0"
        }
      }
    ],
    governance: {
      bundle_id: "governance-bundle",
      bundle_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    budget: {
      budget_set_id: "bgt_123e4567-e89b-42d3-a456-426614174000",
      budget_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    timeouts: {
      task_timeout_ms: 300000,
      operation_timeout_ms: 60000,
      cancellation_grace_ms: 5000
    },
    policy: {
      policy_id: "default",
      policy_version: "1.0.0",
      policy_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    provider: {
      provider_id: "openai",
      model_id: "gpt-4",
      config_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    sandbox: {
      profile_id: "default",
      profile_version: "1.0.0",
      profile_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    allowed_tools: [
      {
        tool_id: "editor",
        tool_version: "1.0.0"
      }
    ],
    created_at: "2024-01-01T00:00:00.000Z"
  };

  assert.throws(
    () => validateContract("ideia.task-manifest/1", data),
    (err: Error) => err instanceof ContractValidationError && err.code === "contract.validation.failed"
  );
});

test("validateContract - unknown contract fails", () => {
  const data = { foo: "bar" };

  assert.throws(
    () => validateContract("ideia.unknown/1", data),
    (err: Error) => err instanceof UnknownContractError && err.code === "contract.unknown"
  );
});

test("validateContract - invalid contract ID format fails", () => {
  const data = { foo: "bar" };

  assert.throws(
    () => validateContract("invalid-format", data),
    (err: Error) => err instanceof UnknownContractError && err.code === "contract.unknown"
  );
});

test("validateContract - no coercion occurs", () => {
  const data = {
    contract: "ideia.task-manifest/1",
    manifest_id: "mft_123e4567-e89b-42d3-a456-426614174000",
    project_id: "prj_123e4567-e89b-42d3-a456-426614174000",
    workspace_id: "wsp_123e4567-e89b-42d3-a456-426614174000",
    principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
    objective: "Fix bug",
    workspace_root: "/workspace",
    scope: {
      read_paths: ["/workspace/src/"],
      write_paths: ["/workspace/src/"]
    },
    criteria: [
      {
        criterion_id: "crt_123e4567-e89b-42d3-a456-426614174000",
        description: "Code compiles",
        required: true,
        verification: {
          method: "command",
          verifier_id: "compiler",
          verifier_version: "1.0.0"
        }
      }
    ],
    governance: {
      bundle_id: "governance-bundle",
      bundle_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    budget: {
      budget_set_id: "bgt_123e4567-e89b-42d3-a456-426614174000",
      budget_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    timeouts: {
      task_timeout_ms: "300000", // string instead of number - should fail
      operation_timeout_ms: 60000,
      cancellation_grace_ms: 5000
    },
    policy: {
      policy_id: "default",
      policy_version: "1.0.0",
      policy_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    provider: {
      provider_id: "openai",
      model_id: "gpt-4",
      config_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    sandbox: {
      profile_id: "default",
      profile_version: "1.0.0",
      profile_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    allowed_tools: [
      {
        tool_id: "editor",
        tool_version: "1.0.0"
      }
    ],
    created_at: "2024-01-01T00:00:00.000Z"
  };

  assert.throws(
    () => validateContract("ideia.task-manifest/1", data),
    (err: Error) => err instanceof ContractValidationError && err.code === "contract.validation.failed"
  );
});

test("validateContract - no defaults are added", () => {
  const data = {
    contract: "ideia.task-manifest/1",
    manifest_id: "mft_123e4567-e89b-42d3-a456-426614174000",
    project_id: "prj_123e4567-e89b-42d3-a456-426614174000",
    workspace_id: "wsp_123e4567-e89b-42d3-a456-426614174000",
    principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
    objective: "Fix bug",
    workspace_root: "/workspace",
    scope: {
      read_paths: ["/workspace/src/"],
      write_paths: ["/workspace/src/"]
    },
    criteria: [
      {
        criterion_id: "crt_123e4567-e89b-42d3-a456-426614174000",
        description: "Code compiles",
        required: true,
        verification: {
          method: "command",
          verifier_id: "compiler",
          verifier_version: "1.0.0"
        }
      }
    ],
    governance: {
      bundle_id: "governance-bundle",
      bundle_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    budget: {
      budget_set_id: "bgt_123e4567-e89b-42d3-a456-426614174000",
      budget_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    timeouts: {
      task_timeout_ms: 300000,
      operation_timeout_ms: 60000,
      cancellation_grace_ms: 5000
    },
    policy: {
      policy_id: "default",
      policy_version: "1.0.0",
      policy_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    provider: {
      provider_id: "openai",
      model_id: "gpt-4",
      config_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    sandbox: {
      profile_id: "default",
      profile_version: "1.0.0",
      profile_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    allowed_tools: [
      {
        tool_id: "editor",
        tool_version: "1.0.0"
      }
    ],
    created_at: "2024-01-01T00:00:00.000Z"
  };

  const result = validateContract("ideia.task-manifest/1", data);
  assert.strictEqual(result, data);
  // Verify no extra fields were added
  assert.strictEqual(Object.keys(result).length, Object.keys(data).length);
});

test("validateContract - no additional properties are removed", () => {
  const data = {
    contract: "ideia.task-manifest/1",
    manifest_id: "mft_123e4567-e89b-42d3-a456-426614174000",
    project_id: "prj_123e4567-e89b-42d3-a456-426614174000",
    workspace_id: "wsp_123e4567-e89b-42d3-a456-426614174000",
    principal_id: "prn_123e4567-e89b-42d3-a456-426614174000",
    objective: "Fix bug",
    workspace_root: "/workspace",
    scope: {
      read_paths: ["/workspace/src/"],
      write_paths: ["/workspace/src/"]
    },
    criteria: [
      {
        criterion_id: "crt_123e4567-e89b-42d3-a456-426614174000",
        description: "Code compiles",
        required: true,
        verification: {
          method: "command",
          verifier_id: "compiler",
          verifier_version: "1.0.0"
        }
      }
    ],
    governance: {
      bundle_id: "governance-bundle",
      bundle_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    budget: {
      budget_set_id: "bgt_123e4567-e89b-42d3-a456-426614174000",
      budget_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    timeouts: {
      task_timeout_ms: 300000,
      operation_timeout_ms: 60000,
      cancellation_grace_ms: 5000
    },
    policy: {
      policy_id: "default",
      policy_version: "1.0.0",
      policy_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    provider: {
      provider_id: "openai",
      model_id: "gpt-4",
      config_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    sandbox: {
      profile_id: "default",
      profile_version: "1.0.0",
      profile_fingerprint: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    allowed_tools: [
      {
        tool_id: "editor",
        tool_version: "1.0.0"
      }
    ],
    created_at: "2024-01-01T00:00:00.000Z"
  };

  const result = validateContract("ideia.task-manifest/1", data);
  assert.strictEqual(result, data);
});

test("getContractIds - returns all contract IDs", () => {
  const ids = getContractIds();
  assert.ok(Array.isArray(ids));
  assert.ok(ids.length > 0);
  assert.ok(ids.includes("ideia.task-manifest/1"));
  // _defs is not a contract, it's just common definitions
  assert.ok(!ids.includes("ideia._defs/1"));
});

test("getContractIds - returns readonly array", () => {
  const ids = getContractIds();
  // Since we excluded _defs, we have 44 contracts
  assert.strictEqual(ids.length, 44);
});

test("validateContract - /2 version fails", () => {
  const data = { foo: "bar" };

  assert.throws(
    () => validateContract("ideia.task-manifest/2", data),
    (err: Error) => err instanceof UnknownContractError && err.code === "contract.unknown"
  );
});

test("validateContract - schema URI outside catalog fails", () => {
  const data = { foo: "bar" };

  assert.throws(
    () => validateContract("https://schemas.example.com/schema.json", data),
    (err: Error) => err instanceof UnknownContractError && err.code === "contract.unknown"
  );
});
