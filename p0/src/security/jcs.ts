/**
 * RFC 8785 JSON Canonicalization Scheme (WP-04).
 *
 * assertCanonicalizable rejects values that would lose identity before
 * hashing (NaN, Infinity, BigInt, undefined, Symbol, Function, cycles,
 * sparse arrays, extra array properties, accessors, non-enumerable
 * properties, Symbol keys, toJSON, custom prototypes and lone surrogates).
 * canonicalizeJcs serializes per RFC 8785: keys sorted by UTF-16 code units
 * with the default (locale-independent) sort, arrays in order, numbers via
 * ECMAScript Number::toString, strings with minimal escapes (control
 * characters U+0000-U+001F and C1 U+007F-U+009F are escaped, matching the
 * normative vectors). The input is never mutated.
 */

/** Value rejected before canonicalization (code json.not_canonicalizable). */
export class CanonicalizableError extends Error {
  readonly code = "json.not_canonicalizable";
  readonly reason: string;

  constructor(reason: string) {
    super(`valor não canonicalizável: ${reason}`);
    this.name = "CanonicalizableError";
    this.reason = reason;
  }
}

function hasLoneSurrogate(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = i + 1 < value.length ? value.charCodeAt(i + 1) : 0;
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      i += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function assertNoAccessorsOrHidden(obj: object, skipLength: boolean): void {
  for (const name of Object.getOwnPropertyNames(obj)) {
    if (skipLength && name === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(obj, name)!;
    if (typeof descriptor.get === "function" || typeof descriptor.set === "function") {
      throw new CanonicalizableError("accessor");
    }
    if (!descriptor.enumerable) {
      throw new CanonicalizableError("propriedade não enumerável");
    }
  }
  if (Object.getOwnPropertySymbols(obj).length > 0) {
    throw new CanonicalizableError("chave Symbol");
  }
}

/**
 * Verifies the value is a plain JSON value (or null) per the ADR-004 input
 * rules. Throws CanonicalizableError otherwise. Does not mutate the input.
 */
export function assertCanonicalizable(value: unknown, seen: WeakSet<object> = new WeakSet()): void {
  if (value === null) return;
  if (typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new CanonicalizableError("número não finito");
    return;
  }
  if (typeof value === "string") {
    if (hasLoneSurrogate(value)) throw new CanonicalizableError("lone surrogate");
    return;
  }
  if (typeof value === "bigint") throw new CanonicalizableError("bigint");
  if (typeof value === "undefined") throw new CanonicalizableError("undefined");
  if (typeof value === "symbol") throw new CanonicalizableError("symbol");
  if (typeof value === "function") throw new CanonicalizableError("function");

  const obj = value as object;
  if (Object.prototype.hasOwnProperty.call(obj, "toJSON")) {
    throw new CanonicalizableError("toJSON");
  }
  if (seen.has(obj)) throw new CanonicalizableError("ciclo");
  seen.add(obj);

  if (Array.isArray(obj)) {
    const arr = obj as unknown[];
    if (Object.getPrototypeOf(arr) !== Array.prototype) {
      throw new CanonicalizableError("protótipo customizado");
    }
    for (let i = 0; i < arr.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(arr, i)) {
        throw new CanonicalizableError("array esparso");
      }
      const descriptor = Object.getOwnPropertyDescriptor(arr, String(i))!;
      if (typeof descriptor.get === "function" || typeof descriptor.set === "function") {
        throw new CanonicalizableError("accessor");
      }
    }
    for (const name of Object.getOwnPropertyNames(arr)) {
      if (name === "length") continue;
      if (!/^(0|[1-9][0-9]*)$/.test(name) || Number(name) >= arr.length) {
        throw new CanonicalizableError("propriedade extra em array");
      }
    }
    assertNoAccessorsOrHidden(arr, true);
    for (const item of arr) assertCanonicalizable(item, seen);
    return;
  }

  const proto = Object.getPrototypeOf(obj);
  if (proto !== Object.prototype && proto !== null) {
    throw new CanonicalizableError("protótipo customizado");
  }
  assertNoAccessorsOrHidden(obj, false);
  for (const key of Object.keys(obj)) {
    assertCanonicalizable((obj as Record<string, unknown>)[key], seen);
  }
}

/**
 * Escapes a string per RFC 8785: `"` and `\` escaped, and control
 * characters U+0000-U+001F with shortest escapes (\b \t \n \f \r or
 * \u00XX). Everything else stays raw (UTF-8), including C1 controls
 * U+007F-U+009F — matching the normative vector JCS-P0-003 (RFC 8785
 * 3.2.3), whose canonical keeps U+0080 unescaped.
 */
function serializeString(value: string): string {
  let out = '"';
  for (const ch of value) {
    const code = ch.codePointAt(0)!;
    if (code === 0x22) out += '\\"';
    else if (code === 0x5c) out += "\\\\";
    else if (code === 0x08) out += "\\b";
    else if (code === 0x09) out += "\\t";
    else if (code === 0x0a) out += "\\n";
    else if (code === 0x0c) out += "\\f";
    else if (code === 0x0d) out += "\\r";
    else if (code < 0x20) {
      out += `\\u${code.toString(16).padStart(4, "0")}`;
    } else {
      out += ch;
    }
  }
  return out + '"';
}

/**
 * RFC 8785 serialization. Assumes assertCanonicalizable already ran.
 * Number::toString (ECMAScript) implements the JCS number rules, including
 * -0 -> "0" and exponent thresholds; the default Array#sort orders keys by
 * UTF-16 code units without any locale API.
 */
function serialize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return serializeString(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => serialize(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${serializeString(key)}:${serialize(obj[key])}`).join(",")}}`;
}

/**
 * Returns the RFC 8785 canonical JSON text. Never mutates the input.
 */
export function canonicalizeJcs(value: unknown): string {
  assertCanonicalizable(value);
  return serialize(value);
}
