import test from "node:test";
import assert from "node:assert/strict";
import {
  EFFECT_CLASS,
  RISK_CLASS,
  createMandate,
  createPriceTable,
  quoteTokenCost,
  SessionAffinityRegistry,
  quoteAffinity,
  GpuResidencyRegistry,
  quoteGpuResidency,
  isBatchEligible,
  decideBackpressure,
  selectRuntimeRoute,
  ProviderAdapterRegistry
} from "../src/index.js";

const prices = createPriceTable({
  version: "test-1",
  effectiveAt: "2026-10-07T00:00:00Z",
  source: { kind: "fixture" },
  entries: [
    { providerId: "p", modelId: "warm", inputUsdPer1M: 5, cachedInputUsdPer1M: 0.5, outputUsdPer1M: 20, batchMultiplier: 0.5 },
    { providerId: "p", modelId: "cheap", inputUsdPer1M: 1, cachedInputUsdPer1M: 0.1, outputUsdPer1M: 5, batchMultiplier: 0.5 }
  ]
});

const mandate = createMandate({
  mandateId: "CM-R3",
  objective: "Answer with qualified runtime economics",
  poolId: "project",
  qualityFloor: 0.95,
  evidenceFloor: 0.9,
  maxRiskScore: 0.2,
  maxCostUsd: 1,
  authority: [],
  effectClass: EFFECT_CLASS.PURE,
  riskClass: RISK_CLASS.NORMAL
});

test("price table separates fresh, cached, output, and batch cost", () => {
  const normal = quoteTokenCost({
    priceTable: prices, providerId: "p", modelId: "warm",
    inputTokens: 10_000, cachedInputTokens: 8_000, outputTokens: 1_000
  });
  const batch = quoteTokenCost({
    priceTable: prices, providerId: "p", modelId: "warm",
    inputTokens: 10_000, cachedInputTokens: 8_000, outputTokens: 1_000, batch: true
  });
  assert.equal(normal.costUsd, 0.034);
  assert.equal(batch.costUsd, 0.017);
});

test("session affinity values a confirmed warm prefix and exposes switch tax", () => {
  const affinity = new SessionAffinityRegistry();
  affinity.set({
    sessionId: "s1", providerId: "p", modelId: "warm",
    prefixFingerprint: "prefix-A", cacheableTokens: 10_000, now: 1000
  });

  const stay = quoteAffinity({
    registry: affinity, sessionId: "s1", providerId: "p", modelId: "warm",
    prefixFingerprint: "prefix-A", inputTokens: 10_000, cacheablePrefixTokens: 10_000, outputTokens: 0,
    priceTable: prices, now: 1001
  });
  assert.equal(stay.warm, true);
  assert.equal(stay.routeQuote.costUsd, 0.005);

  const move = quoteAffinity({
    registry: affinity, sessionId: "s1", providerId: "p", modelId: "cheap",
    prefixFingerprint: "prefix-A", inputTokens: 10_000, cacheablePrefixTokens: 10_000, outputTokens: 0,
    priceTable: prices, now: 1001
  });
  assert.equal(move.warm, false);
  assert.equal(move.switchTaxUsd, 0.005);
});

test("warm-prefix billing never exceeds the declared cacheable prefix", () => {
  const affinity = new SessionAffinityRegistry();
  affinity.set({
    sessionId: "s1", providerId: "p", modelId: "warm",
    prefixFingerprint: "prefix-A", cacheableTokens: 10_000, now: 1000
  });
  const quote = quoteAffinity({
    registry: affinity, sessionId: "s1", providerId: "p", modelId: "warm",
    prefixFingerprint: "prefix-A", inputTokens: 10_000, cacheablePrefixTokens: 2_000,
    outputTokens: 0, priceTable: prices, now: 1001
  });
  assert.equal(quote.cachedInputTokens, 2_000);
  assert.equal(quote.routeQuote.costUsd, 0.041);
});

test("GPU residency charges virtual movement only when model is cold", () => {
  const gpu = new GpuResidencyRegistry();
  gpu.set("local-a", { resident: false, gpuFit: true, loadMs: 4000, evictionMs: 1000, vramGb: 12 });
  const quote = quoteGpuResidency({ registry: gpu, modelId: "local-a", movementUsdPerSecond: 0.002 });
  assert.equal(quote.movementMs, 5000);
  assert.equal(quote.movementCostUsd, 0.01);
});

test("batch is prohibited for mutation and enabled for flexible pure work", () => {
  assert.equal(isBatchEligible({
    effectClass: EFFECT_CLASS.MUTATE, providerSupportsBatch: true,
    batchAllowed: true, latencyBudgetMs: 60_000
  }), false);
  assert.equal(isBatchEligible({
    effectClass: EFFECT_CLASS.PURE, providerSupportsBatch: true,
    batchAllowed: true, latencyBudgetMs: 60_000
  }), true);
});

test("backpressure recommends spill when wait exceeds threshold and batch is unavailable", () => {
  assert.deepEqual(decideBackpressure({
    expectedWaitMs: 10_000, deadlineMs: 20_000, spillThresholdMs: 5_000,
    batchEligible: false
  }), { action: "SPILL", reason: "QUEUE_ABOVE_SPILL_THRESHOLD" });
});

test("runtime selector can prefer warm expensive model over cold cheaper sticker price", () => {
  const affinity = new SessionAffinityRegistry();
  affinity.set({
    sessionId: "s1", providerId: "p", modelId: "warm",
    prefixFingerprint: "P", cacheableTokens: 60_000, now: 1000
  });

  const result = selectRuntimeRoute({
    mandate,
    priceTable: prices,
    affinityRegistry: affinity,
    now: 1001,
    policy: { latencyUsdPerSecond: 0, spillThresholdMs: 100_000 },
    runtime: { expectedWaitMs: 0 },
    routes: [
      {
        routeId: "stay-warm", execution: "REMOTE", providerId: "p", modelId: "warm",
        sessionId: "s1", prefixFingerprint: "P", inputTokens: 60_000,
        cacheablePrefixTokens: 60_000, outputTokens: 0,
        successProbability: 0.97, evidenceScore: 0.95, riskScore: 0.05, requiredAuthority: []
      },
      {
        routeId: "switch-cheap", execution: "REMOTE", providerId: "p", modelId: "cheap",
        sessionId: "s1", prefixFingerprint: "P", inputTokens: 60_000,
        cacheablePrefixTokens: 60_000, outputTokens: 0,
        successProbability: 0.97, evidenceScore: 0.95, riskScore: 0.05, requiredAuthority: []
      }
    ]
  });

  assert.equal(result.selected.route.routeId, "stay-warm");
  assert.equal(result.selected.warmPrefix, true);
});

test("runtime selector accounts for local model movement and queue shadow prices", () => {
  const gpu = new GpuResidencyRegistry();
  gpu.set("local-cold", { resident: false, gpuFit: true, loadMs: 20_000, evictionMs: 0, vramGb: 10 });

  const result = selectRuntimeRoute({
    mandate,
    priceTable: prices,
    gpuRegistry: gpu,
    policy: {
      movementUsdPerSecond: 0.002,
      latencyUsdPerSecond: 0,
      spillThresholdMs: 100_000
    },
    runtime: { expectedWaitMs: 0 },
    routes: [
      {
        routeId: "local", execution: "LOCAL", modelId: "local-cold",
        inputTokens: 1000, outputTokens: 100,
        successProbability: 0.97, evidenceScore: 0.95, riskScore: 0.05, requiredAuthority: []
      },
      {
        routeId: "remote", execution: "REMOTE", providerId: "p", modelId: "cheap",
        sessionId: "s", prefixFingerprint: "x", inputTokens: 1000, outputTokens: 100,
        successProbability: 0.97, evidenceScore: 0.95, riskScore: 0.05, requiredAuthority: []
      }
    ]
  });

  assert.equal(result.selected.route.routeId, "remote");
  assert.equal(result.quotes.find((q) => q.route.routeId === "local").providerCostUsd, 0);
});

test("provider adapter registry dispatches only through a registered adapter", async () => {
  const registry = new ProviderAdapterRegistry();
  registry.register({
    providerId: "mock",
    supportsBatch: true,
    supportsPromptCache: true,
    dispatch: async (plan, request) => ({ plan, request, ok: true })
  });
  const result = await registry.dispatch({ providerId: "mock", modelId: "m" }, { hello: "world" });
  assert.equal(result.ok, true);
  await assert.rejects(
    () => registry.dispatch({ providerId: "missing" }, {}),
    /provider adapter unavailable/
  );
});
