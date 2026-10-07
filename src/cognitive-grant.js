export function createCognitiveGrant({
  grantId,
  objective,
  poolId,
  maxCostUsd,
  contingencyUsd = 0,
  stages,
  scope = {},
  successConditions = [],
  stopConditions = []
}) {
  requireString("grantId", grantId);
  requireString("objective", objective);
  requireString("poolId", poolId);
  money("maxCostUsd", maxCostUsd);
  money("contingencyUsd", contingencyUsd);
  if (contingencyUsd > maxCostUsd) throw new Error("contingencyUsd cannot exceed maxCostUsd");
  if (!Array.isArray(stages) || stages.length === 0) throw new TypeError("stages are required");

  const seen = new Set();
  let plannedUsd = 0;
  const normalizedStages = stages.map((stage, index) => {
    requireString("stageId", stage.stageId);
    if (seen.has(stage.stageId)) throw new Error(`duplicate stageId: ${stage.stageId}`);
    seen.add(stage.stageId);
    money("stage.maxCostUsd", stage.maxCostUsd);
    plannedUsd += stage.maxCostUsd;
    return Object.freeze({
      stageId: stage.stageId,
      order: stage.order ?? index,
      maxCostUsd: stage.maxCostUsd,
      entryCondition: stage.entryCondition ?? null,
      exitCondition: stage.exitCondition ?? null
    });
  }).sort((a, b) => a.order - b.order);

  const operatingUsd = maxCostUsd - contingencyUsd;
  if (plannedUsd > operatingUsd + 1e-12) {
    throw new Error("planned stages exceed non-contingency operating budget");
  }

  return Object.freeze({
    grantId,
    objective,
    poolId,
    maxCostUsd,
    contingencyUsd,
    operatingUsd: round(operatingUsd),
    unallocatedOperatingUsd: round(operatingUsd - plannedUsd),
    stages: Object.freeze(normalizedStages),
    scope: Object.freeze(structuredClone(scope)),
    successConditions: Object.freeze([...successConditions]),
    stopConditions: Object.freeze([...stopConditions])
  });
}

export function allocateGrantPortfolio({ proposals, availableUsd }) {
  if (!Array.isArray(proposals)) throw new TypeError("proposals must be an array");
  money("availableUsd", availableUsd);

  const ranked = proposals.map((proposal) => {
    requireString("proposalId", proposal.proposalId);
    money("requestedUsd", proposal.requestedUsd);
    for (const key of ["priorityWeight", "decisionValue", "expectedUncertaintyReduction"]) {
      if (!Number.isFinite(proposal[key]) || proposal[key] < 0) {
        throw new TypeError(`${key} must be non-negative`);
      }
    }
    const score = proposal.requestedUsd === 0
      ? Number.POSITIVE_INFINITY
      : proposal.priorityWeight * proposal.decisionValue * proposal.expectedUncertaintyReduction / proposal.requestedUsd;
    return { ...structuredClone(proposal), score };
  }).sort((a, b) =>
    b.score - a.score ||
    b.priorityWeight - a.priorityWeight ||
    a.proposalId.localeCompare(b.proposalId)
  );

  let remainingUsd = availableUsd;
  const funded = [];
  const deferred = [];
  for (const proposal of ranked) {
    if (proposal.requestedUsd <= remainingUsd + 1e-12) {
      funded.push(Object.freeze({ ...proposal, score: finiteScore(proposal.score) }));
      remainingUsd = round(remainingUsd - proposal.requestedUsd);
    } else {
      deferred.push(Object.freeze({ ...proposal, score: finiteScore(proposal.score), reason: "INSUFFICIENT_PORTFOLIO_CAPITAL" }));
    }
  }

  return Object.freeze({
    availableUsd,
    committedUsd: round(availableUsd - remainingUsd),
    remainingUsd,
    funded: Object.freeze(funded),
    deferred: Object.freeze(deferred)
  });
}

function finiteScore(score) {
  return score === Number.POSITIVE_INFINITY ? "INFINITE_ZERO_COST" : round(score);
}

function money(name, value) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be non-negative`);
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
