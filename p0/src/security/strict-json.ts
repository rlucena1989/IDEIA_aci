/**
 * Strict JSON parsing for external bytes/strings (WP-04).
 *
 * Detects duplicate property names — including escape-equivalent forms such
 * as "a" vs "\u0061", nested included — BEFORE JSON.parse discards them, and
 * enforces caller-provided limits (bytes, depth, members, string length)
 * before any hashing. Lone surrogates are rejected (I-JSON). Grammar errors
 * surface as JsonParseError. Error messages never include payload content.
 */

export interface JsonLimits {
  readonly maxBytes: number;
  readonly maxDepth: number;
  readonly maxMembers: number;
  readonly maxStringLength: number;
}

/** Duplicate property name detected before parse (code json.duplicate_key). */
export class DuplicateKeyError extends Error {
  readonly code = "json.duplicate_key";
  readonly key: string;

  constructor(key: string) {
    super("chave duplicada detectada antes do parse");
    this.name = "DuplicateKeyError";
    this.key = key;
  }
}

/** A caller-provided limit was violated (code json.limits). */
export class JsonLimitsError extends Error {
  readonly code = "json.limits";

  constructor(message: string) {
    super(message);
    this.name = "JsonLimitsError";
  }
}

/** Malformed JSON or content after the root value (code json.parse). */
export class JsonParseError extends Error {
  readonly code = "json.parse";

  constructor(message: string) {
    super(message);
    this.name = "JsonParseError";
  }
}

interface Frame {
  readonly kind: "object" | "array";
  keys: Set<string> | null;
  count: number;
}

function validateLimits(limits: JsonLimits): void {
  for (const key of ["maxBytes", "maxDepth", "maxMembers", "maxStringLength"] as const) {
    const value = limits[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new JsonLimitsError(`limite ausente ou inválido: ${key}`);
    }
  }
}

/**
 * Decodes a JSON string literal body (without the surrounding quotes),
 * rejecting invalid escapes, raw control characters and lone surrogates.
 */
function decodeJsonString(raw: string): string {
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== "\\") {
      const code = ch.charCodeAt(0);
      if (code < 0x20) throw new JsonParseError("caractere de controle não escapado em string");
      out += ch;
      continue;
    }
    const esc = raw[i + 1];
    switch (esc) {
      case '"': out += '"'; i += 1; break;
      case "\\": out += "\\"; i += 1; break;
      case "/": out += "/"; i += 1; break;
      case "b": out += "\b"; i += 1; break;
      case "f": out += "\f"; i += 1; break;
      case "n": out += "\n"; i += 1; break;
      case "r": out += "\r"; i += 1; break;
      case "t": out += "\t"; i += 1; break;
      case "u": {
        const hex = raw.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new JsonParseError("escape \\u inválido");
        const code = parseInt(hex, 16);
        i += 5;
        if (code >= 0xd800 && code <= 0xdbff) {
          if (raw[i + 1] === "\\" && raw[i + 2] === "u") {
            const hex2 = raw.slice(i + 3, i + 7);
            if (!/^[0-9a-fA-F]{4}$/.test(hex2)) throw new JsonParseError("par surrogate inválido");
            const low = parseInt(hex2, 16);
            if (low >= 0xdc00 && low <= 0xdfff) {
              out += String.fromCharCode(code, low);
              i += 7;
              break;
            }
          }
          throw new JsonParseError("high surrogate sem par");
        }
        if (code >= 0xdc00 && code <= 0xdfff) throw new JsonParseError("low surrogate isolado");
        out += String.fromCharCode(code);
        break;
      }
      default:
        throw new JsonParseError("escape inválido");
    }
  }
  return out;
}

class StrictJsonScanner {
  private pos = 0;
  private depth = 0;
  private stack: Frame[] = [];
  private readonly text: string;
  private readonly limits: JsonLimits;

  constructor(text: string, limits: JsonLimits) {
    this.text = text;
    this.limits = limits;
  }

  private skipWhitespace(): void {
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") this.pos += 1;
      else break;
    }
  }

  private enterContainer(kind: "object" | "array"): void {
    this.depth += 1;
    if (this.depth > this.limits.maxDepth) {
      throw new JsonLimitsError("profundidade excede o limite");
    }
    this.stack.push({ kind, keys: kind === "object" ? new Set() : null, count: 0 });
    this.pos += 1;
  }

  private leaveContainer(): void {
    const frame = this.stack.pop();
    if (!frame) throw new JsonParseError("fechamento sem abertura");
    this.depth -= 1;
    this.pos += 1;
  }

  private readString(): string {
    if (this.text[this.pos] !== '"') throw new JsonParseError("esperava string");
    this.pos += 1;
    let raw = "";
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (ch === '"') {
        this.pos += 1;
        const decoded = decodeJsonString(raw);
        if (decoded.length > this.limits.maxStringLength) {
          throw new JsonLimitsError("string excede o limite");
        }
        return decoded;
      }
      if (ch === "\\") {
        raw += ch;
        this.pos += 1;
        if (this.pos >= this.text.length) break;
        raw += this.text[this.pos];
        this.pos += 1;
      } else {
        raw += ch;
        this.pos += 1;
      }
    }
    throw new JsonParseError("string sem fechamento");
  }

  private scanLiteral(): void {
    const rest = this.text.slice(this.pos);
    if (rest.startsWith("true")) { this.pos += 4; return; }
    if (rest.startsWith("false")) { this.pos += 5; return; }
    if (rest.startsWith("null")) { this.pos += 4; return; }
    throw new JsonParseError("literal inválido");
  }

  private scanNumber(): void {
    const rest = this.text.slice(this.pos);
    const match = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/.exec(rest);
    if (!match) throw new JsonParseError("número inválido");
    this.pos += match[0].length;
  }

  private scanValue(): void {
    if (this.pos >= this.text.length) throw new JsonParseError("valor inesperado no fim do JSON");
    const ch = this.text[this.pos];
    if (ch === "{") {
      this.enterContainer("object");
      this.skipWhitespace();
      if (this.text[this.pos] === "}") { this.leaveContainer(); return; }
      this.scanMembers();
      return;
    }
    if (ch === "[") {
      this.enterContainer("array");
      this.skipWhitespace();
      if (this.text[this.pos] === "]") { this.leaveContainer(); return; }
      this.scanArrayItems();
      return;
    }
    if (ch === '"') { this.readString(); return; }
    if (ch === "t" || ch === "f" || ch === "n") { this.scanLiteral(); return; }
    this.scanNumber();
  }

  private scanMembers(): void {
    for (;;) {
      this.skipWhitespace();
      if (this.text[this.pos] !== '"') throw new JsonParseError("esperava chave de string");
      const key = this.readString();
      const frame = this.top();
      if (!frame || frame.kind !== "object") throw new JsonParseError("chave fora de objeto");
      if (frame.keys!.has(key)) throw new DuplicateKeyError(key);
      frame.keys!.add(key);
      frame.count += 1;
      if (frame.count > this.limits.maxMembers) throw new JsonLimitsError("membros excedem o limite");
      this.skipWhitespace();
      if (this.text[this.pos] !== ":") throw new JsonParseError("esperava ':'");
      this.pos += 1;
      this.skipWhitespace();
      this.scanValue();
      this.skipWhitespace();
      const ch = this.text[this.pos];
      if (ch === ",") { this.pos += 1; continue; }
      if (ch === "}") { this.leaveContainer(); return; }
      throw new JsonParseError("esperava ',' ou '}'");
    }
  }

  private scanArrayItems(): void {
    for (;;) {
      this.skipWhitespace();
      this.scanValue();
      const frame = this.top();
      if (!frame || frame.kind !== "array") throw new JsonParseError("item fora de array");
      frame.count += 1;
      if (frame.count > this.limits.maxMembers) throw new JsonLimitsError("itens excedem o limite");
      this.skipWhitespace();
      const ch = this.text[this.pos];
      if (ch === ",") { this.pos += 1; continue; }
      if (ch === "]") { this.leaveContainer(); return; }
      throw new JsonParseError("esperava ',' ou ']'");
    }
  }

  private top(): Frame | undefined {
    return this.stack[this.stack.length - 1];
  }

  scan(): void {
    this.skipWhitespace();
    if (this.pos >= this.text.length) throw new JsonParseError("entrada vazia");
    this.scanValue();
    this.skipWhitespace();
    if (this.pos < this.text.length) throw new JsonParseError("conteúdo após o fim do JSON");
  }
}

/**
 * Parses external JSON text/bytes strictly: duplicate keys (including
 * escape-equivalent forms) are rejected before parse, all limits are
 * mandatory and enforced before hashing, and the result is a plain value.
 */
export function parseStrictJson(input: string | Uint8Array, limits: JsonLimits): unknown {
  validateLimits(limits);
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  if (bytes.byteLength > limits.maxBytes) {
    throw new JsonLimitsError("bytes excedem o limite");
  }
  const text = typeof input === "string" ? input : new TextDecoder().decode(bytes);
  new StrictJsonScanner(text, limits).scan();
  try {
    return JSON.parse(text);
  } catch {
    throw new JsonParseError("JSON inválido");
  }
}
