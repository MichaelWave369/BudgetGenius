import { EFFECT_CLASS, RISK_CLASS } from "./constants.js";

export const BOARD_SEATS = Object.freeze({
  TREASURY: Object.freeze({ vetoDomains: Object.freeze(["SOLVENCY", "LIQUIDITY"]) }),
  SYSTEMS: Object.freeze({ vetoDomains: Object.freeze(["TECHNICAL_FEASIBILITY", "RUNTIME_SAFETY"]) }),
  SCIENCE: Object.freeze({ vetoDomains: Object.freeze(["QUALITY", "UNCERTAINTY"]) }),
  RISK: Object.freeze({ vetoDomains: Object.freeze(["RISK", "SECURITY", "IRREVERSIBILITY"]) }),
  EVIDENCE: Object.freeze({ vetoDomains: Object.freeze(["EVIDENCE", "PROVENANCE"]) }),
  MEMORY: Object.freeze({ vetoDomains: Object.freeze(["MEMORY_SAFETY", "FRESHNESS"]) }),
  OPERATOR_ADVOCATE: Object.freeze({ vetoDomains: Object.freeze(["OPERATOR_INTENT", "HUMAN_AUTHORITY"]) }),
  AUDITOR: Object.freeze({ vetoDomains: Object.freeze(["AUDITABILITY", "ACCOUNTING"]) })
});

export function evaluateBoardReferral({
  noQualifiedRoute = false,
  projectedSpendUsd = 0,
  spendThresholdUsd = Number.POSITIVE_INFINITY,
  contingencyRequiredUsd = 0,
  emergencyRequired = false,
  novelTaskClass = false,
  routingRegretUsd = 0,
  regretThresholdUsd = Number.POSITIVE_INFINITY,
  qualityDebt = 0,
  qualityDebtThreshold = Number.POSITIVE_INFINITY,
  qualificationChange = false,
  riskClass = null,
  effectClass = null,
  campaignCostUsd = 0,
  campaignThresholdUsd = Number.POSITIVE_INFINITY,
  policyConflict = false,
  operatorRequested = false
} = {}) {
  const triggers = [];
  if (noQualifiedRoute) triggers.push("NO_QUALIFIED_ROUTE");
  if (projectedSpendUsd > spendThresholdUsd) triggers.push("SPEND_THRESHOLD");
  if (contingencyRequiredUsd > 0) triggers.push("CONTINGENCY_REQUIRED");
  if (emergencyRequired) triggers.push("EMERGENCY_CAPITAL");
  if (novelTaskClass) triggers.push("NOVEL_TASK_CLASS");
  if (routingRegretUsd > regretThresholdUsd) triggers.push("ROUTING_REGRET");
  if (qualityDebt > qualityDebtThreshold) triggers.push("QUALITY_DEBT");
  if (qualificationChange) triggers.push("QUALIFICATION_CHANGE");
  if (riskClass === RISK_CLASS.CRITICAL || riskClass === RISK_CLASS.HIGH) triggers.push("HIGH_RISK");
  if (effectClass === EFFECT_CLASS.IRREVERSIBLE) triggers.push("IRREVERSIBLE_EFFECT");
  if (campaignCostUsd > campaignThresholdUsd) triggers.push("LARGE_CAMPAIGN");
  if (policyConflict) triggers.push("POLICY_CONFLICT");
  if (operatorRequested) triggers.push("OPERATOR_REQUEST");

  return Object.freeze({
    required: triggers.length > 0,
    triggers: Object.freeze([...new Set(triggers)])
  });
}

export function createBoardCase({
  caseId,
  mandateId,
  objective,
  referral,
  candidates = [],
  opinions = [],
  metadata = {}
}) {
  requireString("caseId", caseId);
  requireString("mandateId", mandateId);
  requireString("objective", objective);
  if (!referral || typeof referral.required !== "boolean") throw new TypeError("referral is required");
  if (!Array.isArray(candidates) || candidates.length === 0) throw new TypeError("candidates are required");
  if (!Array.isArray(opinions)) throw new TypeError("opinions must be an array");

  const candidateIds = new Set();
  const frozenCandidates = candidates.map((candidate) => {
    requireString("candidateId", candidate.candidateId);
    if (candidateIds.has(candidate.candidateId)) throw new Error(`duplicate candidateId: ${candidate.candidateId}`);
    candidateIds.add(candidate.candidateId);
    return Object.freeze(structuredClone(candidate));
  });

  const frozenOpinions = opinions.map((opinion) => validateOpinion(opinion, candidateIds));

  return Object.freeze({
    caseId,
    mandateId,
    objective,
    referral: Object.freeze(structuredClone(referral)),
    candidates: Object.freeze(frozenCandidates),
    opinions: Object.freeze(frozenOpinions),
    metadata: Object.freeze(structuredClone(metadata))
  });
}

export function validVetoes(boardCase) {
  const vetoes = [];
  for (const opinion of boardCase.opinions) {
    if (opinion.stance !== "VETO") continue;
    const seat = BOARD_SEATS[opinion.seatId];
    if (!seat) continue;
    if (!seat.vetoDomains.includes(opinion.domain)) continue;
    vetoes.push(opinion);
  }
  return Object.freeze(vetoes);
}

function validateOpinion(opinion, candidateIds) {
  if (!opinion || typeof opinion !== "object") throw new TypeError("board opinion is required");
  if (!BOARD_SEATS[opinion.seatId]) throw new TypeError(`unknown board seat: ${opinion.seatId}`);
  if (!["SUPPORT", "OBJECT", "VETO", "ABSTAIN"].includes(opinion.stance)) {
    throw new TypeError("invalid board stance");
  }
  if (opinion.candidateId != null && !candidateIds.has(opinion.candidateId)) {
    throw new Error(`unknown candidate in opinion: ${opinion.candidateId}`);
  }
  if (typeof opinion.domain !== "string" || opinion.domain.trim() === "") {
    throw new TypeError("opinion domain is required");
  }
  return Object.freeze({
    seatId: opinion.seatId,
    stance: opinion.stance,
    candidateId: opinion.candidateId ?? null,
    domain: opinion.domain,
    reason: opinion.reason ?? null,
    confidence: opinion.confidence ?? null
  });
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
}
