import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const schemaRoot = join(root, "v1");
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

async function loadJson(path) {
  const source = await readFile(path, "utf8");
  try {
    return JSON.parse(source);
  } catch (error) {
    errors.push("JSON inválido em " + path + ": " + error.message);
    return null;
  }
}

function walkRefs(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walkRefs(item, visit);
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (typeof value.$ref === "string") visit(value.$ref);
  for (const child of Object.values(value)) walkRefs(child, visit);
}

function hasLoneSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function canonicalize(value, ancestors = new Set()) {
  if (value === null) return "null";
  if (typeof value === "string") {
    if (hasLoneSurrogate(value)) throw new TypeError("lone surrogate");
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non-finite number");
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value !== "object") throw new TypeError("non-JSON value");
  if (ancestors.has(value)) throw new TypeError("cycle");
  if (typeof value.toJSON === "function") throw new TypeError("toJSON");

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) throw new TypeError("sparse array");
    }
    return "[" + value.map((item) => canonicalize(item, nextAncestors)).join(",") + "]";
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("custom prototype");
  }

  const members = [];
  for (const key of Object.keys(value).sort()) {
    if (hasLoneSurrogate(key)) throw new TypeError("lone surrogate key");
    members.push(JSON.stringify(key) + ":" + canonicalize(value[key], nextAncestors));
  }
  return "{" + members.join(",") + "}";
}

function fingerprint(purpose, canonical) {
  if (!/^[a-z0-9-]+$/.test(purpose)) throw new TypeError("invalid purpose");
  const header = "IDEIA-P0|jcs-sha256-v1|" + purpose + "\n";
  return "sha256:" + createHash("sha256").update(header, "utf8").update(canonical, "utf8").digest("hex");
}

const schemaFiles = (await readdir(schemaRoot))
  .filter((name) => name.endsWith(".schema.json"))
  .sort();
const schemaNames = new Set(schemaFiles);
const schemaIds = new Set();
const schemaById = new Map();
let schemaCount = 0;
let refCount = 0;

for (const file of schemaFiles) {
  const path = join(schemaRoot, file);
  const schema = await loadJson(path);
  if (schema === null) continue;
  schemaCount += 1;
  check(
    schema.$schema === "https://json-schema.org/draft/2020-12/schema",
    file + " não declara JSON Schema 2020-12"
  );
  check(typeof schema.$id === "string", file + " não possui $id");
  if (typeof schema.$id === "string") {
    check(!schemaIds.has(schema.$id), "$id duplicado: " + schema.$id);
    schemaIds.add(schema.$id);
    schemaById.set(schema.$id, schema);
  }
  if (file !== "_defs.schema.json") {
    check(schema.type === "object", file + " não possui root object");
    check(schema.additionalProperties === false, file + " não fecha propriedades do root");
    check(
      typeof schema.properties?.contract?.const === "string",
      file + " não fixa contract"
    );
  }
  walkRefs(schema, (ref) => {
    refCount += 1;
    if (ref.startsWith("#")) return;
    const target = ref.split("#", 1)[0];
    check(schemaNames.has(target), file + " referencia schema local ausente: " + ref);
  });
}

const eventRegistry = await loadJson(join(root, "event-registry-v1.json"));
let eventTypeCount = 0;
if (eventRegistry !== null) {
  check(eventRegistry.contract === "ideia.event-registry/1", "event registry contract inválido");
  check(eventRegistry.registry_version === "1.0.0-rc.7", "event registry version inesperada");
  check(Array.isArray(eventRegistry.events), "event registry events não é array");
  const eventTypes = new Set();
  const stateAffectingEvents = new Set(["task.created", "task.transitioned"]);
  const allowedEntryKeys = new Set([
    "event_type", "payload_contract", "schema_id", "payload_constraints", "affects_task_state"
  ]);
  const requiredPayloadConstraints = new Map([
    ["provider.completed", { execution_status: ["completed"] }],
    ["provider.failed", { execution_status: ["failed", "cancelled", "timed_out", "ambiguous"] }],
    ["artifact.published", { lifecycle: ["committed"] }]
  ]);
  for (const entry of eventRegistry.events ?? []) {
    eventTypeCount += 1;
    for (const key of Object.keys(entry)) {
      check(allowedEntryKeys.has(key), entry.event_type + " possui campo desconhecido no registry: " + key);
    }
    check(
      typeof entry.event_type === "string" && /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/.test(entry.event_type),
      "event_type inválido: " + String(entry.event_type)
    );
    check(
      typeof entry.payload_contract === "string" && /^ideia\.[a-z0-9-]+\/1$/.test(entry.payload_contract),
      entry.event_type + " possui payload_contract inválido"
    );
    check(!eventTypes.has(entry.event_type), "event_type duplicado: " + entry.event_type);
    eventTypes.add(entry.event_type);
    const payloadSchema = schemaById.get(entry.schema_id);
    check(payloadSchema !== undefined, "schema de evento ausente: " + entry.schema_id);
    if (payloadSchema !== undefined) {
      check(
        payloadSchema.properties?.contract?.const === entry.payload_contract,
        entry.event_type + " diverge do contract do schema"
      );
    }
    check(
      typeof entry.affects_task_state === "boolean",
      entry.event_type + " não declara affects_task_state boolean"
    );
    const constraints = entry.payload_constraints ?? {};
    check(
      constraints !== null && typeof constraints === "object" && !Array.isArray(constraints),
      entry.event_type + " possui payload_constraints inválido"
    );
    if (constraints !== null && typeof constraints === "object" && !Array.isArray(constraints)) {
      for (const [propertyName, allowedValues] of Object.entries(constraints)) {
        const propertySchema = payloadSchema?.properties?.[propertyName];
        check(propertySchema !== undefined, entry.event_type + " restringe propriedade ausente: " + propertyName);
        check(
          Array.isArray(allowedValues) && allowedValues.length > 0,
          entry.event_type + " possui restrição vazia: " + propertyName
        );
        if (Array.isArray(allowedValues)) {
          check(
            new Set(allowedValues.map((value) => JSON.stringify(value))).size === allowedValues.length,
            entry.event_type + " possui valor duplicado em " + propertyName
          );
          for (const allowed of allowedValues) {
            check(
              allowed === null || ["string", "number", "boolean"].includes(typeof allowed),
              entry.event_type + " possui valor composto em " + propertyName
            );
          }
        }
        if (Array.isArray(allowedValues) && Array.isArray(propertySchema?.enum)) {
          for (const allowed of allowedValues) {
            check(
              propertySchema.enum.some((candidate) => Object.is(candidate, allowed)),
              entry.event_type + " permite valor fora do schema em " + propertyName
            );
          }
        }
      }
    }
    const expectedConstraints = requiredPayloadConstraints.get(entry.event_type);
    if (expectedConstraints !== undefined) {
      check(
        JSON.stringify(constraints) === JSON.stringify(expectedConstraints),
        entry.event_type + " diverge das restrições obrigatórias"
      );
    }
    check(
      entry.affects_task_state === stateAffectingEvents.has(entry.event_type),
      entry.event_type + " diverge da autoridade de projeção"
    );
  }
  check(eventTypeCount === 33, "registry rc.7 deveria conter 33 tipos");
}

const vectors = await loadJson(join(root, "canonicalization", "vectors.json"));
const requiredPurposes = new Set([
  "manifest", "config", "provider-capabilities", "governance-candidate", "governance-bundle",
  "evaluation-report", "plan", "policy", "payload", "event", "context-query",
  "context-item", "context-package", "sandbox-profile", "capability-grant",
  "tool-request", "tool-result", "provider-request", "provider-result",
  "approval-request", "verification", "artifact-metadata", "recovery-report",
  "price-book", "budget-set", "budget-reservation", "budget-ledger", "schema"
]);
let vectorCount = 0;
if (vectors !== null) {
  const vectorIds = new Set();
  const coveredPurposes = new Set();
  for (const vector of vectors.vectors ?? []) {
    vectorCount += 1;
    check(!vectorIds.has(vector.id), "vector canônico duplicado: " + vector.id);
    vectorIds.add(vector.id);
    coveredPurposes.add(vector.purpose);
    check(requiredPurposes.has(vector.purpose), "purpose não autorizado: " + vector.purpose);
    try {
      const input = Object.hasOwn(vector, "input_json")
        ? JSON.parse(vector.input_json)
        : vector.input;
      const canonical = canonicalize(input);
      check(
        canonical === vector.expected_canonical,
        vector.id + " canonical diverge"
      );
      check(
        fingerprint(vector.purpose, canonical) === vector.expected_digest,
        vector.id + " digest diverge"
      );
    } catch (error) {
      errors.push(vector.id + " falhou: " + error.message);
    }
  }
  for (const purpose of requiredPurposes) {
    check(coveredPurposes.has(purpose), "purpose sem vetor: " + purpose);
  }
}

const idVectors = await loadJson(join(root, "vectors", "id-vectors.json"));
const prefixByType = new Map([
  ["ProjectId", "prj"],
  ["WorkspaceId", "wsp"],
  ["PrincipalId", "prn"],
  ["TaskId", "tsk"],
  ["ManifestId", "mft"],
  ["PlanId", "pln"],
  ["StepId", "stp"],
  ["EventId", "evt"],
  ["CorrelationId", "cor"],
  ["CallId", "cal"],
  ["PolicyDecisionId", "pdc"],
  ["ApprovalId", "apr"],
  ["ApprovalUseId", "apu"],
  ["Nonce", "non"],
  ["EffectIntentId", "efi"],
  ["VerificationId", "vrf"],
  ["UsageId", "use"],
  ["CriterionId", "crt"],
  ["AttemptId", "atm"],
  ["ProviderRequestId", "pvr"],
  ["ContextQueryId", "cxq"],
  ["ContextItemId", "cxi"],
  ["ContextPackageId", "cxp"],
  ["ArtifactId", "art"],
  ["BudgetSetId", "bgt"],
  ["BudgetReservationId", "brs"],
  ["PriceBookId", "pbk"],
  ["CapabilityGrantId", "cpg"],
  ["RecoveryRunId", "rcv"]
]);
let idVectorCount = 0;
if (idVectors !== null) {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  for (const vector of idVectors.valid ?? []) {
    idVectorCount += 1;
    const prefix = prefixByType.get(vector.type);
    check(typeof prefix === "string", "tipo de ID válido desconhecido: " + vector.type);
    if (typeof prefix === "string") {
      check(
        new RegExp("^" + prefix + "_" + uuid + "$").test(vector.value),
        "ID deveria ser válido: " + vector.value
      );
    }
  }
  for (const vector of idVectors.invalid ?? []) {
    idVectorCount += 1;
    const prefix = prefixByType.get(vector.type);
    check(typeof prefix === "string", "tipo de ID inválido desconhecido: " + vector.type);
    if (typeof prefix === "string") {
      check(
        !new RegExp("^" + prefix + "_" + uuid + "$").test(vector.value),
        "ID deveria ser inválido: " + vector.value
      );
    }
    check(
      typeof vector.reason === "string" && vector.reason.length > 0,
      "vetor inválido sem reason"
    );
  }
}

const rejectionVectors = await loadJson(join(root, "canonicalization", "rejections.json"));
let rejectionCount = 0;
if (rejectionVectors !== null) {
  const ids = new Set();
  for (const item of rejectionVectors.cases ?? []) {
    rejectionCount += 1;
    check(!ids.has(item.id), "rejeição duplicada: " + item.id);
    ids.add(item.id);
    check(typeof item.reason === "string" && item.reason.length > 0, item.id + " sem reason");
  }
}

console.log("Schemas JSON:", schemaCount);
console.log("Referências locais:", refCount);
console.log("Tipos de evento:", eventTypeCount);
console.log("Vetores canônicos:", vectorCount);
console.log("Vetores de ID:", idVectorCount);
console.log("Casos de rejeição:", rejectionCount);

if (errors.length > 0) {
  console.error("Falhas:", errors.length);
  for (const error of errors) console.error("- " + error);
  process.exitCode = 1;
} else {
  console.log("Assets estruturais e vetores: OK");
}
