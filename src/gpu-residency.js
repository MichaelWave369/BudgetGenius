export class GpuResidencyRegistry {
  #models = new Map();

  set(modelId, state) {
    if (typeof modelId !== "string" || modelId.trim() === "") throw new TypeError("modelId is required");
    const normalized = {
      modelId,
      resident: Boolean(state?.resident),
      gpuFit: state?.gpuFit !== false,
      loadMs: finiteNonNegative(state?.loadMs ?? 0, "loadMs"),
      evictionMs: finiteNonNegative(state?.evictionMs ?? 0, "evictionMs"),
      vramGb: finiteNonNegative(state?.vramGb ?? 0, "vramGb")
    };
    this.#models.set(modelId, Object.freeze(normalized));
    return this.#models.get(modelId);
  }

  get(modelId) {
    return this.#models.get(modelId) ?? null;
  }
}

export function quoteGpuResidency({ registry, modelId, movementUsdPerSecond = 0 }) {
  const state = registry?.get(modelId) ?? null;
  if (!state) {
    return Object.freeze({
      known: false,
      resident: false,
      gpuFit: null,
      movementMs: 0,
      movementCostUsd: 0
    });
  }
  const movementMs = state.resident ? 0 : state.loadMs + state.evictionMs;
  return Object.freeze({
    known: true,
    resident: state.resident,
    gpuFit: state.gpuFit,
    movementMs,
    movementCostUsd: round(movementMs / 1000 * movementUsdPerSecond),
    vramGb: state.vramGb
  });
}

function finiteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be non-negative`);
  return value;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
