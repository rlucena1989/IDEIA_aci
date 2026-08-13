-- Migration body only. The adapter applies/verifies ADR-008 PRAGMAs, opens
-- BEGIN IMMEDIATE, executes these bytes, inserts schema_migrations with the
-- SHA-256 of these exact bytes and a real UTC timestamp, then commits.

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY CHECK (version > 0),
  name TEXT NOT NULL UNIQUE CHECK (length(name) BETWEEN 1 AND 128),
  checksum TEXT NOT NULL CHECK (length(checksum) = 71 AND substr(checksum, 1, 7) = 'sha256:'),
  applied_at TEXT NOT NULL CHECK (length(applied_at) = 24)
) STRICT;

CREATE TABLE writer_lease (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  owner_nonce TEXT NOT NULL UNIQUE CHECK (length(owner_nonce) = 40 AND substr(owner_nonce, 1, 4) = 'non_'),
  process_started_at TEXT NOT NULL CHECK (length(process_started_at) = 24),
  heartbeat_at TEXT NOT NULL CHECK (length(heartbeat_at) = 24),
  expires_at TEXT NOT NULL CHECK (length(expires_at) = 24)
) STRICT;

CREATE TABLE task_manifests (
  manifest_id TEXT PRIMARY KEY CHECK (length(manifest_id) = 40 AND substr(manifest_id, 1, 4) = 'mft_'),
  manifest_fingerprint TEXT NOT NULL UNIQUE CHECK (length(manifest_fingerprint) = 71 AND substr(manifest_fingerprint, 1, 7) = 'sha256:'),
  project_id TEXT NOT NULL CHECK (length(project_id) = 40 AND substr(project_id, 1, 4) = 'prj_'),
  workspace_id TEXT NOT NULL CHECK (length(workspace_id) = 40 AND substr(workspace_id, 1, 4) = 'wsp_'),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  governance_bundle_id TEXT NOT NULL CHECK (length(governance_bundle_id) BETWEEN 1 AND 64),
  governance_bundle_fingerprint TEXT NOT NULL CHECK (length(governance_bundle_fingerprint) = 71 AND substr(governance_bundle_fingerprint, 1, 7) = 'sha256:'),
  budget_set_id TEXT NOT NULL UNIQUE CHECK (length(budget_set_id) = 40 AND substr(budget_set_id, 1, 4) = 'bgt_'),
  budget_fingerprint TEXT NOT NULL CHECK (length(budget_fingerprint) = 71 AND substr(budget_fingerprint, 1, 7) = 'sha256:'),
  sandbox_profile_fingerprint TEXT NOT NULL CHECK (length(sandbox_profile_fingerprint) = 71 AND substr(sandbox_profile_fingerprint, 1, 7) = 'sha256:'),
  created_at TEXT NOT NULL CHECK (length(created_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (
    manifest_id, manifest_fingerprint, project_id, workspace_id, principal_id,
    governance_bundle_id, governance_bundle_fingerprint, budget_set_id,
    budget_fingerprint, sandbox_profile_fingerprint
  )
) STRICT;

CREATE TABLE task_runs (
  task_id TEXT PRIMARY KEY CHECK (length(task_id) = 40 AND substr(task_id, 1, 4) = 'tsk_'),
  project_id TEXT NOT NULL CHECK (length(project_id) = 40 AND substr(project_id, 1, 4) = 'prj_'),
  workspace_id TEXT NOT NULL CHECK (length(workspace_id) = 40 AND substr(workspace_id, 1, 4) = 'wsp_'),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  manifest_id TEXT NOT NULL UNIQUE REFERENCES task_manifests(manifest_id),
  manifest_fingerprint TEXT NOT NULL CHECK (length(manifest_fingerprint) = 71 AND substr(manifest_fingerprint, 1, 7) = 'sha256:'),
  governance_bundle_id TEXT NOT NULL CHECK (length(governance_bundle_id) BETWEEN 1 AND 64),
  governance_bundle_fingerprint TEXT NOT NULL CHECK (length(governance_bundle_fingerprint) = 71 AND substr(governance_bundle_fingerprint, 1, 7) = 'sha256:'),
  budget_set_id TEXT NOT NULL UNIQUE CHECK (length(budget_set_id) = 40 AND substr(budget_set_id, 1, 4) = 'bgt_'),
  budget_fingerprint TEXT NOT NULL CHECK (length(budget_fingerprint) = 71 AND substr(budget_fingerprint, 1, 7) = 'sha256:'),
  sandbox_profile_fingerprint TEXT NOT NULL CHECK (length(sandbox_profile_fingerprint) = 71 AND substr(sandbox_profile_fingerprint, 1, 7) = 'sha256:'),
  correlation_id TEXT NOT NULL UNIQUE CHECK (length(correlation_id) = 40 AND substr(correlation_id, 1, 4) = 'cor_'),
  created_at TEXT NOT NULL CHECK (length(created_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (task_id, project_id, principal_id),
  UNIQUE (task_id, principal_id),
  UNIQUE (task_id, budget_set_id, budget_fingerprint),
  UNIQUE (task_id, sandbox_profile_fingerprint),
  FOREIGN KEY (
    manifest_id, manifest_fingerprint, project_id, workspace_id, principal_id,
    governance_bundle_id, governance_bundle_fingerprint, budget_set_id,
    budget_fingerprint, sandbox_profile_fingerprint
  ) REFERENCES task_manifests(
    manifest_id, manifest_fingerprint, project_id, workspace_id, principal_id,
    governance_bundle_id, governance_bundle_fingerprint, budget_set_id,
    budget_fingerprint, sandbox_profile_fingerprint
  )
) STRICT;

CREATE TABLE task_projections (
  task_id TEXT PRIMARY KEY REFERENCES task_runs(task_id),
  current_state TEXT NOT NULL CHECK (current_state IN (
    'created','preflight','contextualizing','planned','running','waiting_approval',
    'verifying','sucesso_verificado','falha','bloqueado','cancelado','inconclusivo'
  )),
  last_sequence INTEGER NOT NULL CHECK (last_sequence > 0),
  last_event_id TEXT NOT NULL REFERENCES events(event_id) CHECK (length(last_event_id) = 40 AND substr(last_event_id, 1, 4) = 'evt_'),
  last_event_digest TEXT NOT NULL REFERENCES events(event_digest) CHECK (length(last_event_digest) = 71 AND substr(last_event_digest, 1, 7) = 'sha256:'),
  projection_version INTEGER NOT NULL CHECK (projection_version > 0),
  updated_at TEXT NOT NULL CHECK (length(updated_at) = 24)
) STRICT;

CREATE TABLE events (
  event_id TEXT PRIMARY KEY CHECK (length(event_id) = 40 AND substr(event_id, 1, 4) = 'evt_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  event_type TEXT NOT NULL CHECK (length(event_type) BETWEEN 1 AND 64),
  payload_contract TEXT NOT NULL CHECK (length(payload_contract) BETWEEN 1 AND 128),
  occurred_at TEXT NOT NULL CHECK (length(occurred_at) = 24),
  recorded_at TEXT NOT NULL CHECK (length(recorded_at) = 24),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  project_id TEXT NOT NULL CHECK (length(project_id) = 40 AND substr(project_id, 1, 4) = 'prj_'),
  step_id TEXT CHECK (step_id IS NULL OR (length(step_id) = 40 AND substr(step_id, 1, 4) = 'stp_')),
  correlation_id TEXT NOT NULL CHECK (length(correlation_id) = 40 AND substr(correlation_id, 1, 4) = 'cor_'),
  causation_event_id TEXT REFERENCES events(event_id),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json) AND json_type(payload_json) = 'object'),
  payload_digest TEXT NOT NULL CHECK (length(payload_digest) = 71 AND substr(payload_digest, 1, 7) = 'sha256:'),
  previous_event_digest TEXT CHECK (previous_event_digest IS NULL OR (length(previous_event_digest) = 71 AND substr(previous_event_digest, 1, 7) = 'sha256:')),
  fingerprint_profile TEXT NOT NULL CHECK (fingerprint_profile = 'jcs-sha256-v1'),
  event_digest TEXT NOT NULL UNIQUE CHECK (length(event_digest) = 71 AND substr(event_digest, 1, 7) = 'sha256:'),
  UNIQUE (task_id, sequence),
  CHECK ((sequence = 1 AND previous_event_digest IS NULL) OR (sequence > 1 AND previous_event_digest IS NOT NULL)),
  CHECK (causation_event_id IS NULL OR causation_event_id <> event_id),
  FOREIGN KEY (task_id, project_id, principal_id) REFERENCES task_runs(task_id, project_id, principal_id)
) STRICT;

CREATE INDEX events_task_recorded_idx ON events(task_id, recorded_at);
CREATE INDEX events_causation_idx ON events(causation_event_id) WHERE causation_event_id IS NOT NULL;

CREATE TABLE artifacts (
  artifact_id TEXT PRIMARY KEY CHECK (length(artifact_id) = 40 AND substr(artifact_id, 1, 4) = 'art_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  lifecycle TEXT NOT NULL CHECK (lifecycle IN ('staged','committed','quarantined','tombstoned')),
  profile TEXT NOT NULL CHECK (profile = 'raw-sha256-v1'),
  digest TEXT NOT NULL CHECK (length(digest) = 71 AND substr(digest, 1, 7) = 'sha256:'),
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  media_type TEXT NOT NULL CHECK (length(media_type) BETWEEN 1 AND 256),
  data_class TEXT NOT NULL CHECK (data_class IN ('D0','D1','D2','D3','D4')),
  storage_key TEXT NOT NULL UNIQUE CHECK (length(storage_key) BETWEEN 1 AND 512),
  current_metadata_fingerprint TEXT NOT NULL CHECK (length(current_metadata_fingerprint) = 71 AND substr(current_metadata_fingerprint, 1, 7) = 'sha256:'),
  created_at TEXT NOT NULL CHECK (length(created_at) = 24),
  lifecycle_changed_at TEXT NOT NULL CHECK (length(lifecycle_changed_at) = 24),
  quarantine_reason_code TEXT,
  UNIQUE (task_id, digest, current_metadata_fingerprint),
  UNIQUE (task_id, artifact_id),
  CHECK ((lifecycle = 'quarantined' AND quarantine_reason_code IS NOT NULL) OR
         (lifecycle <> 'quarantined' AND quarantine_reason_code IS NULL))
) STRICT;

CREATE TABLE artifact_lifecycle (
  artifact_id TEXT NOT NULL REFERENCES artifacts(artifact_id),
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  from_state TEXT CHECK (from_state IS NULL OR from_state IN ('staged','committed','quarantined','tombstoned')),
  to_state TEXT NOT NULL CHECK (to_state IN ('staged','committed','quarantined','tombstoned')),
  reason_code TEXT NOT NULL CHECK (length(reason_code) BETWEEN 1 AND 64),
  event_id TEXT REFERENCES events(event_id),
  occurred_at TEXT NOT NULL CHECK (length(occurred_at) = 24),
  metadata_fingerprint TEXT NOT NULL UNIQUE CHECK (length(metadata_fingerprint) = 71 AND substr(metadata_fingerprint, 1, 7) = 'sha256:'),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  PRIMARY KEY (artifact_id, sequence)
) STRICT, WITHOUT ROWID;

CREATE TABLE context_queries (
  context_query_id TEXT PRIMARY KEY CHECK (length(context_query_id) = 40 AND substr(context_query_id, 1, 4) = 'cxq_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  step_id TEXT CHECK (step_id IS NULL OR (length(step_id) = 40 AND substr(step_id, 1, 4) = 'stp_')),
  query_fingerprint TEXT NOT NULL UNIQUE CHECK (length(query_fingerprint) = 71 AND substr(query_fingerprint, 1, 7) = 'sha256:'),
  queried_at TEXT NOT NULL CHECK (length(queried_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object')
) STRICT;

CREATE TABLE context_items (
  context_item_id TEXT PRIMARY KEY CHECK (length(context_item_id) = 40 AND substr(context_item_id, 1, 4) = 'cxi_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  context_query_id TEXT REFERENCES context_queries(context_query_id),
  content_artifact_id TEXT NOT NULL REFERENCES artifacts(artifact_id),
  source_version TEXT NOT NULL CHECK (length(source_version) = 71 AND substr(source_version, 1, 7) = 'sha256:'),
  item_fingerprint TEXT NOT NULL UNIQUE CHECK (length(item_fingerprint) = 71 AND substr(item_fingerprint, 1, 7) = 'sha256:'),
  observed_at TEXT NOT NULL CHECK (length(observed_at) = 24),
  expires_at TEXT CHECK (expires_at IS NULL OR length(expires_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (task_id, content_artifact_id) REFERENCES artifacts(task_id, artifact_id)
) STRICT;

CREATE TABLE context_packages (
  context_package_id TEXT PRIMARY KEY CHECK (length(context_package_id) = 40 AND substr(context_package_id, 1, 4) = 'cxp_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  step_id TEXT CHECK (step_id IS NULL OR (length(step_id) = 40 AND substr(step_id, 1, 4) = 'stp_')),
  package_fingerprint TEXT NOT NULL UNIQUE CHECK (length(package_fingerprint) = 71 AND substr(package_fingerprint, 1, 7) = 'sha256:'),
  destination TEXT NOT NULL CHECK (destination IN ('local','remote')),
  validated_at TEXT NOT NULL CHECK (length(validated_at) = 24),
  expires_at TEXT NOT NULL CHECK (length(expires_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (task_id, context_package_id)
) STRICT;

CREATE TABLE context_package_items (
  context_package_id TEXT NOT NULL REFERENCES context_packages(context_package_id),
  position INTEGER NOT NULL CHECK (position >= 0),
  context_item_id TEXT NOT NULL REFERENCES context_items(context_item_id),
  PRIMARY KEY (context_package_id, position),
  UNIQUE (context_package_id, context_item_id)
) STRICT, WITHOUT ROWID;

CREATE TABLE provider_capability_snapshots (
  snapshot_fingerprint TEXT PRIMARY KEY CHECK (length(snapshot_fingerprint) = 71 AND substr(snapshot_fingerprint, 1, 7) = 'sha256:'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  provider_id TEXT NOT NULL CHECK (length(provider_id) BETWEEN 1 AND 64),
  endpoint_profile TEXT NOT NULL CHECK (length(endpoint_profile) BETWEEN 1 AND 64),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 256),
  observed_at TEXT NOT NULL CHECK (length(observed_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (task_id, snapshot_fingerprint)
) STRICT;

CREATE TABLE provider_requests (
  provider_request_id TEXT PRIMARY KEY CHECK (length(provider_request_id) = 40 AND substr(provider_request_id, 1, 4) = 'pvr_'),
  attempt_id TEXT NOT NULL UNIQUE CHECK (length(attempt_id) = 40 AND substr(attempt_id, 1, 4) = 'atm_'),
  call_id TEXT NOT NULL UNIQUE CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  step_id TEXT CHECK (step_id IS NULL OR (length(step_id) = 40 AND substr(step_id, 1, 4) = 'stp_')),
  context_package_id TEXT NOT NULL REFERENCES context_packages(context_package_id),
  capabilities_fingerprint TEXT NOT NULL REFERENCES provider_capability_snapshots(snapshot_fingerprint),
  budget_set_id TEXT NOT NULL REFERENCES budget_sets(budget_set_id),
  budget_reservation_id TEXT NOT NULL UNIQUE REFERENCES budget_reservations(budget_reservation_id),
  budget_reservation_fingerprint TEXT NOT NULL CHECK (length(budget_reservation_fingerprint) = 71 AND substr(budget_reservation_fingerprint, 1, 7) = 'sha256:'),
  request_fingerprint TEXT NOT NULL UNIQUE CHECK (length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'),
  requested_at TEXT NOT NULL CHECK (length(requested_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (task_id, context_package_id) REFERENCES context_packages(task_id, context_package_id),
  FOREIGN KEY (task_id, capabilities_fingerprint) REFERENCES provider_capability_snapshots(task_id, snapshot_fingerprint),
  FOREIGN KEY (budget_reservation_id, budget_set_id) REFERENCES budget_reservations(budget_reservation_id, budget_set_id),
  FOREIGN KEY (budget_reservation_id, budget_reservation_fingerprint) REFERENCES budget_reservation_lifecycle(budget_reservation_id, reservation_fingerprint)
) STRICT;

CREATE TABLE provider_outcomes (
  provider_request_id TEXT PRIMARY KEY REFERENCES provider_requests(provider_request_id),
  execution_status TEXT NOT NULL CHECK (execution_status IN ('completed','failed','cancelled','timed_out','ambiguous')),
  result_digest TEXT NOT NULL UNIQUE CHECK (length(result_digest) = 71 AND substr(result_digest, 1, 7) = 'sha256:'),
  finished_at TEXT NOT NULL CHECK (length(finished_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object')
) STRICT;

CREATE TABLE plans (
  plan_id TEXT NOT NULL CHECK (length(plan_id) = 40 AND substr(plan_id, 1, 4) = 'pln_'),
  revision INTEGER NOT NULL CHECK (revision > 0),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  plan_fingerprint TEXT NOT NULL UNIQUE CHECK (length(plan_fingerprint) = 71 AND substr(plan_fingerprint, 1, 7) = 'sha256:'),
  previous_plan_fingerprint TEXT CHECK (previous_plan_fingerprint IS NULL OR (length(previous_plan_fingerprint) = 71 AND substr(previous_plan_fingerprint, 1, 7) = 'sha256:')),
  steps_artifact_id TEXT NOT NULL REFERENCES artifacts(artifact_id),
  recorded_at TEXT NOT NULL CHECK (length(recorded_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  PRIMARY KEY (plan_id, revision),
  UNIQUE (task_id, revision),
  UNIQUE (plan_id, revision, task_id),
  FOREIGN KEY (task_id, steps_artifact_id) REFERENCES artifacts(task_id, artifact_id),
  CHECK ((revision = 1 AND previous_plan_fingerprint IS NULL) OR (revision > 1 AND previous_plan_fingerprint IS NOT NULL))
) STRICT, WITHOUT ROWID;

CREATE TABLE plan_steps (
  step_id TEXT PRIMARY KEY CHECK (length(step_id) = 40 AND substr(step_id, 1, 4) = 'stp_'),
  plan_id TEXT NOT NULL,
  plan_revision INTEGER NOT NULL,
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  position INTEGER NOT NULL CHECK (position >= 0),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (plan_id, plan_revision, task_id) REFERENCES plans(plan_id, revision, task_id),
  UNIQUE (plan_id, plan_revision, position)
) STRICT;

CREATE TABLE policy_decisions (
  policy_decision_id TEXT PRIMARY KEY CHECK (length(policy_decision_id) = 40 AND substr(policy_decision_id, 1, 4) = 'pdc_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  call_id TEXT NOT NULL UNIQUE CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  request_fingerprint TEXT NOT NULL CHECK (length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'),
  decision TEXT NOT NULL CHECK (decision IN ('allow','deny','approval_required')),
  policy_fingerprint TEXT NOT NULL CHECK (length(policy_fingerprint) = 71 AND substr(policy_fingerprint, 1, 7) = 'sha256:'),
  decided_at TEXT NOT NULL CHECK (length(decided_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (policy_decision_id, task_id, call_id, principal_id, request_fingerprint),
  UNIQUE (policy_decision_id, task_id, call_id, principal_id, request_fingerprint, policy_fingerprint),
  UNIQUE (policy_decision_id, task_id),
  FOREIGN KEY (task_id, principal_id) REFERENCES task_runs(task_id, principal_id)
) STRICT;

CREATE TABLE sandbox_profiles (
  profile_fingerprint TEXT PRIMARY KEY CHECK (length(profile_fingerprint) = 71 AND substr(profile_fingerprint, 1, 7) = 'sha256:'),
  task_id TEXT NOT NULL UNIQUE REFERENCES task_runs(task_id),
  profile_id TEXT NOT NULL CHECK (length(profile_id) BETWEEN 1 AND 64),
  profile_version TEXT NOT NULL CHECK (length(profile_version) BETWEEN 1 AND 64),
  os_family TEXT NOT NULL CHECK (os_family IN ('windows','linux','macos')),
  isolation_level TEXT NOT NULL CHECK (isolation_level IN ('logical_readonly','controlled_host','virtualized')),
  hostile_input_allowed INTEGER NOT NULL CHECK (hostile_input_allowed IN (0, 1)),
  selected_at TEXT NOT NULL CHECK (length(selected_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (task_id, profile_fingerprint),
  FOREIGN KEY (task_id, profile_fingerprint) REFERENCES task_runs(task_id, sandbox_profile_fingerprint)
) STRICT;

CREATE TABLE capability_grants (
  capability_grant_id TEXT PRIMARY KEY CHECK (length(capability_grant_id) = 40 AND substr(capability_grant_id, 1, 4) = 'cpg_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  sandbox_profile_fingerprint TEXT NOT NULL REFERENCES sandbox_profiles(profile_fingerprint),
  capability TEXT NOT NULL CHECK (capability IN ('filesystem_read','filesystem_write','process_spawn','network_egress','secret_use','git_mutation','external_mutation')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('workspace_path','executable','network_destination','secret_handle','git_repository','external_resource')),
  resource TEXT NOT NULL CHECK (length(resource) BETWEEN 1 AND 2048),
  policy_decision_id TEXT NOT NULL REFERENCES policy_decisions(policy_decision_id),
  valid_from TEXT NOT NULL CHECK (length(valid_from) = 24),
  expires_at TEXT NOT NULL CHECK (length(expires_at) = 24),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  grant_fingerprint TEXT NOT NULL UNIQUE CHECK (length(grant_fingerprint) = 71 AND substr(grant_fingerprint, 1, 7) = 'sha256:'),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (capability_grant_id, task_id),
  FOREIGN KEY (task_id, principal_id) REFERENCES task_runs(task_id, principal_id),
  FOREIGN KEY (task_id, sandbox_profile_fingerprint) REFERENCES sandbox_profiles(task_id, profile_fingerprint),
  FOREIGN KEY (policy_decision_id, task_id) REFERENCES policy_decisions(policy_decision_id, task_id)
) STRICT;

CREATE TABLE capability_revocations (
  event_id TEXT PRIMARY KEY REFERENCES events(event_id),
  capability_grant_id TEXT NOT NULL UNIQUE REFERENCES capability_grants(capability_grant_id),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  revoked_by TEXT NOT NULL CHECK (length(revoked_by) = 40 AND substr(revoked_by, 1, 4) = 'prn_'),
  reason_code TEXT NOT NULL CHECK (length(reason_code) BETWEEN 1 AND 64),
  revoked_at TEXT NOT NULL CHECK (length(revoked_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (capability_grant_id, task_id) REFERENCES capability_grants(capability_grant_id, task_id)
) STRICT;

CREATE TABLE approval_grants (
  approval_id TEXT PRIMARY KEY CHECK (length(approval_id) = 40 AND substr(approval_id, 1, 4) = 'apr_'),
  policy_decision_id TEXT NOT NULL REFERENCES policy_decisions(policy_decision_id),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  call_id TEXT NOT NULL CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  request_fingerprint TEXT NOT NULL CHECK (length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'),
  policy_fingerprint TEXT NOT NULL CHECK (length(policy_fingerprint) = 71 AND substr(policy_fingerprint, 1, 7) = 'sha256:'),
  nonce TEXT NOT NULL UNIQUE CHECK (length(nonce) = 40 AND substr(nonce, 1, 4) = 'non_'),
  granted_at TEXT NOT NULL CHECK (length(granted_at) = 24),
  expires_at TEXT NOT NULL CHECK (length(expires_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (approval_id, task_id, call_id, principal_id, request_fingerprint),
  UNIQUE (approval_id, task_id, call_id, principal_id, request_fingerprint, nonce),
  UNIQUE (approval_id, task_id),
  FOREIGN KEY (policy_decision_id, task_id, call_id, principal_id, request_fingerprint, policy_fingerprint)
    REFERENCES policy_decisions(policy_decision_id, task_id, call_id, principal_id, request_fingerprint, policy_fingerprint)
) STRICT;

CREATE TABLE approval_revocations (
  event_id TEXT PRIMARY KEY REFERENCES events(event_id),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  approval_id TEXT REFERENCES approval_grants(approval_id),
  scope TEXT NOT NULL CHECK (scope IN ('single','all_pending')),
  emergency_stop INTEGER NOT NULL CHECK (emergency_stop IN (0, 1)),
  revoked_at TEXT NOT NULL CHECK (length(revoked_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  CHECK ((scope = 'single' AND approval_id IS NOT NULL) OR (scope = 'all_pending' AND approval_id IS NULL)),
  FOREIGN KEY (approval_id, task_id) REFERENCES approval_grants(approval_id, task_id)
) STRICT;

CREATE TABLE approval_uses (
  approval_use_id TEXT PRIMARY KEY CHECK (length(approval_use_id) = 40 AND substr(approval_use_id, 1, 4) = 'apu_'),
  approval_id TEXT NOT NULL UNIQUE REFERENCES approval_grants(approval_id),
  nonce TEXT NOT NULL UNIQUE CHECK (length(nonce) = 40 AND substr(nonce, 1, 4) = 'non_'),
  effect_intent_id TEXT NOT NULL UNIQUE CHECK (length(effect_intent_id) = 40 AND substr(effect_intent_id, 1, 4) = 'efi_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  call_id TEXT NOT NULL CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  request_fingerprint TEXT NOT NULL CHECK (length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'),
  consumed_at TEXT NOT NULL CHECK (length(consumed_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (approval_id, task_id, call_id, principal_id, request_fingerprint, nonce)
    REFERENCES approval_grants(approval_id, task_id, call_id, principal_id, request_fingerprint, nonce),
  FOREIGN KEY (effect_intent_id, task_id, call_id, principal_id, request_fingerprint)
    REFERENCES effect_intents(effect_intent_id, task_id, call_id, principal_id, request_fingerprint)
    DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE effect_intents (
  effect_intent_id TEXT PRIMARY KEY CHECK (length(effect_intent_id) = 40 AND substr(effect_intent_id, 1, 4) = 'efi_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  step_id TEXT NOT NULL CHECK (length(step_id) = 40 AND substr(step_id, 1, 4) = 'stp_'),
  call_id TEXT NOT NULL UNIQUE CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  principal_id TEXT NOT NULL CHECK (length(principal_id) = 40 AND substr(principal_id, 1, 4) = 'prn_'),
  policy_decision_id TEXT NOT NULL REFERENCES policy_decisions(policy_decision_id),
  approval_id TEXT REFERENCES approval_grants(approval_id),
  request_fingerprint TEXT NOT NULL CHECK (length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'),
  sandbox_profile_fingerprint TEXT NOT NULL REFERENCES sandbox_profiles(profile_fingerprint),
  prepared_at TEXT NOT NULL CHECK (length(prepared_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (effect_intent_id, task_id, call_id, principal_id, request_fingerprint),
  UNIQUE (effect_intent_id, task_id, call_id),
  UNIQUE (effect_intent_id, call_id),
  FOREIGN KEY (policy_decision_id, task_id, call_id, principal_id, request_fingerprint)
    REFERENCES policy_decisions(policy_decision_id, task_id, call_id, principal_id, request_fingerprint),
  FOREIGN KEY (approval_id, task_id, call_id, principal_id, request_fingerprint)
    REFERENCES approval_grants(approval_id, task_id, call_id, principal_id, request_fingerprint)
) STRICT;

CREATE TABLE effect_intent_grants (
  effect_intent_id TEXT NOT NULL REFERENCES effect_intents(effect_intent_id),
  capability_grant_id TEXT NOT NULL REFERENCES capability_grants(capability_grant_id),
  PRIMARY KEY (effect_intent_id, capability_grant_id)
) STRICT, WITHOUT ROWID;

CREATE TABLE tool_results (
  effect_intent_id TEXT PRIMARY KEY REFERENCES effect_intents(effect_intent_id),
  call_id TEXT NOT NULL UNIQUE CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  execution_status TEXT NOT NULL CHECK (execution_status IN ('completed','failed','cancelled','timed_out')),
  effect_status TEXT NOT NULL CHECK (effect_status IN ('not_applicable','observed_success','observed_failure','ambiguous')),
  result_digest TEXT NOT NULL UNIQUE CHECK (length(result_digest) = 71 AND substr(result_digest, 1, 7) = 'sha256:'),
  finished_at TEXT NOT NULL CHECK (length(finished_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (effect_intent_id, call_id) REFERENCES effect_intents(effect_intent_id, call_id)
) STRICT;

CREATE TABLE verification_results (
  verification_id TEXT PRIMARY KEY CHECK (length(verification_id) = 40 AND substr(verification_id, 1, 4) = 'vrf_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  criterion_id TEXT NOT NULL CHECK (length(criterion_id) = 40 AND substr(criterion_id, 1, 4) = 'crt_'),
  status TEXT NOT NULL CHECK (status IN ('pass','fail','blocked','inconclusive')),
  completed_at TEXT NOT NULL CHECK (length(completed_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (task_id, criterion_id, verification_id)
) STRICT;

CREATE TABLE usage_records (
  usage_id TEXT PRIMARY KEY CHECK (length(usage_id) = 40 AND substr(usage_id, 1, 4) = 'use_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  call_id TEXT NOT NULL CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  classification TEXT NOT NULL CHECK (classification IN ('reported','estimated','unknown')),
  unit TEXT NOT NULL CHECK (unit IN ('call','input_token','output_token','total_token','duration_ms','currency_minor')),
  value INTEGER CHECK (value IS NULL OR value >= 0),
  currency TEXT CHECK (currency IS NULL OR length(currency) = 3),
  occurred_at TEXT NOT NULL CHECK (length(occurred_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object')
) STRICT;

CREATE INDEX usage_task_call_idx ON usage_records(task_id, call_id);

CREATE TABLE price_books (
  price_book_id TEXT PRIMARY KEY CHECK (length(price_book_id) = 40 AND substr(price_book_id, 1, 4) = 'pbk_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  provider_id TEXT NOT NULL CHECK (length(provider_id) BETWEEN 1 AND 64),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 256),
  source_observed_at TEXT NOT NULL CHECK (length(source_observed_at) = 24),
  expires_at TEXT NOT NULL CHECK (length(expires_at) = 24),
  price_book_fingerprint TEXT NOT NULL UNIQUE CHECK (length(price_book_fingerprint) = 71 AND substr(price_book_fingerprint, 1, 7) = 'sha256:'),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object')
) STRICT;

CREATE TABLE budget_sets (
  budget_set_id TEXT PRIMARY KEY CHECK (length(budget_set_id) = 40 AND substr(budget_set_id, 1, 4) = 'bgt_'),
  task_id TEXT NOT NULL UNIQUE REFERENCES task_runs(task_id),
  price_book_id TEXT REFERENCES price_books(price_book_id),
  budget_fingerprint TEXT NOT NULL UNIQUE CHECK (length(budget_fingerprint) = 71 AND substr(budget_fingerprint, 1, 7) = 'sha256:'),
  action TEXT NOT NULL CHECK (action = 'stop_new_billable'),
  created_at TEXT NOT NULL CHECK (length(created_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (task_id, budget_set_id, budget_fingerprint) REFERENCES task_runs(task_id, budget_set_id, budget_fingerprint)
) STRICT;

CREATE TABLE budget_limits (
  budget_set_id TEXT NOT NULL REFERENCES budget_sets(budget_set_id),
  unit TEXT NOT NULL CHECK (unit IN ('call','input_token','output_token','total_token','duration_ms','currency_minor')),
  currency TEXT NOT NULL DEFAULT '' CHECK ((unit = 'currency_minor' AND length(currency) = 3) OR (unit <> 'currency_minor' AND currency = '')),
  hard_limit INTEGER NOT NULL CHECK (hard_limit >= 0),
  PRIMARY KEY (budget_set_id, unit, currency)
) STRICT, WITHOUT ROWID;

CREATE TABLE budget_reservations (
  budget_reservation_id TEXT PRIMARY KEY CHECK (length(budget_reservation_id) = 40 AND substr(budget_reservation_id, 1, 4) = 'brs_'),
  budget_set_id TEXT NOT NULL REFERENCES budget_sets(budget_set_id),
  call_id TEXT NOT NULL UNIQUE CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  status TEXT NOT NULL CHECK (status IN ('active','consumed','released','expired','reconciled')),
  possible_overage INTEGER NOT NULL CHECK (possible_overage IN (0, 1)),
  current_reservation_fingerprint TEXT NOT NULL UNIQUE CHECK (length(current_reservation_fingerprint) = 71 AND substr(current_reservation_fingerprint, 1, 7) = 'sha256:'),
  created_at TEXT NOT NULL CHECK (length(created_at) = 24),
  expires_at TEXT NOT NULL CHECK (length(expires_at) = 24),
  changed_at TEXT NOT NULL CHECK (length(changed_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  UNIQUE (budget_reservation_id, budget_set_id)
) STRICT;

CREATE TABLE budget_reservation_lifecycle (
  budget_reservation_id TEXT NOT NULL REFERENCES budget_reservations(budget_reservation_id),
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  from_status TEXT CHECK (from_status IS NULL OR from_status IN ('active','consumed','released','expired','reconciled')),
  to_status TEXT NOT NULL CHECK (to_status IN ('active','consumed','released','expired','reconciled')),
  possible_overage INTEGER NOT NULL CHECK (possible_overage IN (0, 1)),
  reservation_fingerprint TEXT NOT NULL UNIQUE CHECK (length(reservation_fingerprint) = 71 AND substr(reservation_fingerprint, 1, 7) = 'sha256:'),
  changed_at TEXT NOT NULL CHECK (length(changed_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  PRIMARY KEY (budget_reservation_id, sequence),
  UNIQUE (budget_reservation_id, reservation_fingerprint)
) STRICT, WITHOUT ROWID;

CREATE TABLE budget_reservation_lines (
  budget_reservation_id TEXT NOT NULL REFERENCES budget_reservations(budget_reservation_id),
  unit TEXT NOT NULL CHECK (unit IN ('call','input_token','output_token','total_token','duration_ms','currency_minor')),
  currency TEXT NOT NULL DEFAULT '' CHECK ((unit = 'currency_minor' AND length(currency) = 3) OR (unit <> 'currency_minor' AND currency = '')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  source TEXT NOT NULL CHECK (source IN ('configured_max','local_estimator','provider_quote','reconciliation')),
  PRIMARY KEY (budget_reservation_id, unit, currency)
) STRICT, WITHOUT ROWID;

CREATE TABLE budget_ledger (
  budget_set_id TEXT NOT NULL REFERENCES budget_sets(budget_set_id),
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  event_id TEXT NOT NULL UNIQUE REFERENCES events(event_id),
  budget_reservation_id TEXT REFERENCES budget_reservations(budget_reservation_id),
  usage_id TEXT REFERENCES usage_records(usage_id),
  classification TEXT NOT NULL CHECK (classification IN ('confirmed','reserved','released','possible_overage','adjustment')),
  unit TEXT NOT NULL CHECK (unit IN ('call','input_token','output_token','total_token','duration_ms','currency_minor')),
  currency TEXT NOT NULL DEFAULT '' CHECK ((unit = 'currency_minor' AND length(currency) = 3) OR (unit <> 'currency_minor' AND currency = '')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  source TEXT NOT NULL CHECK (source IN ('provider','local_estimator','reservation','reconciliation','operator')),
  occurred_at TEXT NOT NULL CHECK (length(occurred_at) = 24),
  entry_fingerprint TEXT NOT NULL UNIQUE CHECK (length(entry_fingerprint) = 71 AND substr(entry_fingerprint, 1, 7) = 'sha256:'),
  PRIMARY KEY (budget_set_id, sequence)
) STRICT, WITHOUT ROWID;

CREATE TABLE recovery_runs (
  recovery_run_id TEXT PRIMARY KEY CHECK (length(recovery_run_id) = 40 AND substr(recovery_run_id, 1, 4) = 'rcv_'),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  trigger_code TEXT NOT NULL CHECK (length(trigger_code) BETWEEN 1 AND 64),
  baseline_sequence INTEGER NOT NULL CHECK (baseline_sequence > 0),
  baseline_event_digest TEXT NOT NULL CHECK (length(baseline_event_digest) = 71 AND substr(baseline_event_digest, 1, 7) = 'sha256:'),
  scanner_profile_fingerprint TEXT NOT NULL CHECK (length(scanner_profile_fingerprint) = 71 AND substr(scanner_profile_fingerprint, 1, 7) = 'sha256:'),
  started_at TEXT NOT NULL CHECK (length(started_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object')
) STRICT;

CREATE TABLE effect_reconciliations (
  effect_intent_id TEXT PRIMARY KEY REFERENCES effect_intents(effect_intent_id),
  recovery_run_id TEXT NOT NULL REFERENCES recovery_runs(recovery_run_id),
  task_id TEXT NOT NULL REFERENCES task_runs(task_id),
  call_id TEXT NOT NULL CHECK (length(call_id) = 40 AND substr(call_id, 1, 4) = 'cal_'),
  observation TEXT NOT NULL CHECK (observation IN ('no_effect','observed_success','observed_failure','ambiguous')),
  disposition TEXT NOT NULL CHECK (disposition IN ('record_observation','no_retry','manual_required')),
  reconciled_at TEXT NOT NULL CHECK (length(reconciled_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object'),
  FOREIGN KEY (effect_intent_id, task_id, call_id) REFERENCES effect_intents(effect_intent_id, task_id, call_id)
) STRICT;

CREATE TABLE recovery_items (
  recovery_run_id TEXT NOT NULL REFERENCES recovery_runs(recovery_run_id),
  position INTEGER NOT NULL CHECK (position >= 0),
  subject_kind TEXT NOT NULL CHECK (subject_kind IN ('event_chain','artifact','effect','approval','budget','provider_call','projection')),
  subject_ref TEXT NOT NULL CHECK (length(subject_ref) BETWEEN 1 AND 512),
  observation TEXT NOT NULL CHECK (observation IN ('consistent','missing','divergent','ambiguous','reconciled')),
  disposition TEXT NOT NULL CHECK (disposition IN ('none','blocked','quarantined','replayed_projection','reconciled','manual_required')),
  evidence_digest TEXT CHECK (evidence_digest IS NULL OR (length(evidence_digest) = 71 AND substr(evidence_digest, 1, 7) = 'sha256:')),
  PRIMARY KEY (recovery_run_id, position)
) STRICT, WITHOUT ROWID;

CREATE UNIQUE INDEX recovery_items_subject_idx
ON recovery_items(recovery_run_id, subject_kind, subject_ref);

CREATE TABLE recovery_reports (
  recovery_run_id TEXT PRIMARY KEY REFERENCES recovery_runs(recovery_run_id),
  outcome TEXT NOT NULL CHECK (outcome IN ('completed','blocked','inconclusive')),
  report_artifact_id TEXT NOT NULL REFERENCES artifacts(artifact_id),
  remaining_ambiguities INTEGER NOT NULL CHECK (remaining_ambiguities >= 0),
  recommended_final_state TEXT CHECK (recommended_final_state IS NULL OR recommended_final_state IN ('falha','bloqueado','cancelado','inconclusivo')),
  report_fingerprint TEXT NOT NULL UNIQUE CHECK (length(report_fingerprint) = 71 AND substr(report_fingerprint, 1, 7) = 'sha256:'),
  finished_at TEXT NOT NULL CHECK (length(finished_at) = 24),
  canonical_json TEXT NOT NULL CHECK (json_valid(canonical_json) AND json_type(canonical_json) = 'object')
) STRICT;

CREATE TRIGGER task_manifests_no_update BEFORE UPDATE ON task_manifests BEGIN
  SELECT RAISE(ABORT, 'immutable.task_manifests');
END;
CREATE TRIGGER task_manifests_no_delete BEFORE DELETE ON task_manifests BEGIN
  SELECT RAISE(ABORT, 'immutable.task_manifests');
END;
CREATE TRIGGER effect_reconciliations_no_update BEFORE UPDATE ON effect_reconciliations BEGIN
  SELECT RAISE(ABORT, 'immutable.effect_reconciliations');
END;
CREATE TRIGGER effect_reconciliations_no_delete BEFORE DELETE ON effect_reconciliations BEGIN
  SELECT RAISE(ABORT, 'immutable.effect_reconciliations');
END;
CREATE TRIGGER events_insert_guard BEFORE INSERT ON events
WHEN NOT (
  NEW.correlation_id = (SELECT correlation_id FROM task_runs WHERE task_id = NEW.task_id) AND
  (
    (NEW.sequence = 1 AND NEW.event_type = 'task.created' AND NEW.previous_event_digest IS NULL AND
     NOT EXISTS (SELECT 1 FROM events WHERE task_id = NEW.task_id)) OR
    (NEW.sequence = COALESCE((SELECT MAX(sequence) FROM events WHERE task_id = NEW.task_id), 0) + 1 AND
     NEW.sequence > 1 AND
     NEW.previous_event_digest = (
       SELECT event_digest FROM events
       WHERE task_id = NEW.task_id AND sequence = NEW.sequence - 1
     ))
  ) AND
  (NEW.causation_event_id IS NULL OR EXISTS (
    SELECT 1 FROM events
    WHERE event_id = NEW.causation_event_id
      AND task_id = NEW.task_id
      AND sequence < NEW.sequence
  ))
)
BEGIN
  SELECT RAISE(ABORT, 'invalid.event_chain');
END;
CREATE TRIGGER budget_ledger_insert_guard BEFORE INSERT ON budget_ledger
WHEN
  NEW.sequence <> COALESCE((SELECT MAX(sequence) FROM budget_ledger WHERE budget_set_id = NEW.budget_set_id), 0) + 1 OR
  NOT EXISTS (
    SELECT 1 FROM events e
    JOIN budget_sets b ON b.task_id = e.task_id
    WHERE e.event_id = NEW.event_id AND b.budget_set_id = NEW.budget_set_id
  ) OR
  (NEW.budget_reservation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM budget_reservations
    WHERE budget_reservation_id = NEW.budget_reservation_id
      AND budget_set_id = NEW.budget_set_id
  )) OR
  (NEW.usage_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM usage_records u
    JOIN budget_sets b ON b.task_id = u.task_id
    WHERE u.usage_id = NEW.usage_id AND b.budget_set_id = NEW.budget_set_id
  ))
BEGIN
  SELECT RAISE(ABORT, 'invalid.budget_ledger_sequence');
END;
CREATE TRIGGER task_projections_insert_guard BEFORE INSERT ON task_projections
WHEN
  NEW.current_state <> 'created' OR
  NEW.last_sequence <> 1 OR
  NOT EXISTS (
    SELECT 1 FROM events
    WHERE task_id = NEW.task_id
      AND sequence = 1
      AND event_id = NEW.last_event_id
      AND event_digest = NEW.last_event_digest
      AND event_type = 'task.created'
      AND json_extract(payload_json, '$.initial_state') = 'created'
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid.task_projection_insert');
END;
CREATE TRIGGER task_projections_update_guard BEFORE UPDATE ON task_projections
WHEN
  NEW.task_id <> OLD.task_id OR
  NEW.projection_version <> OLD.projection_version OR
  NEW.last_sequence <> OLD.last_sequence + 1 OR
  NEW.updated_at < OLD.updated_at OR
  NOT EXISTS (
    SELECT 1 FROM events
    WHERE task_id = NEW.task_id
      AND sequence = NEW.last_sequence
      AND event_id = NEW.last_event_id
      AND event_digest = NEW.last_event_digest
  ) OR
  EXISTS (
    SELECT 1 FROM events
    WHERE event_id = NEW.last_event_id
      AND event_type <> 'task.transitioned'
      AND NEW.current_state <> OLD.current_state
  ) OR
  EXISTS (
    SELECT 1 FROM events
    WHERE event_id = NEW.last_event_id
      AND event_type = 'task.transitioned'
      AND (
        json_extract(payload_json, '$.from_state') IS NOT OLD.current_state OR
        json_extract(payload_json, '$.to_state') IS NOT NEW.current_state OR
        NOT (
          (OLD.current_state = 'created' AND NEW.current_state IN ('preflight','cancelado')) OR
          (OLD.current_state = 'preflight' AND NEW.current_state IN ('contextualizing','bloqueado','cancelado')) OR
          (OLD.current_state = 'contextualizing' AND NEW.current_state IN ('planned','bloqueado','cancelado')) OR
          (OLD.current_state = 'planned' AND NEW.current_state IN ('running','bloqueado','cancelado')) OR
          (OLD.current_state = 'running' AND NEW.current_state IN ('waiting_approval','verifying','falha','inconclusivo','cancelado')) OR
          (OLD.current_state = 'waiting_approval' AND NEW.current_state IN ('running','bloqueado','cancelado')) OR
          (OLD.current_state = 'verifying' AND NEW.current_state IN ('sucesso_verificado','falha','bloqueado','inconclusivo','cancelado'))
        )
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid.task_projection_update');
END;
CREATE TRIGGER task_runs_no_update BEFORE UPDATE ON task_runs BEGIN
  SELECT RAISE(ABORT, 'immutable.task_runs');
END;
CREATE TRIGGER task_runs_no_delete BEFORE DELETE ON task_runs BEGIN
  SELECT RAISE(ABORT, 'immutable.task_runs');
END;
CREATE TRIGGER context_queries_no_update BEFORE UPDATE ON context_queries BEGIN
  SELECT RAISE(ABORT, 'immutable.context_queries');
END;
CREATE TRIGGER context_queries_no_delete BEFORE DELETE ON context_queries BEGIN
  SELECT RAISE(ABORT, 'immutable.context_queries');
END;
CREATE TRIGGER context_items_no_update BEFORE UPDATE ON context_items BEGIN
  SELECT RAISE(ABORT, 'immutable.context_items');
END;
CREATE TRIGGER context_items_no_delete BEFORE DELETE ON context_items BEGIN
  SELECT RAISE(ABORT, 'immutable.context_items');
END;
CREATE TRIGGER context_packages_no_update BEFORE UPDATE ON context_packages BEGIN
  SELECT RAISE(ABORT, 'immutable.context_packages');
END;
CREATE TRIGGER context_packages_no_delete BEFORE DELETE ON context_packages BEGIN
  SELECT RAISE(ABORT, 'immutable.context_packages');
END;
CREATE TRIGGER context_package_items_no_update BEFORE UPDATE ON context_package_items BEGIN
  SELECT RAISE(ABORT, 'immutable.context_package_items');
END;
CREATE TRIGGER context_package_items_no_delete BEFORE DELETE ON context_package_items BEGIN
  SELECT RAISE(ABORT, 'immutable.context_package_items');
END;
CREATE TRIGGER provider_capability_snapshots_no_update BEFORE UPDATE ON provider_capability_snapshots BEGIN
  SELECT RAISE(ABORT, 'immutable.provider_capability_snapshots');
END;
CREATE TRIGGER provider_capability_snapshots_no_delete BEFORE DELETE ON provider_capability_snapshots BEGIN
  SELECT RAISE(ABORT, 'immutable.provider_capability_snapshots');
END;
CREATE TRIGGER plans_no_update BEFORE UPDATE ON plans BEGIN
  SELECT RAISE(ABORT, 'immutable.plans');
END;
CREATE TRIGGER plans_no_delete BEFORE DELETE ON plans BEGIN
  SELECT RAISE(ABORT, 'immutable.plans');
END;
CREATE TRIGGER plan_steps_no_update BEFORE UPDATE ON plan_steps BEGIN
  SELECT RAISE(ABORT, 'immutable.plan_steps');
END;
CREATE TRIGGER plan_steps_no_delete BEFORE DELETE ON plan_steps BEGIN
  SELECT RAISE(ABORT, 'immutable.plan_steps');
END;
CREATE TRIGGER effect_intent_grants_no_update BEFORE UPDATE ON effect_intent_grants BEGIN
  SELECT RAISE(ABORT, 'immutable.effect_intent_grants');
END;
CREATE TRIGGER effect_intent_grants_no_delete BEFORE DELETE ON effect_intent_grants BEGIN
  SELECT RAISE(ABORT, 'immutable.effect_intent_grants');
END;
CREATE TRIGGER budget_sets_no_update BEFORE UPDATE ON budget_sets BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_sets');
END;
CREATE TRIGGER budget_sets_no_delete BEFORE DELETE ON budget_sets BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_sets');
END;
CREATE TRIGGER budget_limits_no_update BEFORE UPDATE ON budget_limits BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_limits');
END;
CREATE TRIGGER budget_limits_no_delete BEFORE DELETE ON budget_limits BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_limits');
END;
CREATE TRIGGER budget_reservation_lines_no_update BEFORE UPDATE ON budget_reservation_lines BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_reservation_lines');
END;
CREATE TRIGGER budget_reservation_lines_no_delete BEFORE DELETE ON budget_reservation_lines BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_reservation_lines');
END;
CREATE TRIGGER events_no_update BEFORE UPDATE ON events BEGIN
  SELECT RAISE(ABORT, 'immutable.events');
END;
CREATE TRIGGER events_no_delete BEFORE DELETE ON events BEGIN
  SELECT RAISE(ABORT, 'immutable.events');
END;
CREATE TRIGGER approval_uses_no_update BEFORE UPDATE ON approval_uses BEGIN
  SELECT RAISE(ABORT, 'immutable.approval_uses');
END;
CREATE TRIGGER policy_decisions_no_update BEFORE UPDATE ON policy_decisions BEGIN
  SELECT RAISE(ABORT, 'immutable.policy_decisions');
END;
CREATE TRIGGER policy_decisions_no_delete BEFORE DELETE ON policy_decisions BEGIN
  SELECT RAISE(ABORT, 'immutable.policy_decisions');
END;
CREATE TRIGGER sandbox_profiles_no_update BEFORE UPDATE ON sandbox_profiles BEGIN
  SELECT RAISE(ABORT, 'immutable.sandbox_profiles');
END;
CREATE TRIGGER sandbox_profiles_no_delete BEFORE DELETE ON sandbox_profiles BEGIN
  SELECT RAISE(ABORT, 'immutable.sandbox_profiles');
END;
CREATE TRIGGER capability_grants_no_update BEFORE UPDATE ON capability_grants BEGIN
  SELECT RAISE(ABORT, 'immutable.capability_grants');
END;
CREATE TRIGGER capability_grants_no_delete BEFORE DELETE ON capability_grants BEGIN
  SELECT RAISE(ABORT, 'immutable.capability_grants');
END;
CREATE TRIGGER capability_revocations_no_update BEFORE UPDATE ON capability_revocations BEGIN
  SELECT RAISE(ABORT, 'immutable.capability_revocations');
END;
CREATE TRIGGER capability_revocations_no_delete BEFORE DELETE ON capability_revocations BEGIN
  SELECT RAISE(ABORT, 'immutable.capability_revocations');
END;
CREATE TRIGGER approval_grants_no_update BEFORE UPDATE ON approval_grants BEGIN
  SELECT RAISE(ABORT, 'immutable.approval_grants');
END;
CREATE TRIGGER approval_grants_no_delete BEFORE DELETE ON approval_grants BEGIN
  SELECT RAISE(ABORT, 'immutable.approval_grants');
END;
CREATE TRIGGER approval_revocations_no_update BEFORE UPDATE ON approval_revocations BEGIN
  SELECT RAISE(ABORT, 'immutable.approval_revocations');
END;
CREATE TRIGGER approval_revocations_no_delete BEFORE DELETE ON approval_revocations BEGIN
  SELECT RAISE(ABORT, 'immutable.approval_revocations');
END;
CREATE TRIGGER approval_uses_no_delete BEFORE DELETE ON approval_uses BEGIN
  SELECT RAISE(ABORT, 'immutable.approval_uses');
END;
CREATE TRIGGER provider_requests_no_update BEFORE UPDATE ON provider_requests BEGIN
  SELECT RAISE(ABORT, 'immutable.provider_requests');
END;
CREATE TRIGGER provider_requests_no_delete BEFORE DELETE ON provider_requests BEGIN
  SELECT RAISE(ABORT, 'immutable.provider_requests');
END;
CREATE TRIGGER provider_outcomes_no_update BEFORE UPDATE ON provider_outcomes BEGIN
  SELECT RAISE(ABORT, 'immutable.provider_outcomes');
END;
CREATE TRIGGER provider_outcomes_no_delete BEFORE DELETE ON provider_outcomes BEGIN
  SELECT RAISE(ABORT, 'immutable.provider_outcomes');
END;
CREATE TRIGGER effect_intents_no_delete BEFORE DELETE ON effect_intents BEGIN
  SELECT RAISE(ABORT, 'immutable.effect_intents');
END;
CREATE TRIGGER effect_intents_no_update BEFORE UPDATE ON effect_intents BEGIN
  SELECT RAISE(ABORT, 'immutable.effect_intents');
END;
CREATE TRIGGER tool_results_no_update BEFORE UPDATE ON tool_results BEGIN
  SELECT RAISE(ABORT, 'immutable.tool_results');
END;
CREATE TRIGGER tool_results_no_delete BEFORE DELETE ON tool_results BEGIN
  SELECT RAISE(ABORT, 'immutable.tool_results');
END;
CREATE TRIGGER usage_records_no_update BEFORE UPDATE ON usage_records BEGIN
  SELECT RAISE(ABORT, 'immutable.usage_records');
END;
CREATE TRIGGER usage_records_no_delete BEFORE DELETE ON usage_records BEGIN
  SELECT RAISE(ABORT, 'immutable.usage_records');
END;
CREATE TRIGGER verification_results_no_update BEFORE UPDATE ON verification_results BEGIN
  SELECT RAISE(ABORT, 'immutable.verification_results');
END;
CREATE TRIGGER verification_results_no_delete BEFORE DELETE ON verification_results BEGIN
  SELECT RAISE(ABORT, 'immutable.verification_results');
END;
CREATE TRIGGER schema_migrations_no_update BEFORE UPDATE ON schema_migrations BEGIN
  SELECT RAISE(ABORT, 'immutable.schema_migrations');
END;
CREATE TRIGGER schema_migrations_no_delete BEFORE DELETE ON schema_migrations BEGIN
  SELECT RAISE(ABORT, 'immutable.schema_migrations');
END;
CREATE TRIGGER budget_ledger_no_update BEFORE UPDATE ON budget_ledger BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_ledger');
END;
CREATE TRIGGER budget_ledger_no_delete BEFORE DELETE ON budget_ledger BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_ledger');
END;
CREATE TRIGGER price_books_no_update BEFORE UPDATE ON price_books BEGIN
  SELECT RAISE(ABORT, 'immutable.price_books');
END;
CREATE TRIGGER price_books_no_delete BEFORE DELETE ON price_books BEGIN
  SELECT RAISE(ABORT, 'immutable.price_books');
END;
CREATE TRIGGER recovery_runs_no_update BEFORE UPDATE ON recovery_runs BEGIN
  SELECT RAISE(ABORT, 'immutable.recovery_runs');
END;
CREATE TRIGGER recovery_runs_no_delete BEFORE DELETE ON recovery_runs BEGIN
  SELECT RAISE(ABORT, 'immutable.recovery_runs');
END;
CREATE TRIGGER recovery_items_no_update BEFORE UPDATE ON recovery_items BEGIN
  SELECT RAISE(ABORT, 'immutable.recovery_items');
END;
CREATE TRIGGER recovery_items_no_delete BEFORE DELETE ON recovery_items BEGIN
  SELECT RAISE(ABORT, 'immutable.recovery_items');
END;
CREATE TRIGGER recovery_reports_no_update BEFORE UPDATE ON recovery_reports BEGIN
  SELECT RAISE(ABORT, 'immutable.recovery_reports');
END;
CREATE TRIGGER recovery_reports_no_delete BEFORE DELETE ON recovery_reports BEGIN
  SELECT RAISE(ABORT, 'immutable.recovery_reports');
END;
CREATE TRIGGER artifact_lifecycle_no_update BEFORE UPDATE ON artifact_lifecycle BEGIN
  SELECT RAISE(ABORT, 'immutable.artifact_lifecycle');
END;
CREATE TRIGGER artifact_lifecycle_no_delete BEFORE DELETE ON artifact_lifecycle BEGIN
  SELECT RAISE(ABORT, 'immutable.artifact_lifecycle');
END;
CREATE TRIGGER artifact_lifecycle_insert_guard BEFORE INSERT ON artifact_lifecycle
WHEN NOT (
  (NEW.sequence = 1 AND NEW.from_state IS NULL AND NEW.to_state = 'staged' AND
   (SELECT lifecycle FROM artifacts WHERE artifact_id = NEW.artifact_id) = 'staged' AND
   (SELECT current_metadata_fingerprint FROM artifacts WHERE artifact_id = NEW.artifact_id) = NEW.metadata_fingerprint AND
   (SELECT lifecycle_changed_at FROM artifacts WHERE artifact_id = NEW.artifact_id) = NEW.occurred_at AND
   NOT EXISTS (SELECT 1 FROM artifact_lifecycle WHERE artifact_id = NEW.artifact_id)) OR
  (NEW.sequence = COALESCE((SELECT MAX(sequence) FROM artifact_lifecycle WHERE artifact_id = NEW.artifact_id), 0) + 1 AND
   NEW.from_state = (SELECT lifecycle FROM artifacts WHERE artifact_id = NEW.artifact_id) AND
   ((NEW.from_state = 'staged' AND NEW.to_state IN ('committed','quarantined')) OR
    (NEW.from_state = 'committed' AND NEW.to_state IN ('quarantined','tombstoned')) OR
    (NEW.from_state = 'quarantined' AND NEW.to_state = 'tombstoned')))
)
BEGIN
  SELECT RAISE(ABORT, 'invalid.artifact_lifecycle');
END;
CREATE TRIGGER budget_reservation_lifecycle_no_update BEFORE UPDATE ON budget_reservation_lifecycle BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_reservation_lifecycle');
END;
CREATE TRIGGER budget_reservation_lifecycle_no_delete BEFORE DELETE ON budget_reservation_lifecycle BEGIN
  SELECT RAISE(ABORT, 'immutable.budget_reservation_lifecycle');
END;
CREATE TRIGGER budget_reservation_lifecycle_insert_guard BEFORE INSERT ON budget_reservation_lifecycle
WHEN NOT (
  (NEW.sequence = 1 AND NEW.from_status IS NULL AND NEW.to_status = 'active' AND
   (SELECT status FROM budget_reservations WHERE budget_reservation_id = NEW.budget_reservation_id) = 'active' AND
   (SELECT current_reservation_fingerprint FROM budget_reservations WHERE budget_reservation_id = NEW.budget_reservation_id) = NEW.reservation_fingerprint AND
   (SELECT possible_overage FROM budget_reservations WHERE budget_reservation_id = NEW.budget_reservation_id) = NEW.possible_overage AND
   (SELECT changed_at FROM budget_reservations WHERE budget_reservation_id = NEW.budget_reservation_id) = NEW.changed_at AND
   NOT EXISTS (SELECT 1 FROM budget_reservation_lifecycle WHERE budget_reservation_id = NEW.budget_reservation_id)) OR
  (NEW.sequence = COALESCE((SELECT MAX(sequence) FROM budget_reservation_lifecycle WHERE budget_reservation_id = NEW.budget_reservation_id), 0) + 1 AND
   NEW.from_status = (SELECT status FROM budget_reservations WHERE budget_reservation_id = NEW.budget_reservation_id) AND
   NEW.from_status = 'active' AND NEW.to_status IN ('consumed','released','expired','reconciled'))
)
BEGIN
  SELECT RAISE(ABORT, 'invalid.budget_reservation_lifecycle');
END;
CREATE TRIGGER artifacts_transition_guard BEFORE UPDATE ON artifacts
WHEN
  NEW.artifact_id <> OLD.artifact_id OR
  NEW.task_id <> OLD.task_id OR
  NEW.profile <> OLD.profile OR
  NEW.digest <> OLD.digest OR
  NEW.size_bytes <> OLD.size_bytes OR
  NEW.media_type <> OLD.media_type OR
  NEW.data_class <> OLD.data_class OR
  NEW.storage_key <> OLD.storage_key OR
  NEW.created_at <> OLD.created_at OR
  NEW.current_metadata_fingerprint = OLD.current_metadata_fingerprint OR
  NEW.lifecycle_changed_at < OLD.lifecycle_changed_at OR
  NOT (
    (OLD.lifecycle = 'staged' AND NEW.lifecycle IN ('committed','quarantined')) OR
    (OLD.lifecycle = 'committed' AND NEW.lifecycle IN ('quarantined','tombstoned')) OR
    (OLD.lifecycle = 'quarantined' AND NEW.lifecycle = 'tombstoned')
  ) OR
  NOT EXISTS (
    SELECT 1 FROM artifact_lifecycle
    WHERE artifact_id = OLD.artifact_id
      AND sequence = (SELECT MAX(sequence) FROM artifact_lifecycle WHERE artifact_id = OLD.artifact_id)
      AND from_state = OLD.lifecycle
      AND to_state = NEW.lifecycle
      AND metadata_fingerprint = NEW.current_metadata_fingerprint
      AND occurred_at = NEW.lifecycle_changed_at
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid.artifact_transition');
END;
CREATE TRIGGER budget_reservation_transition_guard BEFORE UPDATE ON budget_reservations
WHEN
  NEW.budget_reservation_id <> OLD.budget_reservation_id OR
  NEW.budget_set_id <> OLD.budget_set_id OR
  NEW.call_id <> OLD.call_id OR
  NEW.created_at <> OLD.created_at OR
  NEW.expires_at <> OLD.expires_at OR
  OLD.status <> 'active' OR
  NEW.status NOT IN ('consumed','released','expired','reconciled') OR
  NEW.current_reservation_fingerprint = OLD.current_reservation_fingerprint OR
  NEW.changed_at < OLD.changed_at OR
  (OLD.possible_overage = 1 AND NEW.possible_overage = 0) OR
  NOT EXISTS (
    SELECT 1 FROM budget_reservation_lifecycle
    WHERE budget_reservation_id = OLD.budget_reservation_id
      AND sequence = (SELECT MAX(sequence) FROM budget_reservation_lifecycle WHERE budget_reservation_id = OLD.budget_reservation_id)
      AND from_status = OLD.status
      AND to_status = NEW.status
      AND possible_overage = NEW.possible_overage
      AND reservation_fingerprint = NEW.current_reservation_fingerprint
      AND changed_at = NEW.changed_at
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid.budget_reservation_transition');
END;
