/**
 * Task state machine for P0
 *
 * Implements the pure and closed state machine for task transitions.
 * Based on docs/research/arquitetura/arquitetura_de_referencia.md, section 8.
 */

/**
 * All possible task states
 */
export type TaskState =
  | "created"
  | "preflight"
  | "contextualizing"
  | "planned"
  | "running"
  | "waiting_approval"
  | "verifying"
  | "sucesso_verificado"
  | "falha"
  | "bloqueado"
  | "cancelado"
  | "inconclusivo";

/**
 * Final states that cannot be reopened
 */
export const FINAL_STATES: ReadonlySet<TaskState> = new Set([
  "sucesso_verificado",
  "falha",
  "bloqueado",
  "cancelado",
  "inconclusivo",
] as const);

/**
 * Error for invalid state transitions
 */
export class InvalidTransitionError extends Error {
  readonly code = "invalid.transition";
  readonly from: TaskState;
  readonly to: TaskState;

  constructor(from: TaskState, to: TaskState, message: string) {
    super(message);
    this.name = "InvalidTransitionError";
    this.from = from;
    this.to = to;
  }
}

/**
 * Check if a state is a final state
 */
export function isFinalState(state: TaskState): boolean {
  return FINAL_STATES.has(state);
}

/**
 * Validate a state transition
 * @param from Current state
 * @param to Target state
 * @throws InvalidTransitionError if transition is not allowed
 */
export function validateTransition(from: TaskState, to: TaskState): void {
  // Cannot transition from final state
  if (isFinalState(from)) {
    throw new InvalidTransitionError(
      from,
      to,
      `Cannot transition from final state '${from}' to '${to}'`
    );
  }

  // Valid transitions from each state
  const validTransitions: Record<TaskState, ReadonlySet<TaskState>> = {
    created: new Set(["preflight", "cancelado"] as const),
    preflight: new Set(["contextualizing", "bloqueado", "cancelado"] as const),
    contextualizing: new Set(["planned", "bloqueado", "cancelado"] as const),
    planned: new Set(["running", "bloqueado", "cancelado"] as const),
    running: new Set([
      "waiting_approval",
      "verifying",
      "falha",
      "inconclusivo",
      "cancelado",
    ] as const),
    waiting_approval: new Set(["running", "bloqueado", "cancelado"] as const),
    verifying: new Set([
      "sucesso_verificado",
      "falha",
      "bloqueado",
      "inconclusivo",
      "cancelado",
    ] as const),
    sucesso_verificado: new Set(),
    falha: new Set(),
    bloqueado: new Set(),
    cancelado: new Set(),
    inconclusivo: new Set(),
  };

  const allowed = validTransitions[from];
  if (!allowed) {
    throw new InvalidTransitionError(
      from,
      to,
      `Unknown state '${from}'`
    );
  }

  if (!allowed.has(to)) {
    throw new InvalidTransitionError(
      from,
      to,
      `Invalid transition from '${from}' to '${to}'`
    );
  }
}

/**
 * Check if a transition is valid without throwing
 */
export function canTransition(from: TaskState, to: TaskState): boolean {
  try {
    validateTransition(from, to);
    return true;
  } catch {
    return false;
  }
}
