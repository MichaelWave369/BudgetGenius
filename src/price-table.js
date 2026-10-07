export function createPriceTable({ version, effectiveAt, entries, source = null }) {
  if (typeof version !== "string" || version.trim() === "") throw new TypeError("price table version is required");
  if (typeof effectiveAt !== "string" || effectiveAt.trim() === "") throw new TypeError("effectiveAt is required");
  if (!Array.isArray(entries) || entries.length === 0) throw new TypeError("price table entries are required");

  const byKey = new Map();
  for (const entry of entries) {
    validateEntry(entry);
    const key = priceKey(entry.providerId, entry.modelId);
    if (byKey.has(key)) throw new Error(`duplicate price entry: ${key}`);
    byKey.set(key, Object.freeze(structuredClone(entry)));
  }

  return Object.freeze({
    version,
    effectiveAt,
    source: source ? Object.freeze(structuredClone(source)) : null,
    entries: Object.freeze([...byKey.values()]),
    get(providerId, modelId) {
      return byKey.get(priceKey(providerId, modelId)) ?? null;
    }
  });
}

export function quoteTokenCost({
  priceTable,
  providerId,
  modelId,
  inputTokens = 0,
  cachedInputTokens = 0,
  outputTokens = 0,
  batch = false
}) {
  const entry = priceTable.get(providerId, modelId);
  if (!entry) throw new Error(`missing price entry: ${priceKey(providerId, modelId)}`);

  for (const [name, value] of Object.entries({ inputTokens, cachedInputTokens, outputTokens })) {
    if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be non-negative`);
  }
  if (cachedInputTokens > inputTokens) throw new Error("cachedInputTokens cannot exceed inputTokens");

  const fresh = inputTokens - cachedInputTokens;
  const raw =
    fresh * entry.inputUsdPer1M / 1_000_000 +
    cachedInputTokens * entry.cachedInputUsdPer1M / 1_000_000 +
    outputTokens * entry.outputUsdPer1M / 1_000_000;
  const multiplier = batch ? (entry.batchMultiplier ?? 1) : 1;

  return Object.freeze({
    providerId,
    modelId,
    freshInputTokens: fresh,
    cachedInputTokens,
    outputTokens,
    batch,
    priceTableVersion: priceTable.version,
    costUsd: round(raw * multiplier)
  });
}

function validateEntry(entry) {
  for (const key of ["providerId", "modelId"]) {
    if (typeof entry?.[key] !== "string" || entry[key].trim() === "") {
      throw new TypeError(`${key} is required`);
    }
  }
  for (const key of ["inputUsdPer1M", "cachedInputUsdPer1M", "outputUsdPer1M"]) {
    if (!Number.isFinite(entry[key]) || entry[key] < 0) throw new TypeError(`${key} must be non-negative`);
  }
  if (entry.batchMultiplier != null && (!Number.isFinite(entry.batchMultiplier) || entry.batchMultiplier <= 0)) {
    throw new TypeError("batchMultiplier must be positive");
  }
}

function priceKey(providerId, modelId) {
  return `${providerId}::${modelId}`;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
