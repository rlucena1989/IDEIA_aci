import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

function hasLoneSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return true;
  }
  return false;
}

function canonicalize(value) {
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
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (value === null || typeof value !== "object") throw new TypeError("non-JSON value");
  return "{" + Object.keys(value).sort().map((key) => {
    if (hasLoneSurrogate(key)) throw new TypeError("lone surrogate key");
    return JSON.stringify(key) + ":" + canonicalize(value[key]);
  }).join(",") + "}";
}

function fingerprint(purpose, canonical) {
  const header = "IDEIA-P0|jcs-sha256-v1|" + purpose + "\n";
  return "sha256:" + createHash("sha256").update(header, "utf8").update(canonical, "utf8").digest("hex");
}

if (process.argv[2] === "--purposes") {
  const purposes = process.argv.slice(3);
  const input = { profile: "domain-separation", version: 1 };
  const canonical = canonicalize(input);
  const output = purposes.map((purpose, index) => ({
    id: "JCS-DOM-" + String(index + 1).padStart(3, "0"),
    source: "internal-domain-separation",
    purpose,
    input,
    expected_canonical: canonical,
    expected_digest: fingerprint(purpose, canonical)
  }));
  console.log(JSON.stringify(output, null, 2));
} else {
  const vectorId = process.argv[2];
  if (!vectorId) throw new Error("Provide vector id or --purposes");
  const document = JSON.parse(await readFile(new URL("./canonicalization/vectors.json", import.meta.url), "utf8"));
  const vector = document.vectors.find((item) => item.id === vectorId);
  if (!vector) throw new Error("Unknown vector: " + vectorId);
  const input = Object.hasOwn(vector, "input_json") ? JSON.parse(vector.input_json) : vector.input;
  const canonical = canonicalize(input);
  console.log(JSON.stringify({ expected_canonical: canonical, expected_digest: fingerprint(vector.purpose, canonical) }, null, 2));
}
