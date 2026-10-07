import test from "node:test";
import assert from "node:assert/strict";
import {
  BudgetBanker,
  BudgetLedger,
  EFFECT_CLASS,
  RISK_CLASS,
  createMandate,
  planBudgetPass,
  markDispatched,
  markReceived,
  markVerified,
  settleBudgetPass
} from "../src/index.js";

test("qualified route reserves, verifies, settles, and refunds", () => {
  const banker = new BudgetBanker();
  banker.createPool({ poolId: "project", limitUsd: 1.0 });
  const ledger = new BudgetLedger();
  const mandate = createMandate({
    mandateId: "CM-42",
    objective: "Diagnose and propose a repair",
    poolId: "project",
    qualityFloor: 0.95,
    evidenceFloor: 0.9,
    maxRiskScore: 0.2,
    maxCostUsd: 0.2,
    authority: ["repo:read"],
    effectClass: EFFECT_CLASS.PROPOSE,
    riskClass: RISK_CLASS.IMPORTANT,
    baseline: { routeId: "frontier", estimatedCostUsd: 0.12 }
  });

  const planned = planBudgetPass({
    mandate,
    banker,
    ledger,
    candidates: [{
      routeId: "local-mid",
      estimatedCostUsd: 0.03,
      escalationBondUsd: 0.02,
      successProbability: 0.97,
      evidenceScore: 0.95,
      riskScore: 0.1,
      requiredAuthority: ["repo:read"]
    }]
  });

  assert.equal(planned.pass.state, "RESERVED");
  assert.equal(planned.pass.reservedUsd, 0.05);

  let pass = markDispatched(planned.pass);
  pass = markReceived(pass);
  pass = markVerified(pass);

  const settled = settleBudgetPass({
    pass,
    actualUsd: 0.021,
    banker,
    ledger,
    baselineEstimatedCostUsd: mandate.baseline.estimatedCostUsd
  });

  assert.equal(settled.pass.state, "SETTLED");
  assert.equal(settled.receipt.refundedUsd, 0.029);
  assert.equal(settled.receipt.provisionalSavingsUsd, 0.099);
  assert.equal(settled.receipt.verifiedSavingsUsd, null);
  assert.equal(ledger.all().length, 2);
});

test("no qualified route rejects rather than silently degrading quality", () => {
  const banker = new BudgetBanker();
  banker.createPool({ poolId: "project", limitUsd: 1.0 });
  const mandate = createMandate({
    mandateId: "CM-43",
    objective: "High confidence answer",
    poolId: "project",
    qualityFloor: 0.99,
    evidenceFloor: 0.95,
    maxRiskScore: 0.1,
    maxCostUsd: 0.2,
    authority: [],
    effectClass: EFFECT_CLASS.PURE,
    riskClass: RISK_CLASS.NORMAL
  });

  const planned = planBudgetPass({
    mandate,
    banker,
    candidates: [{
      routeId: "cheap",
      estimatedCostUsd: 0.001,
      successProbability: 0.90,
      evidenceScore: 0.99,
      riskScore: 0.01,
      requiredAuthority: []
    }]
  });

  assert.equal(planned.pass.state, "REJECTED");
  assert.equal(planned.plan.selected, null);
});
