export function certifySavings({
  receipt,
  outcomeVerified,
  attributableCostsUsd = [],
  baselineActualOrEstimatedUsd = null
}) {
  if (!receipt || typeof receipt !== "object") throw new TypeError("receipt is required");
  if (!Array.isArray(attributableCostsUsd)) throw new TypeError("attributableCostsUsd must be an array");

  const downstreamUsd = attributableCostsUsd.reduce((sum, value) => {
    if (!Number.isFinite(value) || value < 0) throw new TypeError("attributable costs must be non-negative");
    return sum + value;
  }, 0);

  const baseline = Number.isFinite(baselineActualOrEstimatedUsd)
    ? baselineActualOrEstimatedUsd
    : receipt.baselineEstimatedCostUsd;

  const totalCausalCostUsd = round((receipt.actualUsd ?? 0) + downstreamUsd);
  const verifiedSavingsUsd =
    outcomeVerified && Number.isFinite(baseline)
      ? round(Math.max(0, baseline - totalCausalCostUsd))
      : null;

  return Object.freeze({
    ...structuredClone(receipt),
    outcomeVerified: Boolean(outcomeVerified),
    attributableDownstreamCostUsd: round(downstreamUsd),
    totalCausalCostUsd,
    verifiedSavingsUsd
  });
}

export function buildSavingsWaterfall({
  baselineUsd,
  stages
}) {
  if (!Number.isFinite(baselineUsd) || baselineUsd < 0) throw new TypeError("baselineUsd must be non-negative");
  if (!Array.isArray(stages)) throw new TypeError("stages must be an array");

  let previous = baselineUsd;
  const rows = [];
  for (const stage of stages) {
    if (typeof stage?.name !== "string" || !Number.isFinite(stage.costAfterUsd) || stage.costAfterUsd < 0) {
      throw new TypeError("invalid savings stage");
    }
    const incrementalSavingsUsd = round(Math.max(0, previous - stage.costAfterUsd));
    rows.push(Object.freeze({
      name: stage.name,
      costBeforeUsd: round(previous),
      costAfterUsd: round(stage.costAfterUsd),
      incrementalSavingsUsd
    }));
    previous = stage.costAfterUsd;
  }
  return Object.freeze({
    baselineUsd: round(baselineUsd),
    actualOrFinalUsd: round(previous),
    totalSavingsUsd: round(Math.max(0, baselineUsd - previous)),
    stages: Object.freeze(rows)
  });
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
