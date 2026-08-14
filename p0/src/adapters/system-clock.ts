/**
 * System clock implementations using Node.js / platform APIs
 *
 * Placed in adapters layer to preserve domain purity per ADR-003.
 */

import type { AuditClock, MonotonicClock } from "../domain/clock.ts";

/**
 * Real audit clock using system UTC time
 */
export class SystemAuditClock implements AuditClock {
  nowUtc(): Date {
    return new Date();
  }
}

/**
 * Real monotonic clock using performance.now()
 */
export class SystemMonotonicClock implements MonotonicClock {
  nowMs(): bigint {
    return BigInt(Math.floor(performance.now()));
  }
}
