import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(root, "p0_v1.sql");
const migration = await readFile(migrationPath, "utf8");
const checksum = "sha256:" + createHash("sha256").update(migration, "utf8").digest("hex");
const db = new DatabaseSync(":memory:", {
  allowExtension: false,
  defensive: true,
  timeout: 5000
});

function expectAbort(sql, expectedMessage) {
  try {
    db.exec(sql);
    throw new Error("statement unexpectedly succeeded: " + sql);
  } catch (error) {
    if (!String(error.message).includes(expectedMessage)) throw error;
  }
}

try {
  db.exec("PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;");
  db.exec(migration);
  db.prepare(`
    INSERT INTO schema_migrations(version, name, checksum, applied_at)
    VALUES (?, ?, ?, ?)
  `).run(1, "p0_v1", checksum, "2026-08-13T00:00:00.000Z");
  db.exec("COMMIT;");

  const tables = db.prepare(`
    SELECT count(*) AS count
    FROM sqlite_schema
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).get();
  const triggers = db.prepare(`
    SELECT name, tbl_name, sql
    FROM sqlite_schema
    WHERE type = 'trigger'
  `).all();
  const foreignKeyErrors = db.prepare("PRAGMA foreign_key_check").all();
  const integrity = db.prepare("PRAGMA integrity_check").all();

  if (foreignKeyErrors.length !== 0) throw new Error("foreign_key_check failed");
  if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") {
    throw new Error("integrity_check failed");
  }

  const triggerByName = new Map(triggers.map((trigger) => [trigger.name, trigger]));
  const immutableTables = [
    "schema_migrations", "task_manifests", "task_runs", "events", "artifact_lifecycle",
    "context_queries", "context_items", "context_packages", "context_package_items",
    "provider_capability_snapshots", "provider_requests", "provider_outcomes",
    "plans", "plan_steps", "policy_decisions", "sandbox_profiles",
    "capability_grants", "capability_revocations", "approval_grants",
    "approval_revocations", "approval_uses", "effect_intents", "effect_intent_grants",
    "tool_results", "verification_results", "usage_records", "price_books",
    "budget_sets", "budget_limits", "budget_reservation_lifecycle",
    "budget_reservation_lines", "budget_ledger",
    "recovery_runs", "effect_reconciliations", "recovery_items", "recovery_reports"
  ];
  for (const table of immutableTables) {
    const updateTrigger = triggerByName.get(table + "_no_update");
    const deleteTrigger = triggerByName.get(table + "_no_delete");
    if (updateTrigger === undefined) {
      throw new Error("missing immutable update trigger: " + table);
    }
    if (deleteTrigger === undefined) {
      throw new Error("missing immutable delete trigger: " + table);
    }
    if (updateTrigger.tbl_name !== table || !updateTrigger.sql.includes("BEFORE UPDATE ON " + table)) {
      throw new Error("misbound immutable update trigger: " + table);
    }
    if (deleteTrigger.tbl_name !== table || !deleteTrigger.sql.includes("BEFORE DELETE ON " + table)) {
      throw new Error("misbound immutable delete trigger: " + table);
    }
    const expectedRaise = "RAISE(ABORT, 'immutable." + table + "')";
    if (!updateTrigger.sql.includes(expectedRaise) || !deleteTrigger.sql.includes(expectedRaise)) {
      throw new Error("wrong immutable failure code: " + table);
    }
  }

  db.prepare(`
    INSERT INTO task_manifests(
      manifest_id, manifest_fingerprint, project_id, workspace_id, principal_id,
      governance_bundle_id, governance_bundle_fingerprint, budget_set_id,
      budget_fingerprint, sandbox_profile_fingerprint, created_at, canonical_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}')
  `).run(
    "mft_00000000-0000-4000-8000-000000000001", "sha256:" + "1".repeat(64),
    "prj_00000000-0000-4000-8000-000000000001",
    "wsp_00000000-0000-4000-8000-000000000001",
    "prn_00000000-0000-4000-8000-000000000001", "bundle-p0",
    "sha256:" + "2".repeat(64), "bgt_00000000-0000-4000-8000-000000000001",
    "sha256:" + "7".repeat(64), "sha256:" + "3".repeat(64),
    "2026-08-13T00:00:00.000Z"
  );

  db.prepare(`
    INSERT INTO task_runs(
      task_id, project_id, workspace_id, principal_id, manifest_id,
      manifest_fingerprint, governance_bundle_id, governance_bundle_fingerprint,
      budget_set_id, budget_fingerprint, sandbox_profile_fingerprint,
      correlation_id, created_at, canonical_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '{}')
  `).run(
    "tsk_00000000-0000-4000-8000-000000000001",
    "prj_00000000-0000-4000-8000-000000000001",
    "wsp_00000000-0000-4000-8000-000000000001",
    "prn_00000000-0000-4000-8000-000000000001",
    "mft_00000000-0000-4000-8000-000000000001",
    "sha256:" + "1".repeat(64), "bundle-p0", "sha256:" + "2".repeat(64),
    "bgt_00000000-0000-4000-8000-000000000001", "sha256:" + "7".repeat(64),
    "sha256:" + "3".repeat(64),
    "cor_00000000-0000-4000-8000-000000000001",
    "2026-08-13T00:00:00.000Z"
  );

  expectAbort("UPDATE task_runs SET principal_id = principal_id", "immutable.task_runs");
  expectAbort("DELETE FROM task_runs", "immutable.task_runs");

  const insertEvent = db.prepare(`
    INSERT INTO events(
      event_id, task_id, sequence, event_type, payload_contract, occurred_at,
      recorded_at, principal_id, project_id, step_id, correlation_id,
      causation_event_id, payload_json, payload_digest, previous_event_digest,
      fingerprint_profile, event_digest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?, 'jcs-sha256-v1', ?)
  `);
  insertEvent.run(
    "evt_00000000-0000-4000-8000-000000000001",
    "tsk_00000000-0000-4000-8000-000000000001", 1, "task.created",
    "ideia.task-created/1", "2026-08-13T00:00:00.000Z", "2026-08-13T00:00:00.000Z",
    "prn_00000000-0000-4000-8000-000000000001",
    "prj_00000000-0000-4000-8000-000000000001",
    "cor_00000000-0000-4000-8000-000000000001",
    '{"contract":"ideia.task-created/1","initial_state":"created","manifest_fingerprint":"sha256:' + "1".repeat(64) + '","manifest_id":"mft_00000000-0000-4000-8000-000000000001"}',
    "sha256:" + "a".repeat(64), null, "sha256:" + "b".repeat(64)
  );
  db.prepare(`
    INSERT INTO task_projections(
      task_id, current_state, last_sequence, last_event_id, last_event_digest,
      projection_version, updated_at
    ) VALUES (?, 'created', 1, ?, ?, 1, ?)
  `).run(
    "tsk_00000000-0000-4000-8000-000000000001",
    "evt_00000000-0000-4000-8000-000000000001", "sha256:" + "b".repeat(64),
    "2026-08-13T00:00:00.000Z"
  );
  expectAbort(
    "UPDATE task_projections SET last_sequence = 2 WHERE task_id = 'tsk_00000000-0000-4000-8000-000000000001'",
    "invalid.task_projection_update"
  );
  expectAbort(`
    INSERT INTO events(
      event_id, task_id, sequence, event_type, payload_contract, occurred_at,
      recorded_at, principal_id, project_id, step_id, correlation_id,
      causation_event_id, payload_json, payload_digest, previous_event_digest,
      fingerprint_profile, event_digest
    ) VALUES (
      'evt_00000000-0000-4000-8000-000000000099',
      'tsk_00000000-0000-4000-8000-000000000001', 3, 'usage.recorded',
      'ideia.usage-record/1', '2026-08-13T00:00:01.000Z', '2026-08-13T00:00:01.000Z',
      'prn_00000000-0000-4000-8000-000000000001',
      'prj_00000000-0000-4000-8000-000000000001', NULL,
      'cor_00000000-0000-4000-8000-000000000001', NULL, '{}',
      'sha256:${"0".repeat(64)}', 'sha256:${"b".repeat(64)}', 'jcs-sha256-v1',
      'sha256:${"1".repeat(64)}'
    )
  `, "invalid.event_chain");
  insertEvent.run(
    "evt_00000000-0000-4000-8000-000000000002",
    "tsk_00000000-0000-4000-8000-000000000001", 2, "budget.ledger_recorded",
    "ideia.budget-ledger-entry/1", "2026-08-13T00:00:01.000Z", "2026-08-13T00:00:01.000Z",
    "prn_00000000-0000-4000-8000-000000000001",
    "prj_00000000-0000-4000-8000-000000000001",
    "cor_00000000-0000-4000-8000-000000000001", '{}',
    "sha256:" + "c".repeat(64), "sha256:" + "b".repeat(64), "sha256:" + "d".repeat(64)
  );
  db.prepare(`
    UPDATE task_projections
    SET last_sequence = 2, last_event_id = ?, last_event_digest = ?, updated_at = ?
    WHERE task_id = ?
  `).run(
    "evt_00000000-0000-4000-8000-000000000002", "sha256:" + "d".repeat(64),
    "2026-08-13T00:00:01.000Z", "tsk_00000000-0000-4000-8000-000000000001"
  );
  insertEvent.run(
    "evt_00000000-0000-4000-8000-000000000003",
    "tsk_00000000-0000-4000-8000-000000000001", 3, "task.transitioned",
    "ideia.task-transitioned/1", "2026-08-13T00:00:02.000Z", "2026-08-13T00:00:02.000Z",
    "prn_00000000-0000-4000-8000-000000000001",
    "prj_00000000-0000-4000-8000-000000000001",
    "cor_00000000-0000-4000-8000-000000000001",
    '{"contract":"ideia.task-transitioned/1","from_state":"created","reason":"smoke","reason_code":"smoke","to_state":"preflight"}',
    "sha256:" + "e".repeat(64), "sha256:" + "d".repeat(64), "sha256:" + "f".repeat(64)
  );
  db.prepare(`
    UPDATE task_projections
    SET current_state = 'preflight', last_sequence = 3, last_event_id = ?,
        last_event_digest = ?, updated_at = ?
    WHERE task_id = ?
  `).run(
    "evt_00000000-0000-4000-8000-000000000003", "sha256:" + "f".repeat(64),
    "2026-08-13T00:00:02.000Z", "tsk_00000000-0000-4000-8000-000000000001"
  );
  expectAbort(
    "UPDATE task_projections SET current_state = 'running' WHERE task_id = 'tsk_00000000-0000-4000-8000-000000000001'",
    "invalid.task_projection_update"
  );

  db.prepare(`
    INSERT INTO artifacts(
      artifact_id, task_id, lifecycle, profile, digest, size_bytes, media_type,
      data_class, storage_key, current_metadata_fingerprint, created_at,
      lifecycle_changed_at, quarantine_reason_code
    ) VALUES (?, ?, 'staged', 'raw-sha256-v1', ?, 1, 'application/octet-stream',
              'D0', 'objects/smoke', ?, ?, ?, NULL)
  `).run(
    "art_00000000-0000-4000-8000-000000000001",
    "tsk_00000000-0000-4000-8000-000000000001",
    "sha256:" + "4".repeat(64), "sha256:" + "5".repeat(64),
    "2026-08-13T00:00:01.000Z", "2026-08-13T00:00:01.000Z"
  );
  db.prepare(`
    INSERT INTO artifact_lifecycle(
      artifact_id, sequence, from_state, to_state, reason_code, event_id,
      occurred_at, metadata_fingerprint, canonical_json
    ) VALUES (?, 1, NULL, 'staged', 'smoke', NULL, ?, ?, '{}')
  `).run(
    "art_00000000-0000-4000-8000-000000000001",
    "2026-08-13T00:00:01.000Z", "sha256:" + "5".repeat(64)
  );
  expectAbort(
    "UPDATE artifacts SET lifecycle = 'committed' WHERE artifact_id = 'art_00000000-0000-4000-8000-000000000001'",
    "invalid.artifact_transition"
  );
  db.prepare(`
    INSERT INTO artifact_lifecycle(
      artifact_id, sequence, from_state, to_state, reason_code, event_id,
      occurred_at, metadata_fingerprint, canonical_json
    ) VALUES (?, 2, 'staged', 'committed', 'smoke', NULL, ?, ?, '{}')
  `).run(
    "art_00000000-0000-4000-8000-000000000001",
    "2026-08-13T00:00:02.000Z", "sha256:" + "6".repeat(64)
  );
  db.prepare(`
    UPDATE artifacts
    SET lifecycle = 'committed', current_metadata_fingerprint = ?, lifecycle_changed_at = ?
    WHERE artifact_id = ?
  `).run(
    "sha256:" + "6".repeat(64), "2026-08-13T00:00:02.000Z",
    "art_00000000-0000-4000-8000-000000000001"
  );

  db.prepare(`
    INSERT INTO budget_sets(
      budget_set_id, task_id, price_book_id, budget_fingerprint, action, created_at, canonical_json
    ) VALUES (?, ?, NULL, ?, 'stop_new_billable', ?, '{}')
  `).run(
    "bgt_00000000-0000-4000-8000-000000000001",
    "tsk_00000000-0000-4000-8000-000000000001",
    "sha256:" + "7".repeat(64), "2026-08-13T00:00:01.000Z"
  );
  db.prepare(`
    INSERT INTO budget_reservations(
      budget_reservation_id, budget_set_id, call_id, status, possible_overage,
      current_reservation_fingerprint, created_at, expires_at, changed_at, canonical_json
    ) VALUES (?, ?, ?, 'active', 0, ?, ?, ?, ?, '{}')
  `).run(
    "brs_00000000-0000-4000-8000-000000000001",
    "bgt_00000000-0000-4000-8000-000000000001",
    "cal_00000000-0000-4000-8000-000000000001",
    "sha256:" + "8".repeat(64), "2026-08-13T00:00:01.000Z",
    "2026-08-13T00:01:00.000Z", "2026-08-13T00:00:01.000Z"
  );
  db.prepare(`
    INSERT INTO budget_reservation_lifecycle(
      budget_reservation_id, sequence, from_status, to_status, possible_overage,
      reservation_fingerprint, changed_at, canonical_json
    ) VALUES (?, 1, NULL, 'active', 0, ?, ?, '{}')
  `).run(
    "brs_00000000-0000-4000-8000-000000000001",
    "sha256:" + "8".repeat(64), "2026-08-13T00:00:01.000Z"
  );
  expectAbort(
    "UPDATE budget_reservations SET status = 'consumed' WHERE budget_reservation_id = 'brs_00000000-0000-4000-8000-000000000001'",
    "invalid.budget_reservation_transition"
  );
  db.prepare(`
    INSERT INTO budget_reservation_lifecycle(
      budget_reservation_id, sequence, from_status, to_status, possible_overage,
      reservation_fingerprint, changed_at, canonical_json
    ) VALUES (?, 2, 'active', 'consumed', 0, ?, ?, '{}')
  `).run(
    "brs_00000000-0000-4000-8000-000000000001",
    "sha256:" + "9".repeat(64), "2026-08-13T00:00:02.000Z"
  );
  db.prepare(`
    UPDATE budget_reservations
    SET status = 'consumed', current_reservation_fingerprint = ?, changed_at = ?, canonical_json = '{}'
    WHERE budget_reservation_id = ?
  `).run(
    "sha256:" + "9".repeat(64), "2026-08-13T00:00:02.000Z",
    "brs_00000000-0000-4000-8000-000000000001"
  );
  db.prepare(`
    INSERT INTO budget_ledger(
      budget_set_id, sequence, event_id, budget_reservation_id, usage_id,
      classification, unit, currency, amount, source, occurred_at, entry_fingerprint
    ) VALUES (?, 1, ?, ?, NULL, 'reserved', 'call', '', 1, 'reservation', ?, ?)
  `).run(
    "bgt_00000000-0000-4000-8000-000000000001",
    "evt_00000000-0000-4000-8000-000000000002",
    "brs_00000000-0000-4000-8000-000000000001",
    "2026-08-13T00:00:02.000Z", "sha256:" + "0".repeat(64)
  );
  expectAbort(`
    INSERT INTO budget_ledger(
      budget_set_id, sequence, event_id, budget_reservation_id, usage_id,
      classification, unit, currency, amount, source, occurred_at, entry_fingerprint
    ) VALUES (
      'bgt_00000000-0000-4000-8000-000000000001', 3,
      'evt_00000000-0000-4000-8000-000000000003',
      'brs_00000000-0000-4000-8000-000000000001', NULL,
      'reserved', 'call', '', 1, 'reservation', '2026-08-13T00:00:02.000Z',
      'sha256:${"a".repeat(64)}'
    )
  `, "invalid.budget_ledger_sequence");

  console.log("Migration checksum:", checksum);
  console.log("Tables:", tables.count);
  console.log("Triggers:", triggers.length);
  console.log("Immutable table guards:", immutableTables.length, "structural OK");
  console.log("Immutable task_runs smoke test: UPDATE/DELETE rejected");
  console.log("Task projection smoke test: orphan update rejected; non-state/state events accepted");
  console.log("Event chain smoke test: out-of-order append rejected");
  console.log("Artifact lifecycle smoke test: orphan transition rejected; journaled transition accepted");
  console.log("Budget lifecycle smoke test: orphan transition rejected; journaled transition accepted");
  console.log("Budget ledger smoke test: sequence 1 accepted; sequence gap rejected");
  console.log("Foreign keys: OK");
  console.log("Integrity: OK");
} finally {
  if (db.isTransaction) db.exec("ROLLBACK;");
  db.close();
}
