import { evaluateVerification } from "./verifier-registry.js";
import { certifySavings } from "./savings-audit.js";
import { routingRegret } from "./shadow-eval.js";

export function buildAuditReport({
  passId,
  verificationResults,
  verificationPolicy = {},
  receipt,
  outcomeVerified,
  attributableCostsUsd = [],
  shadowRecord = null,
  negativeResults = []
}) {
  const verification = evaluateVerification({
    results: verificationResults,
    requireAll: verificationPolicy.requireAll !== false,
    minConfidence: verificationPolicy.minConfidence ?? 0,
    minIndependence: verificationPolicy.minIndependence ?? 0
  });

  const savings = certifySavings({
    receipt,
    outcomeVerified: Boolean(outcomeVerified && verification.ok),
    attributableCostsUsd
  });

  const regret = shadowRecord ? routingRegret(shadowRecord) : null;

  return Object.freeze({
    passId,
    verification,
    savings,
    regret,
    negativeResults: Object.freeze(negativeResults.map((item) => Object.freeze(structuredClone(item))))
  });
}
