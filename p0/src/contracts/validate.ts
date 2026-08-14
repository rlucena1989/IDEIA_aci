/**
 * Contract validation using pre-generated validators
 *
 * Runtime imports generated validators and provides a closed registry.
 * Does not initialize or compile Ajv at runtime.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import * as validators from "./validators.generated.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract map from JSON
const contractMapPath = path.join(__dirname, "contract-map.generated.json");

function getContractMap() {
  return JSON.parse(fs.readFileSync(contractMapPath, "utf-8"));
}

/**
 * Error for contract validation failures
 */
export class ContractValidationError extends Error {
  readonly code = "contract.validation.failed";
  readonly contractId: string;

  constructor(contractId: string, message: string) {
    super(message);
    this.name = "ContractValidationError";
    this.contractId = contractId;
  }
}

/**
 * Error for unknown contract
 */
export class UnknownContractError extends Error {
  readonly code = "contract.unknown";
  readonly contractId: string;

  constructor(contractId: string) {
    super(`Unknown contract: ${contractId}`);
    this.name = "UnknownContractError";
    this.contractId = contractId;
  }
}

/**
 * Validate a contract instance
 *
 * @param contractId - Contract identifier (e.g., "ideia.task-manifest/1")
 * @param data - Data to validate
 * @returns Validated data
 * @throws UnknownContractError if contract is not in catalog
 * @throws ContractValidationError if validation fails
 */
export function validateContract(contractId: string, data: unknown): unknown {
  const contractMap = getContractMap();
  const validatorName = contractMap.contractIdToValidatorName?.[contractId];

  if (!validatorName) {
    throw new UnknownContractError(contractId);
  }

  const validator = (validators as Record<string, ((data: unknown) => boolean) & { errors?: Array<{ message?: string }> }>)[validatorName];
  if (!validator || typeof validator !== "function") {
    throw new UnknownContractError(contractId);
  }

  const valid = validator(data);
  if (!valid) {
    const errors = validator.errors?.map((e) => e.message).join("; ") || "unknown error";
    throw new ContractValidationError(contractId, `Validation failed: ${errors}`);
  }

  return data;
}

/**
 * Get all available contract IDs
 */
export function getContractIds(): readonly string[] {
  const contractMap = getContractMap();
  return contractMap.contractIds;
}
