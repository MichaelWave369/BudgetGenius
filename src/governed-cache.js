import { createHash } from "node:crypto";
import { EFFECT_CLASS } from "./constants.js";

const NEVER_RESULT_CACHE = new Set([EFFECT_CLASS.MUTATE, EFFECT_CLASS.IRREVERSIBLE]);

export function resultCacheEligible(packet) {
  if (NEVER_RESULT_CACHE.has(packet.effectClass)) return false;
  if (packet.effectClass === EFFECT_CLASS.READ && !packet.scope?.freshnessEpoch) return false;
  return true;
}

export function governedScopeFingerprint(scope) {
  const normalized = {
    tenantId: scope?.tenantId ?? null,
    projectId: scope?.projectId ?? null,
    authorityScope: [...(scope?.authorityScope ?? [])].sort(),
    dataClassification: scope?.dataClassification ?? null,
    purpose: scope?.purpose ?? null,
    freshnessEpoch: scope?.freshnessEpoch ?? null,
    environmentFingerprint: scope?.environmentFingerprint ?? null
  };
  return sha256(stableStringify(normalized));
}

export function exactRequestFingerprint(packet) {
  const normalized = {
    taskClass: packet.taskClass,
    effectClass: packet.effectClass,
    segments: packet.segments,
    tools: packet.tools,
    outputContract: packet.outputContract
  };
  return sha256(stableStringify(normalized));
}

export class GovernedExactCache {
  #entries = new Map();

  put({ packet, value, ttlMs = 60_000, now = Date.now() }) {
    if (!resultCacheEligible(packet)) {
      return Object.freeze({ stored: false, reason: "RESULT_CACHE_INELIGIBLE_EFFECT" });
    }
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new TypeError("ttlMs must be positive");
    const key = this.#key(packet);
    this.#entries.set(key, {
      expiresAt: now + ttlMs,
      value: structuredClone(value),
      scopeFingerprint: governedScopeFingerprint(packet.scope),
      requestFingerprint: exactRequestFingerprint(packet)
    });
    return Object.freeze({ stored: true, key });
  }

  get({ packet, now = Date.now() }) {
    if (!resultCacheEligible(packet)) {
      return Object.freeze({ hit: false, reason: "RESULT_CACHE_INELIGIBLE_EFFECT" });
    }
    const key = this.#key(packet);
    const entry = this.#entries.get(key);
    if (!entry) return Object.freeze({ hit: false, reason: "MISS" });
    if (entry.expiresAt <= now) {
      this.#entries.delete(key);
      return Object.freeze({ hit: false, reason: "EXPIRED" });
    }
    return Object.freeze({
      hit: true,
      value: structuredClone(entry.value),
      scopeFingerprint: entry.scopeFingerprint,
      requestFingerprint: entry.requestFingerprint
    });
  }

  #key(packet) {
    return `${governedScopeFingerprint(packet.scope)}:${exactRequestFingerprint(packet)}`;
  }
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
