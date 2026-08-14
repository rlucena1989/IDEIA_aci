/**
 * Compile-time proof that ID types are nominally opaque (P2-R05).
 *
 * This file has no runtime assertions; `npx tsc --noEmit` is the gate. Each
 * `@ts-expect-error` must sit on a line that is genuinely a type error — if
 * tsc reports an unused `@ts-expect-error`, opacity has been broken and the
 * remediation must be revisited. Only `@ts-expect-error` is allowed here
 * (never `@ts-ignore`).
 */

import { parseProjectId, parseTaskId } from "../../src/domain/ids.ts";

// @ts-expect-error TaskId não é ProjectId
const notProject: ReturnType<typeof parseProjectId> = parseTaskId("tsk_123e4567-e89b-42d3-a456-426614174000");

// @ts-expect-error objeto bruto não é ID opaco
const notTask: ReturnType<typeof parseTaskId> = { value: "tsk_123e4567-e89b-42d3-a456-426614174000" };

// sem erro: o tipo do próprio parser é atribuível a si mesmo
const ok: ReturnType<typeof parseTaskId> = parseTaskId("tsk_123e4567-e89b-42d3-a456-426614174000");

void notProject;
void notTask;
void ok;
