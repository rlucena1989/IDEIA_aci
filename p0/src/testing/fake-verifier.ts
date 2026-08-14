/**
 * Fake VerifierPort for testing
 * Deterministic FIFO-based fake with explicit scripts
 */

import type { VerifierPort } from "../application/ports.ts";
import type { Result } from "../application/result.ts";
import type { PortError } from "../application/port-error.ts";

/**
 * Script item for verify operation
 */
export interface VerifierScript {
  readonly result: unknown;
  readonly error?: PortError;
}

/**
 * Fake VerifierPort implementation
 */
export class FakeVerifier implements VerifierPort {
  private script: VerifierScript[] = [];
  private calls: ReadonlyArray<{
    criterion: unknown;
    evidence: ReadonlyArray<unknown>;
  }> = [];

  /**
   * Set verify script
   */
  setScript(script: ReadonlyArray<VerifierScript>): void {
    this.script = [...script];
  }

  /**
   * Get recorded calls (defensive copy)
   */
  getCalls(): ReadonlyArray<{
    criterion: unknown;
    evidence: ReadonlyArray<unknown>;
  }> {
    return this.calls.map((call) => ({
      criterion: structuredClone(call.criterion),
      evidence: call.evidence.map((e) => structuredClone(e)),
    }));
  }

  /**
   * Reset fake state
   */
  reset(): void {
    this.script = [];
    this.calls = [];
  }

  async verify(
    criterion: unknown,
    evidence: ReadonlyArray<unknown>,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>> {
    // Record call with defensive copy
    this.calls = [
      ...this.calls,
      {
        criterion: structuredClone(criterion),
        evidence: evidence.map((e) => structuredClone(e)),
      },
    ];

    // Check abort before processing
    if (signal.aborted) {
      return {
        ok: false,
        error: {
          code: "aborted",
          retry: "never",
          redacted_message: "Operation aborted",
          cause_ref: null,
        },
      };
    }

    // Get next script item
    const item = this.script.shift();
    if (!item) {
      return {
        ok: false,
        error: {
          code: "unknown",
          retry: "never",
          redacted_message: "Verify script exhausted",
          cause_ref: null,
        },
      };
    }

    if (item.error) {
      return {
        ok: false,
        error: item.error,
      };
    }

    return {
      ok: true,
      value: structuredClone(item.result),
    };
  }
}
