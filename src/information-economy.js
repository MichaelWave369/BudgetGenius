import { computeContextDelta } from "./context-delta.js";
import { projectTools } from "./tool-projection.js";
import { selectNbgResolution } from "./nbg-adapter.js";
import { SEGMENT_CLASS } from "./budget-packet.js";

export function prepareInformationPass({
  packet,
  previousPacket = null,
  exactCache = null,
  requiredCapabilities = [],
  requiredToolNames = [],
  bubblesById = {},
  requiredEvidenceScore = 0,
  nbgTokenBudget = Number.POSITIVE_INFINITY
}) {
  const cacheResult = exactCache ? exactCache.get({ packet }) : Object.freeze({ hit: false, reason: "CACHE_DISABLED" });
  if (cacheResult.hit) {
    return Object.freeze({
      action: "CACHE_HIT",
      cacheResult,
      delta: null,
      toolProjection: null,
      nbgSelections: Object.freeze([])
    });
  }

  const delta = computeContextDelta(previousPacket, packet);
  const toolProjection = projectTools({
    availableTools: packet.tools,
    requiredCapabilities,
    requiredToolNames
  });

  const nbgSelections = [];
  for (const segment of packet.segments) {
    if (segment.class !== SEGMENT_CLASS.NBG_ADAPTIVE) continue;
    const bubbleId = segment.metadata?.bubbleId ?? segment.ref;
    const bubble = bubblesById[bubbleId];
    if (!bubble) {
      nbgSelections.push(Object.freeze({ segmentId: segment.segmentId, bubbleId, selected: null, reason: "BUBBLE_UNAVAILABLE" }));
      continue;
    }
    const resolution = selectNbgResolution({
      bubble,
      requiredEvidenceScore,
      tokenBudget: nbgTokenBudget
    });
    nbgSelections.push(Object.freeze({ segmentId: segment.segmentId, ...resolution }));
  }

  return Object.freeze({
    action: "PREPARED",
    cacheResult,
    delta,
    toolProjection,
    nbgSelections: Object.freeze(nbgSelections)
  });
}
