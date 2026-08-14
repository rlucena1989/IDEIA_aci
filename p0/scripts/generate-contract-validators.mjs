/**
 * Generate standalone ESM validators from JSON Schema v1 contracts
 *
 * This script compiles all schemas in contracts/v1 into standalone ESM modules
 * using Ajv 8.20.0 with strict settings.
 */

import Ajv2020 from "ajv/dist/2020.js";
import ajvStandalone from "ajv/dist/standalone/index.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts", "v1");
const OUTPUT_JS = path.join(__dirname, "..", "src", "contracts", "validators.generated.js");
const OUTPUT_DTS = path.join(__dirname, "..", "src", "contracts", "validators.generated.d.ts");
const OUTPUT_MAP = path.join(__dirname, "..", "src", "contracts", "contract-map.generated.json");

const CHECK_MODE = process.argv.includes("--check");

/**
 * Load all schema files from contracts/v1
 */
function loadSchemas() {
  const schemas = [];
  const files = fs.readdirSync(CONTRACTS_DIR);

  for (const file of files) {
    if (!file.endsWith(".schema.json")) {
      continue;
    }

    const filePath = path.join(CONTRACTS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const schema = JSON.parse(content);

    schemas.push(schema);
  }

  return schemas;
}

/**
 * Create Ajv instance with strict P0 settings
 */
function createAjv() {
  return new Ajv2020({
    strict: true,
    strictTuples: true,
    strictNumbers: true,
    validateFormats: false,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    $data: false,
    allErrors: false,
    verbose: false,
    addUsedSchema: false,
    code: { source: true, esm: true },
  });
}

/**
 * Generate standalone code
 */
function generateStandalone(ajv, schemas) {
  const mapping = {};
  for (const schema of schemas) {
    ajv.addSchema(schema);
    if (schema.$id) {
      const match = schema.$id.match(/\/([^/]+)\.schema\.json$/);
      if (match) {
        const name = match[1];
        if (name !== "_defs") {
          const camelCase = name
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("");
          const exportName = `validate${camelCase}`;
          mapping[exportName] = schema.$id;
        }
      }
    }
  }

  let code = ajvStandalone(ajv, mapping);

  // Fix CJS require calls in generated standalone code for runtime helpers
  const imports = [];
  if (code.includes('require("ajv/dist/runtime/ucs2length")')) {
    imports.push('import ucs2lengthModule from "ajv/dist/runtime/ucs2length.js"; const ucs2length = ucs2lengthModule.default?.default || ucs2lengthModule.default || ucs2lengthModule;');
    code = code.replaceAll('require("ajv/dist/runtime/ucs2length").default', 'ucs2length')
               .replaceAll('require("ajv/dist/runtime/ucs2length")', 'ucs2length');
  }
  if (code.includes('require("ajv/dist/runtime/equal")')) {
    imports.push('import equalModule from "ajv/dist/runtime/equal.js"; const equal = equalModule.default?.default || equalModule.default || equalModule;');
    code = code.replaceAll('require("ajv/dist/runtime/equal").default', 'equal')
               .replaceAll('require("ajv/dist/runtime/equal")', 'equal');
  }

  if (imports.length > 0) {
    code = imports.join("\n") + "\n" + code;
  }

  return code;
}

/**
 * Generate contract map file
 */
function generateContractMap(schemas) {
  const map = {};
  const exportMap = {};
  const ids = [];

  for (const schema of schemas) {
    const match = schema.$id?.match(/\/([^/]+)\.schema\.json$/);
    if (match) {
      const name = match[1];
      // Skip _defs as it's not a contract
      if (name === "_defs") continue;
      const camelCase = name
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
      const exportName = `validate${camelCase}`;
      map[`ideia.${name}/1`] = schema.$id;
      exportMap[`ideia.${name}/1`] = exportName;
      ids.push(`ideia.${name}/1`);
    }
  }

  return JSON.stringify({ contractIdToSchemaUri: map, contractIdToValidatorName: exportMap, contractIds: ids }, null, 2);
}

/**
 * Generate TypeScript declarations
 */
function generateDeclarations(schemas) {
  const contractNames = schemas.map((s) => {
    const match = s.$id?.match(/\/([^/]+)\.schema\.json$/);
    return match ? match[1] : null;
  }).filter(Boolean);

  const lines = [
    "// Auto-generated TypeScript declarations for contract validators",
    "// DO NOT EDIT - regenerate with npm run generate-validators",
    "",
    "import type { ValidateFunction } from 'ajv';",
    "",
    ...contractNames.map((name) => {
      const camelCase = name.split("-").map((part, i) =>
        i === 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part.charAt(0).toUpperCase() + part.slice(1)
      ).join("");
      return `export declare const validate${camelCase}: ValidateFunction<unknown>;`;
    }),
  ];

  return lines.join("\n");
}

/**
 * Main function
 */
function main() {
  console.log("Loading schemas from", CONTRACTS_DIR);
  const schemas = loadSchemas();
  console.log(`Loaded ${schemas.length} schemas`);

  console.log("Creating Ajv instance with strict settings");
  const ajv = createAjv();

  console.log("Compiling validators");
  const standaloneCode = generateStandalone(ajv, schemas);

  console.log("Generating TypeScript declarations");
  const declarations = generateDeclarations(schemas);

  console.log("Generating contract map");
  const contractMap = generateContractMap(schemas);

  if (CHECK_MODE) {
    console.log("Checking for drift...");
    const existingJs = fs.existsSync(OUTPUT_JS)
      ? fs.readFileSync(OUTPUT_JS, "utf-8")
      : "";
    const existingDts = fs.existsSync(OUTPUT_DTS)
      ? fs.readFileSync(OUTPUT_DTS, "utf-8")
      : "";
    const existingMap = fs.existsSync(OUTPUT_MAP)
      ? fs.readFileSync(OUTPUT_MAP, "utf-8")
      : "";

    if (existingJs !== standaloneCode || existingDts !== declarations || existingMap !== contractMap) {
      console.error("ERROR: Generated code differs from existing files");
      console.error("Run 'npm run generate-validators' to update");
      process.exit(1);
    }

    console.log("No drift detected");
    return;
  }

  console.log("Writing", OUTPUT_JS);
  fs.writeFileSync(OUTPUT_JS, standaloneCode);

  console.log("Writing", OUTPUT_DTS);
  fs.writeFileSync(OUTPUT_DTS, declarations);

  console.log("Writing", OUTPUT_MAP);
  fs.writeFileSync(OUTPUT_MAP, contractMap);

  console.log("Done");
}

main();
