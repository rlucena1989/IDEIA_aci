/**
 * Budget accounting for hard limit gate
 *
 * Pure accounting that prevents new billable operations when hard limit is reached.
 * Based on RNF-021.1 and RNF-021.2.
 */

/**
 * Decision for starting a new billable operation
 */
export type BudgetDecision = "can_start" | "hard_limit_reached";

/**
 * Error for invalid budget values
 */
export class InvalidBudgetError extends Error {
  readonly code = "invalid.budget";

  constructor(message: string) {
    super(message);
    this.name = "InvalidBudgetError";
  }
}

/**
 * Validate non-negative safe integer
 */
function validateNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new InvalidBudgetError(`${name} must be finite, got ${value}`);
  }
  if (!Number.isInteger(value)) {
    throw new InvalidBudgetError(`${name} must be integer, got ${value}`);
  }
  if (value < 0) {
    throw new InvalidBudgetError(`${name} must be non-negative, got ${value}`);
  }
  if (value > Number.MAX_SAFE_INTEGER) {
    throw new InvalidBudgetError(
      `${name} must be <= ${Number.MAX_SAFE_INTEGER}, got ${value}`
    );
  }
}

/**
 * Safe addition that prevents overflow
 */
function safeAdd(a: number, b: number): number {
  if (a > Number.MAX_SAFE_INTEGER - b) {
    throw new InvalidBudgetError(
      `Addition would exceed MAX_SAFE_INTEGER: ${a} + ${b}`
    );
  }
  return a + b;
}

/**
 * Budget state and decision
 */
export interface BudgetState {
  readonly hardLimit: number;
  readonly confirmed: number;
  readonly reserved: number;
  /** Informational possible excess; never contributes to accounted or the gate decision. */
  readonly possibleOverage: number;
  /** The enforced total: confirmed + reserved. */
  readonly accounted: number;
  readonly remaining: number;
  readonly decision: BudgetDecision;
}

/**
 * Compute budget state and decision
 *
 * @param hardLimit - Maximum allowed usage in caller-defined unit
 * @param confirmed - Confirmed usage in same unit
 * @param reserved - Reserved usage in same unit
 * @param possibleOverage - Informational possible excess from in-flight/late operations; it is deliberately excluded from accounted and the gate decision
 * @returns Budget state with decision; possibleOverage remains separate from the enforced accounted value
 */
export function computeBudget(
  hardLimit: number,
  confirmed: number,
  reserved: number,
  possibleOverage: number
): BudgetState {
  validateNonNegativeSafeInteger(hardLimit, "hardLimit");
  validateNonNegativeSafeInteger(confirmed, "confirmed");
  validateNonNegativeSafeInteger(reserved, "reserved");
  validateNonNegativeSafeInteger(possibleOverage, "possibleOverage");

  const accounted = safeAdd(confirmed, reserved);

  const remaining = Math.max(0, hardLimit - accounted);

  const decision: BudgetDecision =
    accounted >= hardLimit ? "hard_limit_reached" : "can_start";

  return {
    hardLimit,
    confirmed,
    reserved,
    possibleOverage,
    accounted,
    remaining,
    decision,
  };
}
