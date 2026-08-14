/**
 * Fake ProviderPort for testing
 * Deterministic FIFO-based fake with explicit scripts
 */

import type {
  ProviderPort,
  ProviderSignal,
  ProviderSignalSink,
  ProviderTerminal,
  ProviderFeature,
} from "../application/ports.ts";
import type { Result } from "../application/result.ts";
import type { PortError } from "../application/port-error.ts";

/**
 * Script item for probe operation
 */
export interface ProviderProbeScript {
  readonly result: unknown;
  readonly error?: PortError;
}

/**
 * Script item for generate operation
 */
export interface ProviderGenerateScript {
  readonly signals: ReadonlyArray<ProviderSignal>;
  readonly terminal: ProviderTerminal;
}

/**
 * Fake ProviderPort implementation
 */
export class FakeProvider implements ProviderPort {
  private probeScript: ProviderProbeScript[] = [];
  private generateScript: ProviderGenerateScript[] = [];
  private calls: ReadonlyArray<unknown> = [];

  /**
   * Set probe script
   */
  setProbeScript(script: ReadonlyArray<ProviderProbeScript>): void {
    this.probeScript = [...script];
  }

  /**
   * Set generate script
   */
  setGenerateScript(script: ReadonlyArray<ProviderGenerateScript>): void {
    this.generateScript = [...script];
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
    this.probeScript = [];
    this.generateScript = [];
    this.calls = [];
  }

  async probe(
    target: Readonly<{ provider_id: string; endpoint_profile: string; model_id: string }>,
    signal: AbortSignal
  ): Promise<Result<unknown, PortError>> {
    // Record call with defensive copy
    this.calls = [...this.calls, structuredClone(target)];

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
    const item = this.probeScript.shift();
    if (!item) {
      return {
        ok: false,
        error: {
          code: "unknown",
          retry: "never",
          redacted_message: "Probe script exhausted",
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

  async generate(
    request: unknown,
    sink: ProviderSignalSink,
    signal: AbortSignal
  ): Promise<ProviderTerminal> {
    // Record call with defensive copy
    this.calls = [...this.calls, structuredClone(request)];

    // Check abort before processing
    if (signal.aborted) {
      return {
        status: "cancelled",
        finish_reason: "Aborted before processing",
        output: null,
        provider_response_id: null,
        error: {
          code: "aborted",
          retry: "never",
          redacted_message: "Operation aborted",
          cause_ref: null,
        },
      };
    }

    // Get next script item
    const item = this.generateScript.shift();
    if (!item) {
      return {
        status: "failed",
        finish_reason: "Generate script exhausted",
        output: null,
        provider_response_id: null,
        error: {
          code: "unknown",
          retry: "never",
          redacted_message: "Generate script exhausted",
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
          status: "cancelled",
          finish_reason: "Aborted during signal processing",
          output: null,
          provider_response_id: null,
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
        // Sink failure still returns terminal
        return {
          status: "failed",
          finish_reason: "Sink rejected signal",
          output: null,
          provider_response_id: null,
          error: result.error,
        };
      }
    }

    // Return terminal with defensive copy
    return {
      status: item.terminal.status,
      finish_reason: item.terminal.finish_reason,
      output: item.terminal.output !== null
        ? structuredClone(item.terminal.output)
        : null,
      provider_response_id: item.terminal.provider_response_id,
      error: item.terminal.error !== null
        ? { ...item.terminal.error }
        : null,
    };
  }
}
