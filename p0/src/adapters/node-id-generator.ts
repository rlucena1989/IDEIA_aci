/**
 * Node.js adapter for UUID v4 generation
 *
 * Uses crypto.randomUUID from Node.js.
 * This is the only file authorized to import node:crypto.
 */

import crypto from "node:crypto";
import type { UuidV4Generator } from "../ports/id-generator.ts";

export class NodeUuidV4Generator implements UuidV4Generator {
  generate(): string {
    return crypto.randomUUID();
  }
}
