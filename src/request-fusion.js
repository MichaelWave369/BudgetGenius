import { createHash } from "node:crypto";
import { EFFECT_CLASS } from "./constants.js";
import { governedScopeFingerprint } from "./governed-cache.js";

export function fusionKeyForRequest({
  packet,
  evidenceSourceFingerprint,
  fusionTopic
}) {
  if (!packet) throw new TypeError("packet is required");
  if (!evidenceSourceFingerprint || !fusionTopic) throw new TypeError("evidenceSourceFingerprint and fusionTopic are required");
  if (!fusionEligible(packet)) return null;

  const payload = {
    scope: governedScopeFingerprint(packet.scope),
    effectClass: packet.effectClass,
    evidenceSourceFingerprint,
    fusionTopic,
    freshnessEpoch: packet.scope?.freshnessEpoch ?? null,
    environmentFingerprint: packet.scope?.environmentFingerprint ?? null
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function planRequestFusion(requests) {
  if (!Array.isArray(requests)) throw new TypeError("requests must be an array");
  const groups = new Map();
  const unfused = [];

  for (const request of requests) {
    const key = fusionKeyForRequest(request);
    if (!key) {
      unfused.push(Object.freeze({ ...request, reason: "FUSION_INELIGIBLE_EFFECT" }));
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(request);
    groups.set(key, group);
  }

  const fusedGroups = [];
  for (const [fusionKey, group] of groups) {
    if (group.length < 2) {
      unfused.push(Object.freeze({ ...group[0], reason: "NO_COMPATIBLE_PEER" }));
      continue;
    }
    fusedGroups.push(Object.freeze({
      fusionKey,
      requestIds: Object.freeze(group.map((item) => item.requestId)),
      foundation: Object.freeze({
        evidenceSourceFingerprint: group[0].evidenceSourceFingerprint,
        fusionTopic: group[0].fusionTopic,
        scopeFingerprint: governedScopeFingerprint(group[0].packet.scope)
      }),
      projections: Object.freeze(group.map((item) => Object.freeze({
        requestId: item.requestId,
        projection: structuredClone(item.projection ?? {})
      })))
    }));
  }

  return Object.freeze({
    fusedGroups: Object.freeze(fusedGroups),
    unfused: Object.freeze(unfused)
  });
}

export function multicastFoundation({ foundationResult, fusedGroup }) {
  return Object.freeze(
    fusedGroup.projections.map((projection) => Object.freeze({
      requestId: projection.requestId,
      sharedFoundation: structuredClone(foundationResult),
      projection: structuredClone(projection.projection)
    }))
  );
}

function fusionEligible(packet) {
  if (packet.effectClass === EFFECT_CLASS.PURE) return true;
  if (packet.effectClass === EFFECT_CLASS.READ) return Boolean(packet.scope?.freshnessEpoch);
  return false;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
