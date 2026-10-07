import { randomUUID } from "node:crypto";
import { PASS_STATE } from "./constants.js";
import { CONSTITUTION_VERSION } from "./constitution.js";
import { validateMandate } from "./mandate.js";
import { selectRoute } from "./router.js";
import { transition } from "./state-machine.js";

export function planBudgetPass({ mandate, candidates, banker, ledger, routingPolicyVersion = "0.1.0" }) {
  validateMandate(mandate);
  let pass = Object.freeze({
    passId: randomUUID(),
    mandateId: mandate.mandateId,
    poolId: mandate.poolId,
    state: PASS_STATE.PROPOSED,
    constitutionVersion: CONSTITUTION_VERSION,
    routingPolicyVersion
  });

  pass = transition(pass, PASS_STATE.ADMITTED);
  const plan = selectRoute(candidates, mandate);
  pass = transition(pass, PASS_STATE.PLANNED);

  if (!plan.selected) {
    const rejected = transition(pass, PASS_STATE.REJECTED);
    ledger?.append({
      type: "PASS_REJECTED",
      passId: rejected.passId,
      mandateId: mandate.mandateId,
      reason: "NO_QUALIFIED_ROUTE",
      counterfactuals: plan.counterfactuals
    });
    return Object.freeze({ pass: rejected, plan });
  }

  const reserveAmount = round(plan.selected.estimatedCostUsd + (plan.selected.escalationBondUsd ?? 0));
  const leaseId = `lease:${pass.passId}`;
  const reservation = banker.reserve({ leaseId, poolId: mandate.poolId, amountUsd: reserveAmount });
  if (!reservation.ok) {
    const rejected = transition(pass, PASS_STATE.REJECTED);
    ledger?.append({
      type: "PASS_REJECTED",
      passId: rejected.passId,
      mandateId: mandate.mandateId,
      reason: reservation.reason,
      blockingPoolId: reservation.blockingPoolId,
      selectedRouteId: plan.selected.routeId
    });
    return Object.freeze({ pass: rejected, plan, reservation });
  }

  pass = transition(pass, PASS_STATE.RESERVED);
  pass = Object.freeze({
    ...pass,
    leaseId,
    selectedRouteId: plan.selected.routeId,
    reservedUsd: reserveAmount
  });
  ledger?.append({
    type: "PASS_RESERVED",
    passId: pass.passId,
    mandateId: mandate.mandateId,
    leaseId,
    routeId: plan.selected.routeId,
    reservedUsd: reserveAmount,
    counterfactuals: plan.counterfactuals
  });
  return Object.freeze({ pass, plan, reservation });
}

export function markDispatched(pass) {
  return transition(pass, PASS_STATE.DISPATCHED);
}

export function markReceived(pass) {
  return transition(pass, PASS_STATE.RECEIVED);
}

export function markVerified(pass) {
  return transition(pass, PASS_STATE.VERIFIED);
}

export function settleBudgetPass({ pass, actualUsd, banker, ledger, baselineEstimatedCostUsd = null }) {
  if (pass.state !== PASS_STATE.VERIFIED) throw new Error("PASS_NOT_VERIFIED");
  const settlement = banker.settle({ leaseId: pass.leaseId, actualUsd });
  const settled = transition(pass, PASS_STATE.SETTLED);
  const baseline = Number.isFinite(baselineEstimatedCostUsd) ? baselineEstimatedCostUsd : null;
  const provisionalSavingsUsd = baseline === null ? null : round(Math.max(0, baseline - actualUsd));
  const receipt = Object.freeze({
    passId: pass.passId,
    mandateId: pass.mandateId,
    routeId: pass.selectedRouteId,
    reservedUsd: settlement.reservedUsd,
    actualUsd: settlement.actualUsd,
    refundedUsd: settlement.refundedUsd,
    baselineEstimatedCostUsd: baseline,
    provisionalSavingsUsd,
    verifiedSavingsUsd: null,
    constitutionVersion: pass.constitutionVersion,
    routingPolicyVersion: pass.routingPolicyVersion
  });
  ledger?.append({ type: "PASS_SETTLED", ...receipt });
  return Object.freeze({ pass: settled, receipt });
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
