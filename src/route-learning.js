import { qualifyRoute } from "./router.js";

export function recommendLearnedRoute({
  calibrationBook,
  contextKey,
  mandate,
  candidateRoutes,
  minSamples = 20,
  z = 1.96
}) {
  if (!calibrationBook) throw new TypeError("calibrationBook is required");
  if (!Array.isArray(candidateRoutes) || candidateRoutes.length === 0) {
    throw new TypeError("candidateRoutes are required");
  }
  if (!Number.isInteger(minSamples) || minSamples < 1) throw new TypeError("minSamples must be positive");

  const evaluations = candidateRoutes.map((route) => {
    const stats = calibrationBook.stats(contextKey, route.routeId, { z });
    if (!stats || stats.attempts < minSamples) {
      return Object.freeze({
        routeId: route.routeId,
        eligible: false,
        reason: "INSUFFICIENT_CALIBRATION",
        stats
      });
    }

    const empiricalRoute = {
      ...route,
      successProbability: stats.wilsonLowerBound,
      estimatedCostUsd: stats.meanCausalCostUsd
    };
    const qualification = qualifyRoute(empiricalRoute, mandate);
    return Object.freeze({
      routeId: route.routeId,
      eligible: qualification.qualified,
      reason: qualification.qualified ? "EMPIRICALLY_QUALIFIED" : "GOVERNANCE_REJECTED",
      stats,
      qualification,
      empiricalRoute: Object.freeze(empiricalRoute)
    });
  });

  const eligible = evaluations.filter((entry) => entry.eligible);
  if (eligible.length === 0) {
    return Object.freeze({
      selected: null,
      evaluations: Object.freeze(evaluations)
    });
  }

  eligible.sort((a, b) =>
    a.stats.meanCausalCostUsd - b.stats.meanCausalCostUsd ||
    b.stats.wilsonLowerBound - a.stats.wilsonLowerBound ||
    a.routeId.localeCompare(b.routeId)
  );

  return Object.freeze({
    selected: eligible[0],
    evaluations: Object.freeze(evaluations)
  });
}
