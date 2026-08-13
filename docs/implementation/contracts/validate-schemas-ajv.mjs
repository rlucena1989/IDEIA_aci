import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = process.argv[2];
if (typeof runtimeRoot !== "string" || runtimeRoot.length === 0) {
  console.error("Usage: node validate-schemas-ajv.mjs <directory-containing-ajv-package>");
  process.exit(2);
}

const requireFromRuntime = createRequire(join(resolve(runtimeRoot), "package.json"));
const Ajv2020 = requireFromRuntime("ajv/dist/2020.js").default;
const root = dirname(fileURLToPath(import.meta.url));
const schemaRoot = join(root, "v1");
const names = (await readdir(schemaRoot))
  .filter((name) => name.endsWith(".schema.json"))
  .sort();

const schemas = [];
for (const name of names) {
  schemas.push(JSON.parse(await readFile(join(schemaRoot, name), "utf8")));
}

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
  validateFormats: false,
  loadSchema: undefined
});

for (const schema of schemas) ajv.addSchema(schema);

let compiled = 0;
for (const schema of schemas) {
  if (schema.$id.endsWith("/_defs.schema.json")) continue;
  const validate = ajv.getSchema(schema.$id);
  if (typeof validate !== "function") {
    throw new Error("Schema not compiled: " + schema.$id);
  }
  compiled += 1;
}

console.log("Ajv version:", requireFromRuntime("ajv/package.json").version);
console.log("Schemas loaded:", schemas.length);
console.log("Instance schemas compiled:", compiled);
console.log("Strict compile: OK");
