import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function compilePolicySnapshot({
  snapshotId,
  issuedAt,
  constitutionVersion,
  boardPolicyVersion,
  operatingPolicyVersion,
  qualificationVersion,
  priceTableVersion = null,
  directives = {},
  precedents = []
}) {
  for (const [name, value] of Object.entries({
    snapshotId,
    issuedAt,
    constitutionVersion,
    boardPolicyVersion,
    operatingPolicyVersion
  })) {
    requireString(name, value);
  }
  if (!Number.isInteger(qualificationVersion) || qualificationVersion < 0) {
    throw new TypeError("qualificationVersion must be a non-negative integer");
  }

  const payload = Object.freeze({
    snapshotId,
    issuedAt,
    constitutionVersion,
    boardPolicyVersion,
    operatingPolicyVersion,
    qualificationVersion,
    priceTableVersion,
    directives: Object.freeze(structuredClone(directives)),
    precedents: Object.freeze(precedents.map((item) => Object.freeze(structuredClone(item))))
  });
  const digest = sha256(stableStringify(payload));

  return Object.freeze({
    ...payload,
    digest
  });
}

export function signPolicySnapshot(snapshot, {
  keyId,
  secret
}) {
  requireString("keyId", keyId);
  if (typeof secret !== "string" && !Buffer.isBuffer(secret)) throw new TypeError("secret is required");
  const signature = createHmac("sha256", secret).update(snapshot.digest).digest("hex");
  return Object.freeze({
    snapshot: Object.freeze(structuredClone(snapshot)),
    signature: Object.freeze({
      algorithm: "HMAC-SHA256",
      keyId,
      value: signature
    })
  });
}

export function verifySignedPolicySnapshot(signed, {
  secret
}) {
  if (!signed?.snapshot || !signed?.signature) return false;
  const rebuilt = compilePolicySnapshot({
    snapshotId: signed.snapshot.snapshotId,
    issuedAt: signed.snapshot.issuedAt,
    constitutionVersion: signed.snapshot.constitutionVersion,
    boardPolicyVersion: signed.snapshot.boardPolicyVersion,
    operatingPolicyVersion: signed.snapshot.operatingPolicyVersion,
    qualificationVersion: signed.snapshot.qualificationVersion,
    priceTableVersion: signed.snapshot.priceTableVersion,
    directives: signed.snapshot.directives,
    precedents: signed.snapshot.precedents
  });
  if (rebuilt.digest !== signed.snapshot.digest) return false;

  const expected = createHmac("sha256", secret).update(signed.snapshot.digest).digest();
  let actual;
  try {
    actual = Buffer.from(signed.signature.value, "hex");
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
}
