export function compilePrecedentPolicy({
  signature,
  cases,
  minCases = 10,
  maxFailureRate = 0.02,
  policyVersion
}) {
  if (typeof signature !== "string" || signature.trim() === "") throw new TypeError("signature is required");
  if (!Array.isArray(cases) || cases.length === 0) throw new TypeError("cases are required");
  if (!Number.isInteger(minCases) || minCases < 1) throw new TypeError("minCases must be positive");
  if (!Number.isFinite(maxFailureRate) || maxFailureRate < 0 || maxFailureRate > 1) {
    throw new TypeError("maxFailureRate must be in [0,1]");
  }

  const comparable = cases.filter((item) => item.signature === signature);
  if (comparable.length < minCases) {
    return Object.freeze({
      promoted: false,
      reason: "INSUFFICIENT_PRECEDENT",
      comparableCases: comparable.length
    });
  }

  if (comparable.some((item) => item.constitutionalCompliant !== true)) {
    return Object.freeze({
      promoted: false,
      reason: "CONSTITUTIONAL_NONCOMPLIANCE",
      comparableCases: comparable.length
    });
  }

  const actionKeys = new Set(comparable.map((item) => stableStringify(item.action)));
  if (actionKeys.size !== 1) {
    return Object.freeze({
      promoted: false,
      reason: "UNSTABLE_PRECEDENT_ACTION",
      comparableCases: comparable.length
    });
  }

  const failures = comparable.filter((item) => item.ok !== true).length;
  const failureRate = failures / comparable.length;
  if (failureRate > maxFailureRate) {
    return Object.freeze({
      promoted: false,
      reason: "FAILURE_RATE_TOO_HIGH",
      comparableCases: comparable.length,
      failureRate: round(failureRate)
    });
  }

  const first = comparable[0];
  return Object.freeze({
    promoted: true,
    policyCandidate: Object.freeze({
      policyLevel: 2,
      policyVersion: policyVersion ?? "candidate",
      signature,
      action: Object.freeze(structuredClone(first.action)),
      evidence: Object.freeze({
        cases: comparable.length,
        failures,
        failureRate: round(failureRate)
      })
    })
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
