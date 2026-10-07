export class VerifierRegistry {
  #verifiers = new Map();

  register(verifier) {
    validateVerifier(verifier);
    if (this.#verifiers.has(verifier.verifierId)) {
      throw new Error(`verifier already registered: ${verifier.verifierId}`);
    }
    const normalized = Object.freeze({
      verifierId: verifier.verifierId,
      mechanism: verifier.mechanism,
      independenceScore: verifier.independenceScore,
      estimatedCostUsd: verifier.estimatedCostUsd ?? 0,
      deterministic: Boolean(verifier.deterministic),
      taskClasses: Object.freeze([...(verifier.taskClasses ?? [])]),
      verify: verifier.verify
    });
    this.#verifiers.set(verifier.verifierId, normalized);
    return normalized;
  }

  get(verifierId) {
    return this.#verifiers.get(verifierId) ?? null;
  }

  async run(verifierId, input, context = {}) {
    const verifier = this.get(verifierId);
    if (!verifier) throw new Error(`verifier unavailable: ${verifierId}`);
    const raw = await verifier.verify(input, context);
    if (!raw || typeof raw !== "object" || typeof raw.ok !== "boolean") {
      throw new Error(`verifier returned invalid result: ${verifierId}`);
    }
    const confidence = raw.confidence == null ? (raw.ok ? 1 : 0) : raw.confidence;
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new Error(`invalid verifier confidence: ${verifierId}`);
    }
    return Object.freeze({
      verifierId,
      mechanism: verifier.mechanism,
      ok: raw.ok,
      confidence,
      independenceScore: verifier.independenceScore,
      deterministic: verifier.deterministic,
      estimatedCostUsd: verifier.estimatedCostUsd,
      evidence: raw.evidence == null ? null : structuredClone(raw.evidence),
      reason: raw.reason ?? null
    });
  }
}

export function evaluateVerification({
  results,
  requireAll = true,
  minConfidence = 0,
  minIndependence = 0
}) {
  if (!Array.isArray(results) || results.length === 0) {
    return Object.freeze({ ok: false, reason: "NO_VERIFIERS", confidence: 0, independence: 0 });
  }
  for (const result of results) {
    if (!result || typeof result.ok !== "boolean") throw new TypeError("invalid verification result");
  }

  const confidence = aggregate(results.map((result) => result.confidence ?? (result.ok ? 1 : 0)));
  const independence = Math.max(...results.map((result) => result.independenceScore ?? 0));
  const passRule = requireAll ? results.every((result) => result.ok) : results.some((result) => result.ok);

  const reasons = [];
  if (!passRule) reasons.push("VERIFIER_FAILURE");
  if (confidence < minConfidence) reasons.push("VERIFICATION_CONFIDENCE_FLOOR");
  if (independence < minIndependence) reasons.push("VERIFIER_INDEPENDENCE_FLOOR");

  return Object.freeze({
    ok: reasons.length === 0,
    confidence,
    independence,
    reasons: Object.freeze(reasons),
    verifierIds: Object.freeze(results.map((result) => result.verifierId))
  });
}

function aggregate(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function validateVerifier(verifier) {
  if (!verifier || typeof verifier !== "object") throw new TypeError("verifier is required");
  for (const key of ["verifierId", "mechanism"]) {
    if (typeof verifier[key] !== "string" || verifier[key].trim() === "") {
      throw new TypeError(`${key} is required`);
    }
  }
  if (!Number.isFinite(verifier.independenceScore) || verifier.independenceScore < 0 || verifier.independenceScore > 1) {
    throw new TypeError("independenceScore must be in [0,1]");
  }
  if (verifier.estimatedCostUsd != null && (!Number.isFinite(verifier.estimatedCostUsd) || verifier.estimatedCostUsd < 0)) {
    throw new TypeError("estimatedCostUsd must be non-negative");
  }
  if (typeof verifier.verify !== "function") throw new TypeError("verifier.verify must be a function");
}
