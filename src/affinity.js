import { quoteTokenCost } from "./price-table.js";

export class SessionAffinityRegistry {
  #rows = new Map();

  set({
    sessionId,
    providerId,
    modelId,
    prefixFingerprint,
    cacheableTokens,
    ttlMs = 300_000,
    now = Date.now()
  }) {
    if (!sessionId || !providerId || !modelId || !prefixFingerprint) {
      throw new TypeError("sessionId, providerId, modelId, and prefixFingerprint are required");
    }
    if (!Number.isFinite(cacheableTokens) || cacheableTokens < 0) throw new TypeError("cacheableTokens must be non-negative");
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new TypeError("ttlMs must be positive");
    this.#rows.set(sessionId, Object.freeze({
      sessionId,
      providerId,
      modelId,
      prefixFingerprint,
      cacheableTokens,
      expiresAt: now + ttlMs
    }));
  }

  get(sessionId, now = Date.now()) {
    const row = this.#rows.get(sessionId);
    if (!row) return null;
    if (row.expiresAt <= now) {
      this.#rows.delete(sessionId);
      return null;
    }
    return row;
  }

  clear(sessionId) {
    this.#rows.delete(sessionId);
  }
}

export function quoteAffinity({
  registry,
  sessionId,
  providerId,
  modelId,
  prefixFingerprint,
  carriedInputTokens,
  outputTokens,
  priceTable,
  now = Date.now()
}) {
  const affinity = registry?.get(sessionId, now) ?? null;
  const warm =
    affinity &&
    affinity.providerId === providerId &&
    affinity.modelId === modelId &&
    affinity.prefixFingerprint === prefixFingerprint;

  const cachedInputTokens = warm
    ? Math.min(carriedInputTokens, affinity.cacheableTokens)
    : 0;

  const routeQuote = quoteTokenCost({
    priceTable,
    providerId,
    modelId,
    inputTokens: carriedInputTokens,
    cachedInputTokens,
    outputTokens
  });

  let stayWarmReferenceUsd = null;
  let switchTaxUsd = 0;
  if (affinity && !warm) {
    const comparableTokens = Math.min(carriedInputTokens, affinity.cacheableTokens);
    const current = priceTable.get(affinity.providerId, affinity.modelId);
    if (current) {
      const stay = quoteTokenCost({
        priceTable,
        providerId: affinity.providerId,
        modelId: affinity.modelId,
        inputTokens: comparableTokens,
        cachedInputTokens: comparableTokens,
        outputTokens: 0
      });
      const coldDestination = quoteTokenCost({
        priceTable,
        providerId,
        modelId,
        inputTokens: comparableTokens,
        cachedInputTokens: 0,
        outputTokens: 0
      });
      stayWarmReferenceUsd = stay.costUsd;
      switchTaxUsd = round(Math.max(0, coldDestination.costUsd - stay.costUsd));
    }
  }

  return Object.freeze({
    warm: Boolean(warm),
    cachedInputTokens,
    affinity,
    routeQuote,
    stayWarmReferenceUsd,
    switchTaxUsd
  });
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
