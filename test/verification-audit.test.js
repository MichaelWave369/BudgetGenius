import test from "node:test";
import assert from "node:assert/strict";
import {
  VerifierRegistry,
  evaluateVerification,
  createLineageRecord,
  combineInheritedDebt,
  qualityDebtDisposition,
  certifySavings,
  buildSavingsWaterfall,
  createShadowRecord,
  routingRegret,
  buildAuditReport
} from "../src/index.js";

test("verification can require independent checks rather than generator self-review", async () => {
  const registry = new VerifierRegistry();
  registry.register({
    verifierId: "tests",
    mechanism: "UNIT_TESTS",
    independenceScore: 0.98,
    deterministic: true,
    verify: async () => ({ ok: true, confidence: 1, evidence: { passed: 42 } })
  });
  registry.register({
    verifierId: "self-judge",
    mechanism: "SAME_MODEL_JUDGE",
    independenceScore: 0.15,
    deterministic: false,
    verify: async () => ({ ok: true, confidence: 0.99 })
  });

  const tests = await registry.run("tests", {});
  const self = await registry.run("self-judge", {});

  assert.equal(evaluateVerification({
    results: [self],
    minConfidence: 0.95,
    minIndependence: 0.8
  }).ok, false);

  assert.equal(evaluateVerification({
    results: [tests],
    minConfidence: 0.95,
    minIndependence: 0.8
  }).ok, true);
});

test("quality debt retains lineage and independent verification can reduce debt", () => {
  const parent = createLineageRecord({
    artifactId: "raw-1",
    inheritedDebt: 0,
    transformRisk: 0.02,
    verificationCredit: 0,
    rawSourceRef: "blob:raw"
  });
  const inherited = combineInheritedDebt([parent]);
  const summary = createLineageRecord({
    artifactId: "summary-1",
    parentArtifactIds: ["raw-1"],
    derivationDepth: 1,
    inheritedDebt: inherited,
    transformRisk: 0.12,
    verificationCredit: 0.08,
    transformClass: "LOSSY_SUMMARY",
    verifierRefs: ["tests"]
  });
  assert.equal(summary.qualityDebt, 0.06);
  assert.equal(qualityDebtDisposition(summary.qualityDebt), "NORMAL");
});

test("verified savings include attributable downstream repair cost", () => {
  const receipt = {
    actualUsd: 0.02,
    baselineEstimatedCostUsd: 0.12,
    provisionalSavingsUsd: 0.10
  };
  const certified = certifySavings({
    receipt,
    outcomeVerified: true,
    attributableCostsUsd: [0.03, 0.01]
  });
  assert.equal(certified.totalCausalCostUsd, 0.06);
  assert.equal(certified.verifiedSavingsUsd, 0.06);
});

test("unverified outcomes never receive verified savings", () => {
  const certified = certifySavings({
    receipt: { actualUsd: 0.01, baselineEstimatedCostUsd: 0.1 },
    outcomeVerified: false,
    attributableCostsUsd: []
  });
  assert.equal(certified.verifiedSavingsUsd, null);
});

test("savings waterfall prevents double counting", () => {
  const waterfall = buildSavingsWaterfall({
    baselineUsd: 0.20,
    stages: [
      { name: "context", costAfterUsd: 0.13 },
      { name: "routing", costAfterUsd: 0.04 },
      { name: "output", costAfterUsd: 0.027 }
    ]
  });
  assert.equal(waterfall.totalSavingsUsd, 0.173);
  assert.deepEqual(waterfall.stages.map((stage) => stage.incrementalSavingsUsd), [0.07, 0.09, 0.013]);
});

test("routing regret uses cheapest known successful counterfactual only", () => {
  const record = createShadowRecord({
    shadowId: "S-1",
    taskClass: "code",
    selected: { routeId: "frontier", ok: true, totalCausalCostUsd: 0.11 },
    alternatives: [
      { routeId: "mid", ok: true, totalCausalCostUsd: 0.018 },
      { routeId: "local", ok: false, totalCausalCostUsd: 0.0 }
    ]
  });
  const regret = routingRegret(record);
  assert.equal(regret.oracleRouteId, "mid");
  assert.equal(regret.regretUsd, 0.092);
});

test("auditor refuses to certify savings when verification policy fails", async () => {
  const registry = new VerifierRegistry();
  registry.register({
    verifierId: "weak",
    mechanism: "SELF_JUDGE",
    independenceScore: 0.2,
    verify: async () => ({ ok: true, confidence: 0.99 })
  });
  const weak = await registry.run("weak", {});

  const report = buildAuditReport({
    passId: "BP-1",
    verificationResults: [weak],
    verificationPolicy: { minConfidence: 0.95, minIndependence: 0.8 },
    receipt: { actualUsd: 0.01, baselineEstimatedCostUsd: 0.1 },
    outcomeVerified: true
  });

  assert.equal(report.verification.ok, false);
  assert.equal(report.savings.verifiedSavingsUsd, null);
});
