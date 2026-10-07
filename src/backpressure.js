import { EFFECT_CLASS } from "./constants.js";

export function isBatchEligible({
  effectClass,
  providerSupportsBatch,
  batchAllowed,
  latencyBudgetMs,
  minimumBatchWindowMs = 30_000
}) {
  if (!providerSupportsBatch || !batchAllowed) return false;
  if (effectClass === EFFECT_CLASS.MUTATE || effectClass === EFFECT_CLASS.IRREVERSIBLE) return false;
  return Number.isFinite(latencyBudgetMs) && latencyBudgetMs >= minimumBatchWindowMs;
}

export function decideBackpressure({
  expectedWaitMs = 0,
  deadlineMs = Number.POSITIVE_INFINITY,
  spillThresholdMs = Number.POSITIVE_INFINITY,
  batchEligible = false,
  queueAllowed = true
}) {
  if (!Number.isFinite(expectedWaitMs) || expectedWaitMs < 0) throw new TypeError("expectedWaitMs must be non-negative");

  if (expectedWaitMs === 0) return Object.freeze({ action: "RUN", reason: "NO_QUEUE" });
  if (batchEligible && expectedWaitMs > spillThresholdMs) {
    return Object.freeze({ action: "BATCH", reason: "CONGESTED_BATCH_ELIGIBLE" });
  }
  if (expectedWaitMs > spillThresholdMs) {
    return Object.freeze({ action: "SPILL", reason: "QUEUE_ABOVE_SPILL_THRESHOLD" });
  }
  if (expectedWaitMs <= deadlineMs && queueAllowed) {
    return Object.freeze({ action: "QUEUE", reason: "WAIT_WITHIN_DEADLINE" });
  }
  return Object.freeze({ action: "SPILL", reason: "WAIT_EXCEEDS_DEADLINE" });
}

export function queueShadowCostUsd({ expectedWaitMs = 0, latencyUsdPerSecond = 0 }) {
  if (!Number.isFinite(expectedWaitMs) || expectedWaitMs < 0) throw new TypeError("expectedWaitMs must be non-negative");
  if (!Number.isFinite(latencyUsdPerSecond) || latencyUsdPerSecond < 0) throw new TypeError("latencyUsdPerSecond must be non-negative");
  return round(expectedWaitMs / 1000 * latencyUsdPerSecond);
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
