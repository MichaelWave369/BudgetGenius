function containsAll(granted, required = []) {
  const have = new Set(granted);
  return required.every((value) => have.has(value));
}

export function qualifyRoute(route, mandate) {
  const reasons = [];
  if (!Number.isFinite(route.estimatedCostUsd) || route.estimatedCostUsd < 0) reasons.push("INVALID_COST");
  if (!Number.isFinite(route.successProbability)) reasons.push("MISSING_EMPIRICAL_SUCCESS");
  else if (route.successProbability < mandate.qualityFloor) reasons.push("QUALITY_FLOOR");
  if (!Number.isFinite(route.evidenceScore)) reasons.push("MISSING_EVIDENCE_SCORE");
  else if (route.evidenceScore < mandate.evidenceFloor) reasons.push("EVIDENCE_FLOOR");
  if (!Number.isFinite(route.riskScore)) reasons.push("MISSING_RISK_SCORE");
  else if (route.riskScore > mandate.maxRiskScore) reasons.push("RISK_CEILING");
  if (!containsAll(mandate.authority, route.requiredAuthority)) reasons.push("AUTHORITY");
  const totalReservedUsd = (route.estimatedCostUsd ?? Infinity) + (route.escalationBondUsd ?? 0);
  if (totalReservedUsd > mandate.maxCostUsd + 1e-12) reasons.push("MANDATE_COST_CEILING");
  return Object.freeze({
    routeId: route.routeId,
    qualified: reasons.length === 0,
    reasons: Object.freeze(reasons),
    totalReservedUsd
  });
}

export function selectRoute(candidates, mandate) {
  if (!Array.isArray(candidates) || candidates.length === 0) throw new Error("no candidate routes");
  const evaluations = candidates.map((route) => ({ route, qualification: qualifyRoute(route, mandate) }));
  const qualified = evaluations.filter((entry) => entry.qualification.qualified);
  if (qualified.length === 0) {
    return Object.freeze({
      selected: null,
      counterfactuals: Object.freeze(evaluations.map(toCounterfactual))
    });
  }
  qualified.sort((a, b) =>
    a.qualification.totalReservedUsd - b.qualification.totalReservedUsd ||
    (a.route.latencyMs ?? Infinity) - (b.route.latencyMs ?? Infinity)
  );
  return Object.freeze({
    selected: Object.freeze({ ...qualified[0].route }),
    counterfactuals: Object.freeze(evaluations.map(toCounterfactual))
  });
}

function toCounterfactual({ route, qualification }) {
  return Object.freeze({
    routeId: route.routeId,
    estimatedCostUsd: route.estimatedCostUsd,
    successProbability: route.successProbability,
    evidenceScore: route.evidenceScore,
    riskScore: route.riskScore,
    qualified: qualification.qualified,
    rejectionReasons: qualification.reasons
  });
}
