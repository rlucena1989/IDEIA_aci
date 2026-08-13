import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Validador formal de schema JSON para resultados de benchmark
 * 
 * Este script valida arquivos de resultados do benchmark contra o schema definido
 * em schema_resultados.md. É extensível para acomodar evoluções do schema.
 * 
 * Uso:
 *   node validate_benchmark.mjs
 * 
 * Saída:
 *   - Lista de arquivos validados
 *   - Erros de schema por arquivo
 *   - Status de cobertura T01-T10
 *   - Código de saída: 0 (sucesso) ou 1 (falha)
 */

// Schema JSON formal (baseado em schema_resultados.md)
const SCHEMA = {
  type: "object",
  required: [
    "runId",
    "taskId", 
    "tool",
    "toolVersion",
    "model",
    "provider",
    "baseCommit",
    "workspace",
    "startedAt",
    "finishedAt",
    "status",
    "humanInterventions",
    "toolCalls",
    "retries",
    "inputTokens",
    "outputTokens",
    "cost",
    "testsBefore",
    "testsAfter",
    "acceptanceTests",
    "lintErrors",
    "securityFindings",
    "filesChanged",
    "outOfScopeChanges",
    "rollbackPerformed",
    "reviewScore",
    "notes"
  ],
  properties: {
    runId: { type: "string", pattern: "^[a-f0-9-]{36}$" },
    taskId: { type: "string", pattern: "^T(0[1-9]|10)$" },
    tool: { type: "string", enum: ["OpenCode", "Freebuff Desktop", "OpenCode R2", "Freebuff R2", "OpenCode R3"] },
    toolVersion: { type: "string" },
    model: { type: "string" },
    provider: { type: "string" },
    baseCommit: { type: "string", pattern: "^[a-f0-9]{7,40}$" },
    workspace: { type: "string", enum: ["isolated-copy"] },
    startedAt: { type: "string", format: "date-time" },
    finishedAt: { type: "string", format: "date-time" },
    status: { type: "string", enum: ["success", "partial", "failed", "rolled_back"] },
    humanInterventions: { type: "integer", minimum: 0 },
    toolCalls: { type: "integer", minimum: 0 },
    retries: { type: "integer", minimum: 0 },
    inputTokens: { type: "integer", minimum: 0 },
    outputTokens: { type: "integer", minimum: 0 },
    cost: {
      type: "object",
      required: ["amount", "currency"],
      properties: {
        amount: { type: "number", minimum: 0 },
        currency: { type: "string", enum: ["USD"] }
      }
    },
    testsBefore: {
      type: "object",
      required: ["passed", "failed"],
      properties: {
        passed: { type: "integer", minimum: 0 },
        failed: { type: "integer", minimum: 0 }
      }
    },
    testsAfter: {
      type: "object",
      required: ["passed", "failed"],
      properties: {
        passed: { type: "integer", minimum: 0 },
        failed: { type: "integer", minimum: 0 }
      }
    },
    acceptanceTests: {
      type: "object",
      required: ["passed", "failed"],
      properties: {
        passed: { type: "integer", minimum: 0 },
        failed: { type: "integer", minimum: 0 }
      }
    },
    lintErrors: { type: "integer", minimum: 0 },
    securityFindings: {
      type: "object",
      required: ["critical", "high", "medium", "low"],
      properties: {
        critical: { type: "integer", minimum: 0 },
        high: { type: "integer", minimum: 0 },
        medium: { type: "integer", minimum: 0 },
        low: { type: "integer", minimum: 0 }
      }
    },
    filesChanged: {
      type: "array",
      items: { type: "string" }
    },
    outOfScopeChanges: {
      type: "array",
      items: { type: "string" }
    },
    rollbackPerformed: { type: "boolean" },
    reviewScore: { type: "integer", minimum: 0, maximum: 100 },
    notes: { type: "string" }
  }
};

// Campos opcionais para telemetria extendida (rodadas 2+)
const OPTIONAL_TELEMETRY_FIELDS = [
  "durationMs",
  "blocks",
  "providerTokens",
  "providerModels",
  "round"
];

/**
 * Valida um valor contra uma definição de propriedade do schema
 */
function validateProperty(value, propDef, path) {
  const errors = [];

  // Type check
  if (propDef.type && typeof value !== propDef.type) {
    errors.push(`${path}: expected type ${propDef.type}, got ${typeof value}`);
    return errors;
  }

  // Enum check
  if (propDef.enum && !propDef.enum.includes(value)) {
    errors.push(`${path}: expected one of ${propDef.enum.join(", ")}, got ${value}`);
  }

  // Pattern check
  if (propDef.pattern && !new RegExp(propDef.pattern).test(value)) {
    errors.push(`${path}: does not match pattern ${propDef.pattern}`);
  }

  // Range checks
  if (propDef.minimum !== undefined && value < propDef.minimum) {
    errors.push(`${path}: must be >= ${propDef.minimum}, got ${value}`);
  }
  if (propDef.maximum !== undefined && value > propDef.maximum) {
    errors.push(`${path}: must be <= ${propDef.maximum}, got ${value}`);
  }

  // Object validation
  if (propDef.type === "object" && propDef.properties) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`${path}: expected object, got ${typeof value}`);
      return errors;
    }

    // Required fields
    if (propDef.required) {
      for (const field of propDef.required) {
        if (!(field in value)) {
          errors.push(`${path}.${field}: missing required field`);
        }
      }
    }

    // Property validation
    for (const [key, keyDef] of Object.entries(propDef.properties)) {
      if (key in value) {
        errors.push(...validateProperty(value[key], keyDef, `${path}.${key}`));
      }
    }
  }

  // Array validation
  if (propDef.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array, got ${typeof value}`);
      return errors;
    }

    if (propDef.items) {
      value.forEach((item, index) => {
        errors.push(...validateProperty(item, propDef.items, `${path}[${index}]`));
      });
    }
  }

  return errors;
}

/**
 * Valida um objeto de resultado completo contra o schema
 */
function validateResult(result, filename) {
  const errors = [];

  // Check required fields
  for (const field of SCHEMA.required) {
    if (!(field in result)) {
      errors.push(`${filename}: missing required field '${field}'`);
    }
  }

  // Validate each property
  for (const [key, value] of Object.entries(result)) {
    const propDef = SCHEMA.properties[key];
    if (propDef) {
      errors.push(...validateProperty(value, propDef, `${filename}.${key}`));
    } else if (!OPTIONAL_TELEMETRY_FIELDS.includes(key)) {
      errors.push(`${filename}: unexpected field '${key}' (not in schema)`);
    }
  }

  // Business logic validations
  if (result.startedAt && result.finishedAt) {
    const start = new Date(result.startedAt);
    const finish = new Date(result.finishedAt);
    if (finish < start) {
      errors.push(`${filename}: finishedAt must be after startedAt`);
    }
  }

  if (result.status === "success" && result.acceptanceTests?.failed > 0) {
    errors.push(`${filename}: status 'success' but acceptanceTests.failed > 0`);
  }

  if (result.securityFindings?.critical > 0 && result.status === "success") {
    errors.push(`${filename}: status 'success' but critical security findings present`);
  }

  if (result.outOfScopeChanges?.length > 0 && result.status === "success") {
    errors.push(`${filename}: status 'success' but outOfScopeChanges present`);
  }

  return errors;
}

// Main execution
const root = new URL("./", import.meta.url);
const files = (await readdir(root)).filter((file) => /^results_T\d+_(opencode|freebuff)(_r\d+)?\.json$/.test(file));
const allErrors = [];
const runs = [];

console.log("=== Benchmark Schema Validator ===\n");

for (const file of files) {
  let result;
  try {
    result = JSON.parse(await readFile(new URL(file, root), "utf8"));
  } catch (error) {
    allErrors.push(`${file}: invalid JSON (${error.message})`);
    continue;
  }

  const errors = validateResult(result, file);
  allErrors.push(...errors);
  
  if (errors.length === 0) {
    runs.push({ 
      file, 
      taskId: result.taskId, 
      tool: result.tool,
      round: result.round || 1 
    });
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file}`);
  }
}

// Coverage check
console.log("\n=== Coverage Check ===");
const expectedTasks = new Set(Array.from({ length: 10 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`));
const expectedTools = ["OpenCode", "Freebuff Desktop"];

for (const taskId of expectedTasks) {
  for (const tool of expectedTools) {
    const hasRun = runs.some(r => r.taskId === taskId && r.tool === tool);
    if (!hasRun) {
      allErrors.push(`missing structured result: ${taskId}/${tool}`);
      console.log(`✗ ${taskId}/${tool}`);
    } else {
      console.log(`✓ ${taskId}/${tool}`);
    }
  }
}

// Summary
console.log("\n=== Summary ===");
console.log(`JSON files found: ${files.length}`);
console.log(`Valid runs: ${runs.length}`);
console.log(`Errors: ${allErrors.length}`);

if (allErrors.length > 0) {
  console.log("\n=== Errors ===");
  for (const error of allErrors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("\n✓ Schema validation and T01–T10 coverage: OK");
}
