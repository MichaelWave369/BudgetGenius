import { EFFECT_CLASS, RISK_CLASS } from "./constants.js";

const effects = new Set(Object.values(EFFECT_CLASS));
const risks = new Set(Object.values(RISK_CLASS));

function unitInterval(name, value) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError(`${name} must be a finite number in [0, 1]`);
  }
}

export function validateMandate(mandate) {
  if (!mandate || typeof mandate !== "object") throw new TypeError("mandate is required");
  for (const key of ["mandateId", "objective", "poolId"]) {
    if (typeof mandate[key] !== "string" || mandate[key].trim() === "") {
      throw new TypeError(`${key} must be a non-empty string`);
    }
  }
  unitInterval("qualityFloor", mandate.qualityFloor);
  unitInterval("evidenceFloor", mandate.evidenceFloor);
  unitInterval("maxRiskScore", mandate.maxRiskScore);
  if (!Number.isFinite(mandate.maxCostUsd) || mandate.maxCostUsd < 0) {
    throw new TypeError("maxCostUsd must be a finite non-negative number");
  }
  if (!Array.isArray(mandate.authority)) throw new TypeError("authority must be an array");
  if (!effects.has(mandate.effectClass)) throw new TypeError("invalid effectClass");
  if (!risks.has(mandate.riskClass)) throw new TypeError("invalid riskClass");
  return true;
}

export function createMandate(input) {
  const mandate = structuredClone(input);
  validateMandate(mandate);
  return Object.freeze({
    ...mandate,
    authority: Object.freeze([...mandate.authority]),
    baseline: mandate.baseline ? Object.freeze({ ...mandate.baseline }) : undefined
  });
}
