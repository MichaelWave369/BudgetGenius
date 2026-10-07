import { qualifyRoute } from "./router.js";
import { quoteTokenCost } from "./price-table.js";
import { quoteAffinity } from "./affinity.js";
import { quoteGpuResidency } from "./gpu-residency.js";
import { isBatchEligible, decideBackpressure, queueShadowCostUsd } from "./backpressure.js";

export function quoteRuntimeRoute({
  route,
  mandate,
  priceTable,
  affinityRegistry = null,
  gpuRegistry = null,
  runtime = {},
  policy = {},
  now = Date.now()
}) {
  const execution = route.execution ?? "REMOTE";
  const inputTokens = route.inputTokens ?? 0;
  const outputTokens = route.outputTokens ?? 0;
  const prefixTokens = Math.min(route.cacheablePrefixTokens ?? 0, inputTokens);
  const expectedWaitMs = runtime.expectedWaitMs ?? 0;

  const batchEligible = isBatchEligible({
    effectClass: mandate.effectClass,
    providerSupportsBatch: Boolean(route.providerSupportsBatch),
    batchAllowed: Boolean(route.batchAllowed),
    latencyBudgetMs: route.latencyBudgetMs ?? Number.POSITIVE_INFINITY,
    minimumBatchWindowMs: policy.minimumBatchWindowMs ?? 30_000
  });

  const backpressure = decideBackpressure({
    expectedWaitMs,
    deadlineMs: route.latencyBudgetMs ?? Number.POSITIVE_INFINITY,
    spillThresholdMs: policy.spillThresholdMs ?? Number.POSITIVE_INFINITY,
    batchEligible,
    queueAllowed: policy.queueAllowed !== false
  });

  let providerCostUsd = 0;
  let cachedInputTokens = 0;
  let switchTaxUsd = 0;
  let warmPrefix = false;
  let priceTableVersion = priceTable?.version ?? null;
  let batchApplied = false;

  if (execution === "REMOTE") {
    if (!priceTable) throw new Error("priceTable is required for remote routes");
    const affinity = quoteAffinity({
      registry: affinityRegistry,
      sessionId: route.sessionId,
      providerId: route.providerId,
      modelId: route.modelId,
      prefixFingerprint: route.prefixFingerprint,
      inputTokens,
      cacheablePrefixTokens: prefixTokens,
      outputTokens,
      priceTable,
      now
    });
    warmPrefix = affinity.warm;
    cachedInputTokens = Math.min(prefixTokens, affinity.cachedInputTokens);
    switchTaxUsd = affinity.switchTaxUsd;

    const shouldBatch = batchEligible && backpressure.action === "BATCH";
    batchApplied = shouldBatch;
    const quote = quoteTokenCost({
      priceTable,
      providerId: route.providerId,
      modelId: route.modelId,
      inputTokens,
      cachedInputTokens,
      outputTokens,
      batch: shouldBatch
    });
    providerCostUsd = quote.costUsd;
    priceTableVersion = quote.priceTableVersion;
  }

  const gpu = execution === "LOCAL"
    ? quoteGpuResidency({
        registry: gpuRegistry,
        modelId: route.modelId,
        movementUsdPerSecond: policy.movementUsdPerSecond ?? 0
      })
    : Object.freeze({ known: false, resident: false, gpuFit: null, movementMs: 0, movementCostUsd: 0 });

  const queueCostUsd = queueShadowCostUsd({
    expectedWaitMs,
    latencyUsdPerSecond: policy.latencyUsdPerSecond ?? 0
  });

  const effectiveEconomicCostUsd = round(providerCostUsd + gpu.movementCostUsd + queueCostUsd);
  const monetaryRoute = {
    ...route,
    estimatedCostUsd: providerCostUsd
  };
  const qualification = qualifyRoute(monetaryRoute, mandate);

  const runtimeEligible =
    qualification.qualified &&
    gpu.gpuFit !== false &&
    backpressure.action !== "SPILL";

  return Object.freeze({
    route: Object.freeze(structuredClone(monetaryRoute)),
    qualification,
    runtimeEligible,
    providerCostUsd,
    effectiveEconomicCostUsd,
    priceTableVersion,
    warmPrefix,
    cachedInputTokens,
    switchTaxUsd,
    gpu,
    queueCostUsd,
    backpressure,
    batchEligible,
    batchApplied
  });
}

export function selectRuntimeRoute(args) {
  const quotes = args.routes.map((route) => quoteRuntimeRoute({ ...args, route }));
  const eligible = quotes.filter((quote) => quote.runtimeEligible);
  if (eligible.length === 0) {
    return Object.freeze({
      selected: null,
      quotes: Object.freeze(quotes)
    });
  }

  eligible.sort((a, b) =>
    a.effectiveEconomicCostUsd - b.effectiveEconomicCostUsd ||
    (a.route.latencyMs ?? Number.POSITIVE_INFINITY) - (b.route.latencyMs ?? Number.POSITIVE_INFINITY)
  );

  return Object.freeze({
    selected: eligible[0],
    quotes: Object.freeze(quotes)
  });
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
