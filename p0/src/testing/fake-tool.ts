/**
 * Fake ToolPort for testing
 * Deterministic FIFO-based fake with explicit scripts
 */

import type {
  ToolPort,
  ToolSignal,
  ToolSignalSink,
} from "../application/ports.ts";
import type { Result } from "../application/result.ts";
import type { PortError } from "../application/port-error.ts";

/**
 * Script item for invoke operation
 */
export interface ToolInvokeScript {
  readonly signals: ReadonlyArray<ToolSignal>;
  readonly result: unknown;
  readonly error?: PortError;
}

/**
 * Script item for reconcile operation
 */
export interface ToolReconcileScript {
  readonly result: unknown;
  readonly error?: PortError;
}

/**
 * Fake ToolPort implementation
 */
export class FakeTool implements ToolPort {
  private invokeScript: ToolInvokeScript[] = [];
  private reconcileScript: ToolReconcileScript[] = [];
  private calls: ReadonlyArray<unknown> = [];

  /**
   * Set invoke script
   */
  setInvokeScript(script: ReadonlyArray<ToolInvokeScript>): void {
    this.invokeScript = [...script];
  }

  /**
   * Set reconcile script
   */
  setReconcileScript(script: ReadonlyArray<ToolReconcileScript>): void {
    this.reconcileScript = [...script];
  }

  /**
   * Get recorded calls (defensive copy)
   */
  getCalls(): ReadonlyArray<unknown> {
    return [...this.calls];
  }

  /**
   * Reset fake state
   */
  reset(): void {
    this.invokeScript = [];
    this.reconcileScript = [];
    this.calls = [];
  }

  async invoke(
    intent: unknown,
    sink: ToolSignalSink,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>> {
    // Record call with defensive copy
    this.calls = [...this.calls, structuredClone(intent)];

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
    const item = this.invokeScript.shift();
    if (!item) {
      return {
        ok: false,
        error: {
          code: "unknown",
          retry: "never",
          redacted_message: "Invoke script exhausted",
          cause_ref: null,
        },
      };
    }

    // Send signals with contiguous sequence
    let sequence = 0;
    for (const signalItem of item.signals) {
      // Check abort during signal processing
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

      const signalWithSequence = {
        ...structuredClone(signalItem),
        sequence,
      };
      sequence++;

      const result = sink.accept(signalWithSequence);
      if (!result.ok) {
        return {
          ok: false,
          error: result.error,
        };
      }
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

  async reconcile(
    prepared_intent: unknown,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>> {
    // Record call with defensive copy
    this.calls = [...this.calls, structuredClone(prepared_intent)];

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
    const item = this.reconcileScript.shift();
    if (!item) {
      return {
        ok: false,
        error: {
          code: "unknown",
          retry: "never",
          redacted_message: "Reconcile script exhausted",
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
