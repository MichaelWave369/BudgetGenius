import { EFFECT_CLASS } from "./constants.js";

export const SEGMENT_CLASS = Object.freeze({
  LOCKED: "LOCKED",
  LOSSLESS: "LOSSLESS",
  STABLE_CACHEABLE: "STABLE_CACHEABLE",
  NBG_ADAPTIVE: "NBG_ADAPTIVE",
  RETRIEVABLE: "RETRIEVABLE",
  COMPRESSIBLE: "COMPRESSIBLE",
  PROJECTABLE: "PROJECTABLE",
  DROPPABLE: "DROPPABLE"
});

const segmentClasses = new Set(Object.values(SEGMENT_CLASS));
const effectClasses = new Set(Object.values(EFFECT_CLASS));

export function createBudgetPacket(input) {
  if (!input || typeof input !== "object") throw new TypeError("packet is required");
  for (const key of ["packetId", "taskClass"]) {
    if (typeof input[key] !== "string" || input[key].trim() === "") {
      throw new TypeError(`${key} must be a non-empty string`);
    }
  }
  if (!effectClasses.has(input.effectClass)) throw new TypeError("invalid effectClass");
  if (!input.scope || typeof input.scope !== "object") throw new TypeError("scope is required");
  if (!Array.isArray(input.segments)) throw new TypeError("segments must be an array");
  if (!Array.isArray(input.tools ?? [])) throw new TypeError("tools must be an array");

  const seen = new Set();
  const segments = input.segments.map((segment) => {
    if (!segment || typeof segment !== "object") throw new TypeError("segment must be an object");
    if (typeof segment.segmentId !== "string" || segment.segmentId.trim() === "") {
      throw new TypeError("segmentId must be a non-empty string");
    }
    if (seen.has(segment.segmentId)) throw new Error(`duplicate segmentId: ${segment.segmentId}`);
    seen.add(segment.segmentId);
    if (!segmentClasses.has(segment.class)) throw new TypeError(`invalid segment class: ${segment.class}`);
    if (segment.content == null && segment.ref == null) {
      throw new TypeError(`segment ${segment.segmentId} needs content or ref`);
    }
    return Object.freeze(structuredClone(segment));
  });

  return Object.freeze({
    packetId: input.packetId,
    taskClass: input.taskClass,
    effectClass: input.effectClass,
    scope: Object.freeze(structuredClone(input.scope)),
    segments: Object.freeze(segments),
    tools: Object.freeze((input.tools ?? []).map((tool) => Object.freeze(structuredClone(tool)))),
    outputContract: input.outputContract ? Object.freeze(structuredClone(input.outputContract)) : null,
    metadata: input.metadata ? Object.freeze(structuredClone(input.metadata)) : Object.freeze({})
  });
}
