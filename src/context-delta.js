import { createHash } from "node:crypto";

export function segmentFingerprint(segment) {
  const payload = {
    class: segment.class,
    content: segment.content ?? null,
    ref: segment.ref ?? null,
    metadata: segment.metadata ?? null
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export function computeContextDelta(previousPacket, nextPacket) {
  const previous = new Map((previousPacket?.segments ?? []).map((segment) => [segment.segmentId, segment]));
  const next = new Map((nextPacket?.segments ?? []).map((segment) => [segment.segmentId, segment]));

  const added = [];
  const changed = [];
  const unchanged = [];
  const removed = [];

  for (const [segmentId, segment] of next) {
    const old = previous.get(segmentId);
    if (!old) {
      added.push(segmentId);
      continue;
    }
    if (segmentFingerprint(old) === segmentFingerprint(segment)) unchanged.push(segmentId);
    else changed.push(segmentId);
  }

  for (const segmentId of previous.keys()) {
    if (!next.has(segmentId)) removed.push(segmentId);
  }

  return Object.freeze({
    added: Object.freeze(added),
    changed: Object.freeze(changed),
    unchanged: Object.freeze(unchanged),
    removed: Object.freeze(removed)
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
