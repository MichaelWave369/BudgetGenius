import test from "node:test";
import assert from "node:assert/strict";
import {
  EFFECT_CLASS,
  RISK_CLASS,
  createMandate,
  createBudgetPacket,
  SEGMENT_CLASS,
  RouteCalibrationBook,
  buildContextKey,
  wilsonLowerBound,
  recommendLearnedRoute,
  GeniusEconomicProfiles,
  compilePrecedentPolicy,
  createCognitiveGrant,
  allocateGrantPortfolio,
  planRequestFusion,
  multicastFoundation
} from "../src/index.js";

const mandate = createMandate({
  mandateId: "CM-L5",
  objective: "Choose a learned route without lowering standards",
  poolId: "project",
  qualityFloor: 0.90,
  evidenceFloor: 0.9,
  maxRiskScore: 0.2,
  maxCostUsd: 1,
  authority: [],
  effectClass: EFFECT_CLASS.PURE,
  riskClass: RISK_CLASS.NORMAL
});

test("Wilson lower bound is conservative versus raw success rate", () => {
  assert.ok(wilsonLowerBound(10, 10) < 1);
  assert.ok(wilsonLowerBound(95, 100) < 0.95);
});

test("learned routing refuses under-sampled cheap routes and uses verified causal cost", () => {
  const book = new RouteCalibrationBook();
  const key = buildContextKey({
    taskClass: "extract",
    effectClass: EFFECT_CLASS.PURE,
    riskClass: RISK_CLASS.NORMAL
  });

  for (let i = 0; i < 40; i += 1) {
    book.record({ contextKey: key, routeId: "mid", ok: i < 39, totalCausalCostUsd: 0.02 });
  }
  for (let i = 0; i < 3; i += 1) {
    book.record({ contextKey: key, routeId: "cheap", ok: true, totalCausalCostUsd: 0.001 });
  }

  const result = recommendLearnedRoute({
    calibrationBook: book,
    contextKey: key,
    mandate,
    minSamples: 20,
    candidateRoutes: [
      { routeId: "cheap", evidenceScore: 0.99, riskScore: 0.01, requiredAuthority: [] },
      { routeId: "mid", evidenceScore: 0.99, riskScore: 0.01, requiredAuthority: [] }
    ]
  });

  assert.equal(result.selected.routeId, "mid");
  assert.equal(result.evaluations.find((row) => row.routeId === "cheap").reason, "INSUFFICIENT_CALIBRATION");
});

test("Genius profile is descriptive telemetry rather than authority", () => {
  const profiles = new GeniusEconomicProfiles();
  profiles.record({
    geniusId: "coder",
    taskClass: "code",
    routeId: "local",
    ok: true,
    totalCausalCostUsd: 0,
    inputTokens: 1000,
    outputTokens: 200,
    contextClasses: ["LOSSLESS", "NBG_ADAPTIVE"]
  });
  profiles.record({
    geniusId: "coder",
    taskClass: "code",
    routeId: "mid",
    ok: false,
    totalCausalCostUsd: 0.02,
    inputTokens: 1200,
    outputTokens: 250,
    contextClasses: ["LOSSLESS"]
  });

  const profile = profiles.snapshot("coder", "code");
  assert.equal(profile.attempts, 2);
  assert.equal(profile.successRate, 0.5);
  assert.equal(profile.meanCausalCostUsd, 0.01);
  assert.equal("authority" in profile, false);
});

test("precedent promotes only stable, constitutional, sufficiently successful cases", () => {
  const cases = Array.from({ length: 10 }, (_, index) => ({
    signature: "code|normal|tests",
    action: { routeId: "mid+tests" },
    constitutionalCompliant: true,
    ok: index !== 9
  }));

  const rejected = compilePrecedentPolicy({
    signature: "code|normal|tests",
    cases,
    minCases: 10,
    maxFailureRate: 0.05
  });
  assert.equal(rejected.promoted, false);

  const promoted = compilePrecedentPolicy({
    signature: "code|normal|tests",
    cases: cases.map((item) => ({ ...item, ok: true })),
    minCases: 10,
    maxFailureRate: 0.05,
    policyVersion: "candidate-1"
  });
  assert.equal(promoted.promoted, true);
  assert.equal(promoted.policyCandidate.policyLevel, 2);
});

test("Cognitive Grant keeps contingency separate from operating stages", () => {
  const grant = createCognitiveGrant({
    grantId: "CG-1",
    objective: "Diagnose build",
    poolId: "project",
    maxCostUsd: 0.20,
    contingencyUsd: 0.05,
    stages: [
      { stageId: "probe", maxCostUsd: 0.02 },
      { stageId: "investigate", maxCostUsd: 0.08 },
      { stageId: "verify", maxCostUsd: 0.03 }
    ]
  });
  assert.equal(grant.operatingUsd, 0.15);
  assert.equal(grant.unallocatedOperatingUsd, 0.02);
});

test("portfolio allocator funds highest cognitive ROI within available capital", () => {
  const plan = allocateGrantPortfolio({
    availableUsd: 0.10,
    proposals: [
      { proposalId: "A", requestedUsd: 0.06, priorityWeight: 1, decisionValue: 1, expectedUncertaintyReduction: 0.9 },
      { proposalId: "B", requestedUsd: 0.04, priorityWeight: 2, decisionValue: 1, expectedUncertaintyReduction: 0.9 },
      { proposalId: "C", requestedUsd: 0.07, priorityWeight: 0.5, decisionValue: 1, expectedUncertaintyReduction: 0.5 }
    ]
  });
  assert.deepEqual(plan.funded.map((item) => item.proposalId), ["B", "A"]);
  assert.equal(plan.remainingUsd, 0);
});

function packet({ packetId, effectClass = EFFECT_CLASS.PURE, projectId = "p1", freshnessEpoch = "repo:1" }) {
  return createBudgetPacket({
    packetId,
    taskClass: "research",
    effectClass,
    scope: {
      tenantId: "t1",
      projectId,
      authorityScope: ["repo:read"],
      dataClassification: "internal",
      purpose: "research",
      freshnessEpoch,
      environmentFingerprint: "env:1"
    },
    segments: [{ segmentId: "task", class: SEGMENT_CLASS.LOSSLESS, content: "analyze artifact" }],
    tools: []
  });
}

test("compatible read-only requests fuse into one foundation with multiple projections", () => {
  const plan = planRequestFusion([
    {
      requestId: "r1",
      packet: packet({ packetId: "p1" }),
      evidenceSourceFingerprint: "artifact:abc",
      fusionTopic: "artifact-analysis",
      projection: { lens: "security" }
    },
    {
      requestId: "r2",
      packet: packet({ packetId: "p2" }),
      evidenceSourceFingerprint: "artifact:abc",
      fusionTopic: "artifact-analysis",
      projection: { lens: "architecture" }
    }
  ]);

  assert.equal(plan.fusedGroups.length, 1);
  const multicast = multicastFoundation({
    foundationResult: { facts: ["x"] },
    fusedGroup: plan.fusedGroups[0]
  });
  assert.equal(multicast.length, 2);
  assert.deepEqual(multicast[0].sharedFoundation, { facts: ["x"] });
});

test("mutation requests are never request-fused", () => {
  const plan = planRequestFusion([
    {
      requestId: "m1",
      packet: packet({ packetId: "m1", effectClass: EFFECT_CLASS.MUTATE }),
      evidenceSourceFingerprint: "mailbox",
      fusionTopic: "send"
    },
    {
      requestId: "m2",
      packet: packet({ packetId: "m2", effectClass: EFFECT_CLASS.MUTATE }),
      evidenceSourceFingerprint: "mailbox",
      fusionTopic: "send"
    }
  ]);
  assert.equal(plan.fusedGroups.length, 0);
  assert.equal(plan.unfused.length, 2);
});
