/**
 * Task transition logic
 *
 * Re-exports state machine types and functions for convenience.
 */

export type {
  TaskState,
} from "./task-state.ts";

export {
  isFinalState,
  validateTransition,
  canTransition,
  InvalidTransitionError,
  FINAL_STATES,
} from "./task-state.ts";
