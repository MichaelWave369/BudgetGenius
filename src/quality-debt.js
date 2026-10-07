export function createLineageRecord({
  artifactId,
  parentArtifactIds = [],
  derivationDepth = 0,
  inheritedDebt = 0,
  transformRisk = 0,
  verificationCredit = 0,
  transformClass = "LOSSLESS",
  verifierRefs = [],
  evidenceRefs = [],
  rawSourceRef = null
}) {
  if (typeof artifactId !== "string" || artifactId.trim() === "") throw new TypeError("artifactId is required");
  for (const [name, value] of Object.entries({ inheritedDebt, transformRisk, verificationCredit })) {
    unitInterval(name, value);
  }
  if (!Number.isInteger(derivationDepth) || derivationDepth < 0) throw new TypeError("derivationDepth must be a non-negative integer");

  const qualityDebt = clamp(inheritedDebt + transformRisk - verificationCredit);

  return Object.freeze({
    artifactId,
    parentArtifactIds: Object.freeze([...parentArtifactIds]),
    derivationDepth,
    transformClass,
    inheritedDebt,
    transformRisk,
    verificationCredit,
    qualityDebt,
    verifierRefs: Object.freeze([...verifierRefs]),
    evidenceRefs: Object.freeze([...evidenceRefs]),
    rawSourceRef
  });
}

export function combineInheritedDebt(parentRecords = []) {
  if (!Array.isArray(parentRecords)) throw new TypeError("parentRecords must be an array");
  if (parentRecords.length === 0) return 0;
  return Math.max(...parentRecords.map((record) => clamp(record?.qualityDebt ?? 0)));
}

export function qualityDebtDisposition(qualityDebt, {
  normalMax = 0.1,
  decisiveMax = 0.2,
  reopenSourceAt = 0.35
} = {}) {
  unitInterval("qualityDebt", qualityDebt);
  if (qualityDebt >= reopenSourceAt) return "REOPEN_SOURCE";
  if (qualityDebt > decisiveMax) return "NO_DECISIVE_CLAIMS";
  if (qualityDebt > normalMax) return "CAUTION";
  return "NORMAL";
}

function unitInterval(name, value) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new TypeError(`${name} must be in [0,1]`);
}

function clamp(value) {
  const clamped = Math.min(1, Math.max(0, value));
  return Math.round((clamped + Number.EPSILON) * 1e9) / 1e9;
}
