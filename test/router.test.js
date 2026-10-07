import test from "node:test";
import assert from "node:assert/strict";
import { createMandate } from "../src/mandate.js";
import { selectRoute } from "../src/router.js";
import { EFFECT_CLASS, RISK_CLASS } from "../src/constants.js";

const mandate = createMandate({
  mandateId: "CM-1",
  objective: "Produce a verified patch",
  poolId: "project",
  qualityFloor: 0.95,
  evidenceFloor: 0.9,
  maxRiskScore: 0.2,
  maxCostUsd: 0.2,
  authority: ["repo:read", "patch:propose"],
  effectClass: EFFECT_CLASS.PROPOSE,
  riskClass: RISK_CLASS.IMPORTANT
});

test("cheapest route loses when it misses a hard quality floor", () => {
  const result = selectRoute([
    {
      routeId: "cheap",
      estimatedCostUsd: 0.001,
      successProbability: 0.90,
      evidenceScore: 0.99,
      riskScore: 0.05,
      requiredAuthority: ["repo:read"]
    },
    {
      routeId: "mid",
      estimatedCostUsd: 0.02,
      successProbability: 0.97,
      evidenceScore: 0.96,
      riskScore: 0.05,
      requiredAuthority: ["repo:read"]
    },
    {
      routeId: "frontier",
      estimatedCostUsd: 0.1,
      successProbability: 0.99,
      evidenceScore: 0.99,
      riskScore: 0.03,
      requiredAuthority: ["repo:read"]
    }
  ], mandate);

  assert.equal(result.selected.routeId, "mid");
  const cheap = result.counterfactuals.find((x) => x.routeId === "cheap");
  assert.deepEqual(cheap.rejectionReasons, ["QUALITY_FLOOR"]);
});

test("authority boundaries disqualify otherwise attractive routes", () => {
  const result = selectRoute([{
    routeId: "mutator",
    estimatedCostUsd: 0.01,
    successProbability: 0.99,
    evidenceScore: 0.99,
    riskScore: 0.01,
    requiredAuthority: ["repo:merge"]
  }], mandate);

  assert.equal(result.selected, null);
  assert.deepEqual(result.counterfactuals[0].rejectionReasons, ["AUTHORITY"]);
});
