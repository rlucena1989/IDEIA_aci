import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [runtimeRoot, schemaFileName, instancePath] = process.argv.slice(2);
if (!runtimeRoot || !schemaFileName || !instancePath) {
  console.error("Usage: node validate-instance-ajv.mjs <ajv-root> <schema-file-name> <instance-json>");
  process.exit(2);
}

const requireFromRuntime = createRequire(join(resolve(runtimeRoot), "package.json"));
const Ajv2020 = requireFromRuntime("ajv/dist/2020.js").default;
const root = dirname(fileURLToPath(import.meta.url));
const schemaRoot = join(root, "v1");
const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
  validateFormats: false,
  loadSchema: undefined
});

for (const name of (await readdir(schemaRoot)).filter((item) => item.endsWith(".schema.json"))) {
  ajv.addSchema(JSON.parse(await readFile(join(schemaRoot, name), "utf8")));
}

const schema = JSON.parse(await readFile(join(schemaRoot, schemaFileName), "utf8"));
const instance = JSON.parse(await readFile(resolve(instancePath), "utf8"));
const validate = ajv.getSchema(schema.$id);
if (typeof validate !== "function") throw new Error("Schema not compiled: " + schema.$id);

if (!validate(instance)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log("Instance valid:", resolve(instancePath));
console.log("Schema:", schema.$id);
