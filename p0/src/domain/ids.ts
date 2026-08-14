/**
 * Typed opaque IDs for P0 entities
 *
 * Implements all ID types from ADR-003 and ADR-007 with opaque types,
 * type-specific parsing, and validation.
 */

import type { UuidV4Generator } from "../ports/id-generator.ts";

/**
 * Error for invalid ID values
 */
export class InvalidIdError extends Error {
  readonly code = "invalid.id";
  readonly expectedType: string;

  constructor(expectedType: string, message: string) {
    super(message);
    this.name = "InvalidIdError";
    this.expectedType = expectedType;
  }
}

/*
 * Nominal brand symbols for every ID type (P2-R05).
 *
 * These declarations are intentionally NOT exported: no code outside this
 * module can name the symbol, so the branded interfaces cannot be fabricated
 * or aliased. They are type-only — `unique symbol` is erased at runtime, and
 * the runtime objects returned by the parse/create functions remain plain `{ value }`.
 */
declare const projectIdBrand: unique symbol;
declare const workspaceIdBrand: unique symbol;
declare const principalIdBrand: unique symbol;
declare const taskIdBrand: unique symbol;
declare const manifestIdBrand: unique symbol;
declare const planIdBrand: unique symbol;
declare const stepIdBrand: unique symbol;
declare const eventIdBrand: unique symbol;
declare const correlationIdBrand: unique symbol;
declare const callIdBrand: unique symbol;
declare const policyDecisionIdBrand: unique symbol;
declare const approvalIdBrand: unique symbol;
declare const approvalUseIdBrand: unique symbol;
declare const nonceBrand: unique symbol;
declare const effectIntentIdBrand: unique symbol;
declare const verificationIdBrand: unique symbol;
declare const usageIdBrand: unique symbol;
declare const criterionIdBrand: unique symbol;
declare const attemptIdBrand: unique symbol;
declare const providerRequestIdBrand: unique symbol;
declare const contextQueryIdBrand: unique symbol;
declare const contextItemIdBrand: unique symbol;
declare const contextPackageIdBrand: unique symbol;
declare const artifactIdBrand: unique symbol;
declare const budgetSetIdBrand: unique symbol;
declare const budgetReservationIdBrand: unique symbol;
declare const priceBookIdBrand: unique symbol;
declare const capabilityGrantIdBrand: unique symbol;
declare const recoveryRunIdBrand: unique symbol;

/**
 * Opaque type for ProjectId
 */
export interface ProjectId {
  readonly [projectIdBrand]: "ProjectId";
  readonly value: string;
}

/**
 * Opaque type for WorkspaceId
 */
export interface WorkspaceId {
  readonly [workspaceIdBrand]: "WorkspaceId";
  readonly value: string;
}

/**
 * Opaque type for PrincipalId
 */
export interface PrincipalId {
  readonly [principalIdBrand]: "PrincipalId";
  readonly value: string;
}

/**
 * Opaque type for TaskId
 */
export interface TaskId {
  readonly [taskIdBrand]: "TaskId";
  readonly value: string;
}

/**
 * Opaque type for ManifestId
 */
export interface ManifestId {
  readonly [manifestIdBrand]: "ManifestId";
  readonly value: string;
}

/**
 * Opaque type for PlanId
 */
export interface PlanId {
  readonly [planIdBrand]: "PlanId";
  readonly value: string;
}

/**
 * Opaque type for StepId
 */
export interface StepId {
  readonly [stepIdBrand]: "StepId";
  readonly value: string;
}

/**
 * Opaque type for EventId
 */
export interface EventId {
  readonly [eventIdBrand]: "EventId";
  readonly value: string;
}

/**
 * Opaque type for CorrelationId
 */
export interface CorrelationId {
  readonly [correlationIdBrand]: "CorrelationId";
  readonly value: string;
}

/**
 * Opaque type for CallId
 */
export interface CallId {
  readonly [callIdBrand]: "CallId";
  readonly value: string;
}

/**
 * Opaque type for PolicyDecisionId
 */
export interface PolicyDecisionId {
  readonly [policyDecisionIdBrand]: "PolicyDecisionId";
  readonly value: string;
}

/**
 * Opaque type for ApprovalId
 */
export interface ApprovalId {
  readonly [approvalIdBrand]: "ApprovalId";
  readonly value: string;
}

/**
 * Opaque type for ApprovalUseId
 */
export interface ApprovalUseId {
  readonly [approvalUseIdBrand]: "ApprovalUseId";
  readonly value: string;
}

/**
 * Opaque type for Nonce
 */
export interface Nonce {
  readonly [nonceBrand]: "Nonce";
  readonly value: string;
}

/**
 * Opaque type for EffectIntentId
 */
export interface EffectIntentId {
  readonly [effectIntentIdBrand]: "EffectIntentId";
  readonly value: string;
}

/**
 * Opaque type for VerificationId
 */
export interface VerificationId {
  readonly [verificationIdBrand]: "VerificationId";
  readonly value: string;
}

/**
 * Opaque type for UsageId
 */
export interface UsageId {
  readonly [usageIdBrand]: "UsageId";
  readonly value: string;
}

/**
 * Opaque type for CriterionId
 */
export interface CriterionId {
  readonly [criterionIdBrand]: "CriterionId";
  readonly value: string;
}

/**
 * Opaque type for AttemptId
 */
export interface AttemptId {
  readonly [attemptIdBrand]: "AttemptId";
  readonly value: string;
}

/**
 * Opaque type for ProviderRequestId
 */
export interface ProviderRequestId {
  readonly [providerRequestIdBrand]: "ProviderRequestId";
  readonly value: string;
}

/**
 * Opaque type for ContextQueryId
 */
export interface ContextQueryId {
  readonly [contextQueryIdBrand]: "ContextQueryId";
  readonly value: string;
}

/**
 * Opaque type for ContextItemId
 */
export interface ContextItemId {
  readonly [contextItemIdBrand]: "ContextItemId";
  readonly value: string;
}

/**
 * Opaque type for ContextPackageId
 */
export interface ContextPackageId {
  readonly [contextPackageIdBrand]: "ContextPackageId";
  readonly value: string;
}

/**
 * Opaque type for ArtifactId
 */
export interface ArtifactId {
  readonly [artifactIdBrand]: "ArtifactId";
  readonly value: string;
}

/**
 * Opaque type for BudgetSetId
 */
export interface BudgetSetId {
  readonly [budgetSetIdBrand]: "BudgetSetId";
  readonly value: string;
}

/**
 * Opaque type for BudgetReservationId
 */
export interface BudgetReservationId {
  readonly [budgetReservationIdBrand]: "BudgetReservationId";
  readonly value: string;
}

/**
 * Opaque type for PriceBookId
 */
export interface PriceBookId {
  readonly [priceBookIdBrand]: "PriceBookId";
  readonly value: string;
}

/**
 * Opaque type for CapabilityGrantId
 */
export interface CapabilityGrantId {
  readonly [capabilityGrantIdBrand]: "CapabilityGrantId";
  readonly value: string;
}

/**
 * Opaque type for RecoveryRunId
 */
export interface RecoveryRunId {
  readonly [recoveryRunIdBrand]: "RecoveryRunId";
  readonly value: string;
}

/**
 * UUID v4 pattern: lowercase, version 4, variant 10
 */
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Validates a UUID v4 string
 */
function isValidUuidV4(uuid: string): boolean {
  return UUID_V4_PATTERN.test(uuid);
}

/**
 * Validates an ID with a specific prefix
 */
function validateIdPrefix(value: string, prefix: string): boolean {
  if (!value.startsWith(prefix + "_")) {
    return false;
  }
  const uuidPart = value.slice(prefix.length + 1);
  return isValidUuidV4(uuidPart);
}

/**
 * Parses a ProjectId from unknown input
 */
export function parseProjectId(value: unknown): ProjectId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ProjectId", "ProjectId must be a string");
  }
  if (!validateIdPrefix(value, "prj")) {
    throw new InvalidIdError("ProjectId", "Invalid ProjectId format");
  }
  return { value } as ProjectId;
}

/**
 * Parses a WorkspaceId from unknown input
 */
export function parseWorkspaceId(value: unknown): WorkspaceId {
  if (typeof value !== "string") {
    throw new InvalidIdError("WorkspaceId", "WorkspaceId must be a string");
  }
  if (!validateIdPrefix(value, "wsp")) {
    throw new InvalidIdError("WorkspaceId", "Invalid WorkspaceId format");
  }
  return { value } as WorkspaceId;
}

/**
 * Parses a PrincipalId from unknown input
 */
export function parsePrincipalId(value: unknown): PrincipalId {
  if (typeof value !== "string") {
    throw new InvalidIdError("PrincipalId", "PrincipalId must be a string");
  }
  if (!validateIdPrefix(value, "prn")) {
    throw new InvalidIdError("PrincipalId", "Invalid PrincipalId format");
  }
  return { value } as PrincipalId;
}

/**
 * Parses a TaskId from unknown input
 */
export function parseTaskId(value: unknown): TaskId {
  if (typeof value !== "string") {
    throw new InvalidIdError("TaskId", "TaskId must be a string");
  }
  if (!validateIdPrefix(value, "tsk")) {
    throw new InvalidIdError("TaskId", "Invalid TaskId format");
  }
  return { value } as TaskId;
}

/**
 * Parses a ManifestId from unknown input
 */
export function parseManifestId(value: unknown): ManifestId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ManifestId", "ManifestId must be a string");
  }
  if (!validateIdPrefix(value, "mft")) {
    throw new InvalidIdError("ManifestId", "Invalid ManifestId format");
  }
  return { value } as ManifestId;
}

/**
 * Parses a PlanId from unknown input
 */
export function parsePlanId(value: unknown): PlanId {
  if (typeof value !== "string") {
    throw new InvalidIdError("PlanId", "PlanId must be a string");
  }
  if (!validateIdPrefix(value, "pln")) {
    throw new InvalidIdError("PlanId", "Invalid PlanId format");
  }
  return { value } as PlanId;
}

/**
 * Parses a StepId from unknown input
 */
export function parseStepId(value: unknown): StepId {
  if (typeof value !== "string") {
    throw new InvalidIdError("StepId", "StepId must be a string");
  }
  if (!validateIdPrefix(value, "stp")) {
    throw new InvalidIdError("StepId", "Invalid StepId format");
  }
  return { value } as StepId;
}

/**
 * Parses an EventId from unknown input
 */
export function parseEventId(value: unknown): EventId {
  if (typeof value !== "string") {
    throw new InvalidIdError("EventId", "EventId must be a string");
  }
  if (!validateIdPrefix(value, "evt")) {
    throw new InvalidIdError("EventId", "Invalid EventId format");
  }
  return { value } as EventId;
}

/**
 * Parses a CorrelationId from unknown input
 */
export function parseCorrelationId(value: unknown): CorrelationId {
  if (typeof value !== "string") {
    throw new InvalidIdError("CorrelationId", "CorrelationId must be a string");
  }
  if (!validateIdPrefix(value, "cor")) {
    throw new InvalidIdError("CorrelationId", "Invalid CorrelationId format");
  }
  return { value } as CorrelationId;
}

/**
 * Parses a CallId from unknown input
 */
export function parseCallId(value: unknown): CallId {
  if (typeof value !== "string") {
    throw new InvalidIdError("CallId", "CallId must be a string");
  }
  if (!validateIdPrefix(value, "cal")) {
    throw new InvalidIdError("CallId", "Invalid CallId format");
  }
  return { value } as CallId;
}

/**
 * Parses a PolicyDecisionId from unknown input
 */
export function parsePolicyDecisionId(value: unknown): PolicyDecisionId {
  if (typeof value !== "string") {
    throw new InvalidIdError("PolicyDecisionId", "PolicyDecisionId must be a string");
  }
  if (!validateIdPrefix(value, "pdc")) {
    throw new InvalidIdError("PolicyDecisionId", "Invalid PolicyDecisionId format");
  }
  return { value } as PolicyDecisionId;
}

/**
 * Parses an ApprovalId from unknown input
 */
export function parseApprovalId(value: unknown): ApprovalId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ApprovalId", "ApprovalId must be a string");
  }
  if (!validateIdPrefix(value, "apr")) {
    throw new InvalidIdError("ApprovalId", "Invalid ApprovalId format");
  }
  return { value } as ApprovalId;
}

/**
 * Parses an ApprovalUseId from unknown input
 */
export function parseApprovalUseId(value: unknown): ApprovalUseId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ApprovalUseId", "ApprovalUseId must be a string");
  }
  if (!validateIdPrefix(value, "apu")) {
    throw new InvalidIdError("ApprovalUseId", "Invalid ApprovalUseId format");
  }
  return { value } as ApprovalUseId;
}

/**
 * Parses a Nonce from unknown input
 */
export function parseNonce(value: unknown): Nonce {
  if (typeof value !== "string") {
    throw new InvalidIdError("Nonce", "Nonce must be a string");
  }
  if (!validateIdPrefix(value, "non")) {
    throw new InvalidIdError("Nonce", "Invalid Nonce format");
  }
  return { value } as Nonce;
}

/**
 * Parses an EffectIntentId from unknown input
 */
export function parseEffectIntentId(value: unknown): EffectIntentId {
  if (typeof value !== "string") {
    throw new InvalidIdError("EffectIntentId", "EffectIntentId must be a string");
  }
  if (!validateIdPrefix(value, "efi")) {
    throw new InvalidIdError("EffectIntentId", "Invalid EffectIntentId format");
  }
  return { value } as EffectIntentId;
}

/**
 * Parses a VerificationId from unknown input
 */
export function parseVerificationId(value: unknown): VerificationId {
  if (typeof value !== "string") {
    throw new InvalidIdError("VerificationId", "VerificationId must be a string");
  }
  if (!validateIdPrefix(value, "vrf")) {
    throw new InvalidIdError("VerificationId", "Invalid VerificationId format");
  }
  return { value } as VerificationId;
}

/**
 * Parses a UsageId from unknown input
 */
export function parseUsageId(value: unknown): UsageId {
  if (typeof value !== "string") {
    throw new InvalidIdError("UsageId", "UsageId must be a string");
  }
  if (!validateIdPrefix(value, "use")) {
    throw new InvalidIdError("UsageId", "Invalid UsageId format");
  }
  return { value } as UsageId;
}

/**
 * Parses a CriterionId from unknown input
 */
export function parseCriterionId(value: unknown): CriterionId {
  if (typeof value !== "string") {
    throw new InvalidIdError("CriterionId", "CriterionId must be a string");
  }
  if (!validateIdPrefix(value, "crt")) {
    throw new InvalidIdError("CriterionId", "Invalid CriterionId format");
  }
  return { value } as CriterionId;
}

/**
 * Parses an AttemptId from unknown input
 */
export function parseAttemptId(value: unknown): AttemptId {
  if (typeof value !== "string") {
    throw new InvalidIdError("AttemptId", "AttemptId must be a string");
  }
  if (!validateIdPrefix(value, "atm")) {
    throw new InvalidIdError("AttemptId", "Invalid AttemptId format");
  }
  return { value } as AttemptId;
}

/**
 * Parses a ProviderRequestId from unknown input
 */
export function parseProviderRequestId(value: unknown): ProviderRequestId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ProviderRequestId", "ProviderRequestId must be a string");
  }
  if (!validateIdPrefix(value, "pvr")) {
    throw new InvalidIdError("ProviderRequestId", "Invalid ProviderRequestId format");
  }
  return { value } as ProviderRequestId;
}

/**
 * Parses a ContextQueryId from unknown input
 */
export function parseContextQueryId(value: unknown): ContextQueryId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ContextQueryId", "ContextQueryId must be a string");
  }
  if (!validateIdPrefix(value, "cxq")) {
    throw new InvalidIdError("ContextQueryId", "Invalid ContextQueryId format");
  }
  return { value } as ContextQueryId;
}

/**
 * Parses a ContextItemId from unknown input
 */
export function parseContextItemId(value: unknown): ContextItemId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ContextItemId", "ContextItemId must be a string");
  }
  if (!validateIdPrefix(value, "cxi")) {
    throw new InvalidIdError("ContextItemId", "Invalid ContextItemId format");
  }
  return { value } as ContextItemId;
}

/**
 * Parses a ContextPackageId from unknown input
 */
export function parseContextPackageId(value: unknown): ContextPackageId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ContextPackageId", "ContextPackageId must be a string");
  }
  if (!validateIdPrefix(value, "cxp")) {
    throw new InvalidIdError("ContextPackageId", "Invalid ContextPackageId format");
  }
  return { value } as ContextPackageId;
}

/**
 * Parses an ArtifactId from unknown input
 */
export function parseArtifactId(value: unknown): ArtifactId {
  if (typeof value !== "string") {
    throw new InvalidIdError("ArtifactId", "ArtifactId must be a string");
  }
  if (!validateIdPrefix(value, "art")) {
    throw new InvalidIdError("ArtifactId", "Invalid ArtifactId format");
  }
  return { value } as ArtifactId;
}

/**
 * Parses a BudgetSetId from unknown input
 */
export function parseBudgetSetId(value: unknown): BudgetSetId {
  if (typeof value !== "string") {
    throw new InvalidIdError("BudgetSetId", "BudgetSetId must be a string");
  }
  if (!validateIdPrefix(value, "bgt")) {
    throw new InvalidIdError("BudgetSetId", "Invalid BudgetSetId format");
  }
  return { value } as BudgetSetId;
}

/**
 * Parses a BudgetReservationId from unknown input
 */
export function parseBudgetReservationId(value: unknown): BudgetReservationId {
  if (typeof value !== "string") {
    throw new InvalidIdError("BudgetReservationId", "BudgetReservationId must be a string");
  }
  if (!validateIdPrefix(value, "brs")) {
    throw new InvalidIdError("BudgetReservationId", "Invalid BudgetReservationId format");
  }
  return { value } as BudgetReservationId;
}

/**
 * Parses a PriceBookId from unknown input
 */
export function parsePriceBookId(value: unknown): PriceBookId {
  if (typeof value !== "string") {
    throw new InvalidIdError("PriceBookId", "PriceBookId must be a string");
  }
  if (!validateIdPrefix(value, "pbk")) {
    throw new InvalidIdError("PriceBookId", "Invalid PriceBookId format");
  }
  return { value } as PriceBookId;
}

/**
 * Parses a CapabilityGrantId from unknown input
 */
export function parseCapabilityGrantId(value: unknown): CapabilityGrantId {
  if (typeof value !== "string") {
    throw new InvalidIdError("CapabilityGrantId", "CapabilityGrantId must be a string");
  }
  if (!validateIdPrefix(value, "cpg")) {
    throw new InvalidIdError("CapabilityGrantId", "Invalid CapabilityGrantId format");
  }
  return { value } as CapabilityGrantId;
}

/**
 * Parses a RecoveryRunId from unknown input
 */
export function parseRecoveryRunId(value: unknown): RecoveryRunId {
  if (typeof value !== "string") {
    throw new InvalidIdError("RecoveryRunId", "RecoveryRunId must be a string");
  }
  if (!validateIdPrefix(value, "rcv")) {
    throw new InvalidIdError("RecoveryRunId", "Invalid RecoveryRunId format");
  }
  return { value } as RecoveryRunId;
}

/**
 * Creates a ProjectId using the provided UUID generator
 */
export function createProjectId(generator: UuidV4Generator): ProjectId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ProjectId", "Generator produced invalid UUID v4");
  }
  return { value: `prj_${uuid}` } as ProjectId;
}

/**
 * Creates a WorkspaceId using the provided UUID generator
 */
export function createWorkspaceId(generator: UuidV4Generator): WorkspaceId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("WorkspaceId", "Generator produced invalid UUID v4");
  }
  return { value: `wsp_${uuid}` } as WorkspaceId;
}

/**
 * Creates a PrincipalId using the provided UUID generator
 */
export function createPrincipalId(generator: UuidV4Generator): PrincipalId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("PrincipalId", "Generator produced invalid UUID v4");
  }
  return { value: `prn_${uuid}` } as PrincipalId;
}

/**
 * Creates a TaskId using the provided UUID generator
 */
export function createTaskId(generator: UuidV4Generator): TaskId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("TaskId", "Generator produced invalid UUID v4");
  }
  return { value: `tsk_${uuid}` } as TaskId;
}

/**
 * Creates a ManifestId using the provided UUID generator
 */
export function createManifestId(generator: UuidV4Generator): ManifestId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ManifestId", "Generator produced invalid UUID v4");
  }
  return { value: `mft_${uuid}` } as ManifestId;
}

/**
 * Creates a PlanId using the provided UUID generator
 */
export function createPlanId(generator: UuidV4Generator): PlanId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("PlanId", "Generator produced invalid UUID v4");
  }
  return { value: `pln_${uuid}` } as PlanId;
}

/**
 * Creates a StepId using the provided UUID generator
 */
export function createStepId(generator: UuidV4Generator): StepId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("StepId", "Generator produced invalid UUID v4");
  }
  return { value: `stp_${uuid}` } as StepId;
}

/**
 * Creates an EventId using the provided UUID generator
 */
export function createEventId(generator: UuidV4Generator): EventId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("EventId", "Generator produced invalid UUID v4");
  }
  return { value: `evt_${uuid}` } as EventId;
}

/**
 * Creates a CorrelationId using the provided UUID generator
 */
export function createCorrelationId(generator: UuidV4Generator): CorrelationId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("CorrelationId", "Generator produced invalid UUID v4");
  }
  return { value: `cor_${uuid}` } as CorrelationId;
}

/**
 * Creates a CallId using the provided UUID generator
 */
export function createCallId(generator: UuidV4Generator): CallId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("CallId", "Generator produced invalid UUID v4");
  }
  return { value: `cal_${uuid}` } as CallId;
}

/**
 * Creates a PolicyDecisionId using the provided UUID generator
 */
export function createPolicyDecisionId(generator: UuidV4Generator): PolicyDecisionId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("PolicyDecisionId", "Generator produced invalid UUID v4");
  }
  return { value: `pdc_${uuid}` } as PolicyDecisionId;
}

/**
 * Creates an ApprovalId using the provided UUID generator
 */
export function createApprovalId(generator: UuidV4Generator): ApprovalId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ApprovalId", "Generator produced invalid UUID v4");
  }
  return { value: `apr_${uuid}` } as ApprovalId;
}

/**
 * Creates an ApprovalUseId using the provided UUID generator
 */
export function createApprovalUseId(generator: UuidV4Generator): ApprovalUseId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ApprovalUseId", "Generator produced invalid UUID v4");
  }
  return { value: `apu_${uuid}` } as ApprovalUseId;
}

/**
 * Creates a Nonce using the provided UUID generator
 */
export function createNonce(generator: UuidV4Generator): Nonce {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("Nonce", "Generator produced invalid UUID v4");
  }
  return { value: `non_${uuid}` } as Nonce;
}

/**
 * Creates an EffectIntentId using the provided UUID generator
 */
export function createEffectIntentId(generator: UuidV4Generator): EffectIntentId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("EffectIntentId", "Generator produced invalid UUID v4");
  }
  return { value: `efi_${uuid}` } as EffectIntentId;
}

/**
 * Creates a VerificationId using the provided UUID generator
 */
export function createVerificationId(generator: UuidV4Generator): VerificationId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("VerificationId", "Generator produced invalid UUID v4");
  }
  return { value: `vrf_${uuid}` } as VerificationId;
}

/**
 * Creates a UsageId using the provided UUID generator
 */
export function createUsageId(generator: UuidV4Generator): UsageId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("UsageId", "Generator produced invalid UUID v4");
  }
  return { value: `use_${uuid}` } as UsageId;
}

/**
 * Creates a CriterionId using the provided UUID generator
 */
export function createCriterionId(generator: UuidV4Generator): CriterionId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("CriterionId", "Generator produced invalid UUID v4");
  }
  return { value: `crt_${uuid}` } as CriterionId;
}

/**
 * Creates an AttemptId using the provided UUID generator
 */
export function createAttemptId(generator: UuidV4Generator): AttemptId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("AttemptId", "Generator produced invalid UUID v4");
  }
  return { value: `atm_${uuid}` } as AttemptId;
}

/**
 * Creates a ProviderRequestId using the provided UUID generator
 */
export function createProviderRequestId(generator: UuidV4Generator): ProviderRequestId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ProviderRequestId", "Generator produced invalid UUID v4");
  }
  return { value: `pvr_${uuid}` } as ProviderRequestId;
}

/**
 * Creates a ContextQueryId using the provided UUID generator
 */
export function createContextQueryId(generator: UuidV4Generator): ContextQueryId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ContextQueryId", "Generator produced invalid UUID v4");
  }
  return { value: `cxq_${uuid}` } as ContextQueryId;
}

/**
 * Creates a ContextItemId using the provided UUID generator
 */
export function createContextItemId(generator: UuidV4Generator): ContextItemId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ContextItemId", "Generator produced invalid UUID v4");
  }
  return { value: `cxi_${uuid}` } as ContextItemId;
}

/**
 * Creates a ContextPackageId using the provided UUID generator
 */
export function createContextPackageId(generator: UuidV4Generator): ContextPackageId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ContextPackageId", "Generator produced invalid UUID v4");
  }
  return { value: `cxp_${uuid}` } as ContextPackageId;
}

/**
 * Creates an ArtifactId using the provided UUID generator
 */
export function createArtifactId(generator: UuidV4Generator): ArtifactId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("ArtifactId", "Generator produced invalid UUID v4");
  }
  return { value: `art_${uuid}` } as ArtifactId;
}

/**
 * Creates a BudgetSetId using the provided UUID generator
 */
export function createBudgetSetId(generator: UuidV4Generator): BudgetSetId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("BudgetSetId", "Generator produced invalid UUID v4");
  }
  return { value: `bgt_${uuid}` } as BudgetSetId;
}

/**
 * Creates a BudgetReservationId using the provided UUID generator
 */
export function createBudgetReservationId(generator: UuidV4Generator): BudgetReservationId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("BudgetReservationId", "Generator produced invalid UUID v4");
  }
  return { value: `brs_${uuid}` } as BudgetReservationId;
}

/**
 * Creates a PriceBookId using the provided UUID generator
 */
export function createPriceBookId(generator: UuidV4Generator): PriceBookId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("PriceBookId", "Generator produced invalid UUID v4");
  }
  return { value: `pbk_${uuid}` } as PriceBookId;
}

/**
 * Creates a CapabilityGrantId using the provided UUID generator
 */
export function createCapabilityGrantId(generator: UuidV4Generator): CapabilityGrantId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("CapabilityGrantId", "Generator produced invalid UUID v4");
  }
  return { value: `cpg_${uuid}` } as CapabilityGrantId;
}

/**
 * Creates a RecoveryRunId using the provided UUID generator
 */
export function createRecoveryRunId(generator: UuidV4Generator): RecoveryRunId {
  const uuid = generator.generate();
  if (!isValidUuidV4(uuid)) {
    throw new InvalidIdError("RecoveryRunId", "Generator produced invalid UUID v4");
  }
  return { value: `rcv_${uuid}` } as RecoveryRunId;
}
