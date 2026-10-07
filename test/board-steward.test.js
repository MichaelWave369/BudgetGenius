import test from "node:test";
import assert from "node:assert/strict";
import {
  EFFECT_CLASS,
  RISK_CLASS,
  evaluateBoardReferral,
  createBoardCase,
  validVetoes,
  resolveStewardDecision,
  QualificationPortfolio,
  QUALIFICATION_STATUS,
  CognitiveTreasury,
  explorationPool,
  compilePolicySnapshot,
  signPolicySnapshot,
  verifySignedPolicySnapshot
} from "../src/index.js";

test("ordinary work stays off the Board fast path", () => {
  const referral = evaluateBoardReferral({
    projectedSpendUsd: 0.01,
    spendThresholdUsd: 0.50,
    riskClass: RISK_CLASS.NORMAL,
    effectClass: EFFECT_CLASS.PURE
  });
  assert.equal(referral.required, false);
  assert.deepEqual(referral.triggers, []);
});

test("irreversible or policy-conflicted work is referred to the Board", () => {
  const referral = evaluateBoardReferral({
    effectClass: EFFECT_CLASS.IRREVERSIBLE,
    policyConflict: true
  });
  assert.equal(referral.required, true);
  assert.deepEqual(referral.triggers, ["IRREVERSIBLE_EFFECT", "POLICY_CONFLICT"]);
});

test("only vetoes inside a seat's domain are binding", () => {
  const boardCase = createBoardCase({
    caseId: "BG-1",
    mandateId: "CM-1",
    objective: "Choose safe route",
    referral: { required: true, triggers: ["HIGH_RISK"] },
    candidates: [
      { candidateId: "A", utilityScore: 10, economicCostUsd: 0.01 },
      { candidateId: "B", utilityScore: 8, economicCostUsd: 0.02 }
    ],
    opinions: [
      { seatId: "RISK", stance: "VETO", candidateId: "A", domain: "RISK", reason: "rollback unavailable" },
      { seatId: "TREASURY", stance: "VETO", candidateId: "B", domain: "QUALITY", reason: "not treasury domain" }
    ]
  });

  const vetoes = validVetoes(boardCase);
  assert.deepEqual(vetoes.map((v) => v.candidateId), ["A"]);

  const decision = resolveStewardDecision({ boardCase });
  assert.equal(decision.ruling.selectedCandidateId, "B");
});

test("Steward records dissent but does not use simple majority voting", () => {
  const boardCase = createBoardCase({
    caseId: "BG-2",
    mandateId: "CM-2",
    objective: "Select highest-value qualified candidate",
    referral: { required: true, triggers: ["OPERATOR_REQUEST"] },
    candidates: [
      { candidateId: "A", utilityScore: 5, economicCostUsd: 0.01 },
      { candidateId: "B", utilityScore: 9, economicCostUsd: 0.05 }
    ],
    opinions: [
      { seatId: "TREASURY", stance: "OBJECT", candidateId: "B", domain: "ACCOUNTING", reason: "costlier" },
      { seatId: "SCIENCE", stance: "SUPPORT", candidateId: "B", domain: "QUALITY" },
      { seatId: "SYSTEMS", stance: "SUPPORT", candidateId: "A", domain: "TECHNICAL_FEASIBILITY" }
    ],
    metadata: { precedentSignature: "research|important" }
  });

  const decision = resolveStewardDecision({
    boardCase,
    precedentEligible: true,
    policyCandidateEligible: true
  });
  assert.equal(decision.ruling.selectedCandidateId, "B");
  assert.equal(decision.ruling.dissent.length, 1);
  assert.equal(decision.precedent.status, "CANDIDATE");
  assert.equal(decision.policyCandidate.policyLevel, 2);
});

test("qualification portfolio enforces staged promotion and suspension", () => {
  const portfolio = new QualificationPortfolio();
  portfolio.register({
    assetId: "model:x",
    assetType: "MODEL",
    taskClasses: ["extract"]
  });
  assert.equal(portfolio.isQualified("model:x", { taskClass: "extract" }), false);

  portfolio.transition("model:x", QUALIFICATION_STATUS.SHADOW, { reason: "start evaluation" });
  portfolio.transition("model:x", QUALIFICATION_STATUS.LIMITED, { reason: "shadow passed" });
  portfolio.transition("model:x", QUALIFICATION_STATUS.QUALIFIED, { reason: "limited passed" });
  assert.equal(portfolio.isQualified("model:x", { taskClass: "extract" }), true);

  portfolio.transition("model:x", QUALIFICATION_STATUS.SUSPENDED, { reason: "regression" });
  assert.equal(portfolio.isQualified("model:x", { taskClass: "extract" }), false);
  assert.throws(
    () => portfolio.transition("model:x", QUALIFICATION_STATUS.PREFERRED),
    /INVALID_QUALIFICATION_TRANSITION/
  );
});

test("treasury keeps exploration capital bounded and reserve protected", () => {
  const treasury = new CognitiveTreasury({
    totalUsd: 10,
    liquidReserveUsd: 2,
    pools: [
      { poolId: "operations", purpose: "OPERATING", allocationUsd: 5 },
      explorationPool({ allocationUsd: 1 })
    ]
  });

  assert.equal(treasury.commit({ poolId: "exploration", amountUsd: 0.8 }).ok, true);
  assert.equal(treasury.commit({ poolId: "exploration", amountUsd: 0.3 }).ok, false);
  assert.throws(
    () => treasury.transferFromReserve({ poolId: "operations", amountUsd: 1, authorization: "SELF_APPROVED" }),
    /RESERVE_AUTHORIZATION_REQUIRED/
  );

  const transfer = treasury.transferFromReserve({
    poolId: "operations",
    amountUsd: 1,
    authorization: "BOARD_CONTINGENCY"
  });
  assert.equal(transfer.ok, true);
  assert.equal(treasury.snapshot().reserveAvailableUsd, 1);
});

test("signed policy snapshots detect tampering", () => {
  const snapshot = compilePolicySnapshot({
    snapshotId: "PS-1",
    issuedAt: "2026-10-07T20:00:00Z",
    constitutionVersion: "0.1.0",
    boardPolicyVersion: "0.1.0",
    operatingPolicyVersion: "0.5.0",
    qualificationVersion: 4,
    priceTableVersion: "prices-1",
    directives: { localFirst: true },
    precedents: [{ id: "BG-1" }]
  });
  const signed = signPolicySnapshot(snapshot, { keyId: "test-key", secret: "secret" });
  assert.equal(verifySignedPolicySnapshot(signed, { secret: "secret" }), true);

  const tampered = {
    ...signed,
    snapshot: {
      ...signed.snapshot,
      directives: { localFirst: false }
    }
  };
  assert.equal(verifySignedPolicySnapshot(tampered, { secret: "secret" }), false);
});
