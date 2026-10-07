export function createShadowRecord({
  shadowId,
  taskClass,
  selected,
  alternatives,
  budgetPoolId = null,
  metadata = {}
}) {
  if (typeof shadowId !== "string" || shadowId.trim() === "") throw new TypeError("shadowId is required");
  if (!selected || typeof selected !== "object") throw new TypeError("selected result is required");
  if (!Array.isArray(alternatives)) throw new TypeError("alternatives must be an array");

  return Object.freeze({
    shadowId,
    taskClass,
    budgetPoolId,
    selected: freezeOutcome(selected),
    alternatives: Object.freeze(alternatives.map(freezeOutcome)),
    metadata: Object.freeze(structuredClone(metadata))
  });
}

export function routingRegret(record) {
  const outcomes = [record.selected, ...record.alternatives];
  const successful = outcomes.filter((outcome) => outcome.ok === true && Number.isFinite(outcome.totalCausalCostUsd));
  if (!record.selected.ok || !Number.isFinite(record.selected.totalCausalCostUsd) || successful.length === 0) {
    return Object.freeze({
      regretUsd: null,
      oracleRouteId: null,
      reason: "INSUFFICIENT_SUCCESSFUL_COUNTERFACTUAL"
    });
  }
  successful.sort((a, b) => a.totalCausalCostUsd - b.totalCausalCostUsd);
  const oracle = successful[0];
  return Object.freeze({
    regretUsd: round(Math.max(0, record.selected.totalCausalCostUsd - oracle.totalCausalCostUsd)),
    oracleRouteId: oracle.routeId,
    selectedRouteId: record.selected.routeId
  });
}

function freezeOutcome(outcome) {
  if (typeof outcome.routeId !== "string" || outcome.routeId.trim() === "") throw new TypeError("routeId is required");
  if (typeof outcome.ok !== "boolean") throw new TypeError("outcome.ok must be boolean");
  if (!Number.isFinite(outcome.totalCausalCostUsd) || outcome.totalCausalCostUsd < 0) {
    throw new TypeError("totalCausalCostUsd must be non-negative");
  }
  return Object.freeze(structuredClone(outcome));
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
