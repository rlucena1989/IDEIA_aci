/**
 * Fake ToolCatalogPort for testing
 * Deterministic fake with exact version resolution
 */

import type { ToolCatalogPort } from "../application/ports.ts";
import type { Result } from "../application/result.ts";
import type { PortError } from "../application/port-error.ts";

/**
 * Tool definition entry
 */
export interface ToolEntry {
  readonly tool_id: string;
  readonly tool_version: string;
  readonly definition: unknown;
}

/**
 * Fake ToolCatalogPort implementation
 */
export class FakeToolCatalog implements ToolCatalogPort {
  private tools: ReadonlyMap<string, ToolEntry> = new Map();
  private catalogFingerprint: string = "fake-fingerprint";
  private calls: ReadonlyArray<{
    operation: "resolveExact" | "listAllowed" | "fingerprint";
    args: unknown;
  }> = [];

  /**
   * Set tool definitions
   */
  setTools(tools: ReadonlyArray<ToolEntry>): void {
    const map = new Map<string, ToolEntry>();
    for (const tool of tools) {
      const key = `${tool.tool_id}:${tool.tool_version}`;
      map.set(key, tool);
    }
    this.tools = map;
  }

  /**
   * Set fingerprint
   */
  setCatalogFingerprint(fingerprint: string): void {
    this.catalogFingerprint = fingerprint;
  }

  /**
   * Get recorded calls (defensive copy)
   */
  getCalls(): ReadonlyArray<{
    operation: "resolveExact" | "listAllowed" | "fingerprint";
    args: unknown;
  }> {
    return this.calls.map((call) => ({
      operation: call.operation,
      args: structuredClone(call.args),
    }));
  }

  /**
   * Reset fake state
   */
  reset(): void {
    this.tools = new Map();
    this.catalogFingerprint = "fake-fingerprint";
    this.calls = [];
  }

  resolveExact(
    tool_id: string,
    tool_version: string
  ): Result<unknown, PortError> {
    // Record call
    this.calls = [
      ...this.calls,
      { operation: "resolveExact" as const, args: { tool_id, tool_version } },
    ];

    const key = `${tool_id}:${tool_version}`;
    const entry = this.tools.get(key);

    if (!entry) {
      return {
        ok: false,
        error: {
          code: "tool.not_found",
          retry: "never",
          redacted_message: `Tool not found: ${tool_id}@${tool_version}`,
          cause_ref: null,
        },
      };
    }

    return {
      ok: true,
      value: structuredClone(entry.definition),
    };
  }

  listAllowed(
    allowed: ReadonlyArray<Readonly<{ tool_id: string; tool_version: string }>>
  ): Result<ReadonlyArray<unknown>, PortError> {
    // Record call
    this.calls = [
      ...this.calls,
      { operation: "listAllowed" as const, args: structuredClone(allowed) },
    ];

    const definitions: unknown[] = [];

    for (const item of allowed) {
      const key = `${item.tool_id}:${item.tool_version}`;
      const entry = this.tools.get(key);

      if (!entry) {
        return {
          ok: false,
          error: {
            code: "tool.not_found",
            retry: "never",
            redacted_message: `Tool not found: ${item.tool_id}@${item.tool_version}`,
            cause_ref: null,
          },
        };
      }

      definitions.push(structuredClone(entry.definition));
    }

    return {
      ok: true,
      value: definitions,
    };
  }

  fingerprint(): Result<string, PortError> {
    // Record call
    this.calls = [
      ...this.calls,
      { operation: "fingerprint" as const, args: null },
    ];

    return {
      ok: true,
      value: this.catalogFingerprint,
    };
  }
}
