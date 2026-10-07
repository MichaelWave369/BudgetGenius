export class RouteCalibrationBook {
  #rows = new Map();

  record({
    contextKey,
    routeId,
    ok,
    totalCausalCostUsd,
    metadata = {}
  }) {
    requireString("contextKey", contextKey);
    requireString("routeId", routeId);
    if (typeof ok !== "boolean") throw new TypeError("ok must be boolean");
    if (!Number.isFinite(totalCausalCostUsd) || totalCausalCostUsd < 0) {
      throw new TypeError("totalCausalCostUsd must be non-negative");
    }

    const key = calibrationKey(contextKey, routeId);
    const row = this.#rows.get(key) ?? {
      contextKey,
      routeId,
      attempts: 0,
      successes: 0,
      totalCausalCostUsd: 0,
      metadata: {}
    };
    row.attempts += 1;
    if (ok) row.successes += 1;
    row.totalCausalCostUsd += totalCausalCostUsd;
    row.metadata = { ...row.metadata, ...structuredClone(metadata) };
    this.#rows.set(key, row);
    return this.stats(contextKey, routeId);
  }

  stats(contextKey, routeId, { z = 1.96 } = {}) {
    const row = this.#rows.get(calibrationKey(contextKey, routeId));
    if (!row) return null;
    const successRate = row.successes / row.attempts;
    const meanCausalCostUsd = row.totalCausalCostUsd / row.attempts;
    return Object.freeze({
      contextKey,
      routeId,
      attempts: row.attempts,
      successes: row.successes,
      failures: row.attempts - row.successes,
      successRate: round(successRate),
      wilsonLowerBound: round(wilsonLowerBound(row.successes, row.attempts, z)),
      meanCausalCostUsd: round(meanCausalCostUsd),
      metadata: Object.freeze(structuredClone(row.metadata))
    });
  }

  list(contextKey, options = {}) {
    const out = [];
    for (const row of this.#rows.values()) {
      if (row.contextKey === contextKey) out.push(this.stats(contextKey, row.routeId, options));
    }
    return Object.freeze(out.sort((a, b) => a.routeId.localeCompare(b.routeId)));
  }
}

export function buildContextKey({
  taskClass,
  effectClass,
  riskClass,
  verifierProfile = "default",
  contextBand = "default",
  runtimeFamily = "default"
}) {
  return [
    taskClass,
    effectClass,
    riskClass,
    verifierProfile,
    contextBand,
    runtimeFamily
  ].map((value) => String(value ?? "unknown")).join("|");
}

export function wilsonLowerBound(successes, attempts, z = 1.96) {
  if (!Number.isInteger(successes) || !Number.isInteger(attempts) || successes < 0 || attempts <= 0 || successes > attempts) {
    throw new TypeError("invalid successes/attempts");
  }
  if (!Number.isFinite(z) || z <= 0) throw new TypeError("z must be positive");

  const phat = successes / attempts;
  const z2 = z * z;
  const denominator = 1 + z2 / attempts;
  const center = phat + z2 / (2 * attempts);
  const margin = z * Math.sqrt((phat * (1 - phat) + z2 / (4 * attempts)) / attempts);
  return Math.max(0, (center - margin) / denominator);
}

function calibrationKey(contextKey, routeId) {
  return `${contextKey}::${routeId}`;
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
