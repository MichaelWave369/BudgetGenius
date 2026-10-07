const DEFAULT_LEVEL_ORDER = Object.freeze(["L4", "L3", "L2", "L1", "L0"]);

export function selectNbgResolution({
  bubble,
  requiredEvidenceScore = 0,
  tokenBudget = Number.POSITIVE_INFINITY,
  levelOrder = DEFAULT_LEVEL_ORDER
}) {
  if (!bubble || typeof bubble !== "object") throw new TypeError("bubble is required");
  if (!Array.isArray(bubble.levels) || bubble.levels.length === 0) throw new TypeError("bubble.levels is required");

  const rank = new Map(levelOrder.map((level, index) => [level, index]));
  const candidates = bubble.levels
    .filter((level) => Number.isFinite(level.tokens) && level.tokens >= 0)
    .filter((level) => Number.isFinite(level.evidenceScore) && level.evidenceScore >= requiredEvidenceScore)
    .filter((level) => level.tokens <= tokenBudget)
    .sort((a, b) =>
      (rank.get(a.level) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.level) ?? Number.MAX_SAFE_INTEGER) ||
      a.tokens - b.tokens
    );

  if (candidates.length === 0) {
    return Object.freeze({
      bubbleId: bubble.bubbleId,
      selected: null,
      reason: "NO_QUALIFIED_RESOLUTION"
    });
  }

  return Object.freeze({
    bubbleId: bubble.bubbleId,
    selected: Object.freeze(structuredClone(candidates[0])),
    reason: "CHEAPEST_QUALIFIED_RESOLUTION"
  });
}

export function expandNbgResolution({ bubble, currentLevel, levelOrder = DEFAULT_LEVEL_ORDER }) {
  const index = levelOrder.indexOf(currentLevel);
  if (index < 0) throw new Error(`unknown current level: ${currentLevel}`);
  for (let i = index + 1; i < levelOrder.length; i += 1) {
    const found = bubble.levels.find((level) => level.level === levelOrder[i]);
    if (found) return Object.freeze(structuredClone(found));
  }
  return null;
}

export { DEFAULT_LEVEL_ORDER };
