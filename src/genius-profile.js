export class GeniusEconomicProfiles {
  #rows = new Map();

  record({
    geniusId,
    taskClass,
    routeId,
    ok,
    totalCausalCostUsd,
    inputTokens = 0,
    outputTokens = 0,
    contextClasses = []
  }) {
    requireString("geniusId", geniusId);
    requireString("taskClass", taskClass);
    requireString("routeId", routeId);
    if (typeof ok !== "boolean") throw new TypeError("ok must be boolean");
    for (const [name, value] of Object.entries({ totalCausalCostUsd, inputTokens, outputTokens })) {
      if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be non-negative`);
    }

    const key = `${geniusId}::${taskClass}`;
    const row = this.#rows.get(key) ?? {
      geniusId,
      taskClass,
      attempts: 0,
      successes: 0,
      totalCausalCostUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      routes: new Map(),
      contextClasses: new Map()
    };

    row.attempts += 1;
    if (ok) row.successes += 1;
    row.totalCausalCostUsd += totalCausalCostUsd;
    row.inputTokens += inputTokens;
    row.outputTokens += outputTokens;
    row.routes.set(routeId, (row.routes.get(routeId) ?? 0) + 1);
    for (const contextClass of contextClasses) {
      row.contextClasses.set(contextClass, (row.contextClasses.get(contextClass) ?? 0) + 1);
    }
    this.#rows.set(key, row);
    return this.snapshot(geniusId, taskClass);
  }

  snapshot(geniusId, taskClass) {
    const row = this.#rows.get(`${geniusId}::${taskClass}`);
    if (!row) return null;
    return Object.freeze({
      geniusId,
      taskClass,
      attempts: row.attempts,
      successRate: round(row.successes / row.attempts),
      meanCausalCostUsd: round(row.totalCausalCostUsd / row.attempts),
      meanInputTokens: round(row.inputTokens / row.attempts),
      meanOutputTokens: round(row.outputTokens / row.attempts),
      routeUse: freezeCounts(row.routes),
      contextUse: freezeCounts(row.contextClasses)
    });
  }
}

function freezeCounts(map) {
  return Object.freeze(
    [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => Object.freeze({ name, count }))
  );
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
