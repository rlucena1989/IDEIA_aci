/**
 * Clock interfaces and implementations for P0
 *
 * Separates UTC audit time from monotonic time with deterministic fakes.
 * Based on docs/research/arquitetura/tarefas_longas_assincronas.md, section 9.
 */

/**
 * Audit clock for UTC timestamps used in audit trails
 */
export interface AuditClock {
  /**
   * Returns current UTC time as a defensive copy
   */
  nowUtc(): Date;
}

/**
 * Monotonic clock for non-decreasing millisecond timestamps
 * Used for deadlines, timeouts and duration measurements
 */
export interface MonotonicClock {
  /**
   * Returns current monotonic time in milliseconds
   * Value is guaranteed to be non-decreasing
   */
  nowMs(): bigint;
}

/**
 * Fake audit clock with explicit time definition and advancement
 * Does not read Date.now() - time is controlled by tests
 */
export class FakeAuditClock implements AuditClock {
  private currentTime: Date;

  constructor(initialTime: Date = new Date("2024-01-01T00:00:00.000Z")) {
    this.currentTime = new Date(initialTime.getTime());
  }

  nowUtc(): Date {
    return new Date(this.currentTime.getTime());
  }

  /**
   * Advances the clock by the specified number of milliseconds
   * @param ms Milliseconds to advance (must be >= 0)
   */
  advance(ms: number): void {
    if (ms < 0) {
      throw new Error("Cannot advance audit clock backwards");
    }
    this.currentTime = new Date(this.currentTime.getTime() + ms);
  }

  /**
   * Sets the clock to a specific time
   * @param time The new time to set
   */
  setTime(time: Date): void {
    this.currentTime = new Date(time.getTime());
  }
}

/**
 * Fake monotonic clock with explicit advancement
 * Does not read performance.now() - time is controlled by tests
 * Rejects backward advancement
 */
export class FakeMonotonicClock implements MonotonicClock {
  private currentTime: bigint;

  constructor(initialTime: bigint = 0n) {
    if (initialTime < 0n) {
      throw new Error("Initial monotonic time cannot be negative");
    }
    this.currentTime = initialTime;
  }

  nowMs(): bigint {
    return this.currentTime;
  }

  /**
   * Advances the clock by the specified number of milliseconds
   * @param ms Milliseconds to advance (must be >= 0)
   */
  advance(ms: bigint): void {
    if (ms < 0n) {
      throw new Error("Cannot advance monotonic clock backwards");
    }
    this.currentTime = this.currentTime + ms;
  }

  /**
   * Sets the clock to a specific time
   * @param time The new time to set (must be >= current time)
   */
  setTime(time: bigint): void {
    if (time < this.currentTime) {
      throw new Error("Cannot set monotonic clock backwards");
    }
    this.currentTime = time;
  }
}
