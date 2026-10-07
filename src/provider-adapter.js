export class ProviderAdapterRegistry {
  #adapters = new Map();

  register(adapter) {
    if (!adapter || typeof adapter !== "object") throw new TypeError("adapter is required");
    if (typeof adapter.providerId !== "string" || adapter.providerId.trim() === "") {
      throw new TypeError("providerId is required");
    }
    if (this.#adapters.has(adapter.providerId)) throw new Error(`provider already registered: ${adapter.providerId}`);
    if (typeof adapter.dispatch !== "function") throw new TypeError("adapter.dispatch must be a function");
    const normalized = Object.freeze({
      providerId: adapter.providerId,
      supportsBatch: Boolean(adapter.supportsBatch),
      supportsPromptCache: Boolean(adapter.supportsPromptCache),
      dispatch: adapter.dispatch
    });
    this.#adapters.set(adapter.providerId, normalized);
    return normalized;
  }

  get(providerId) {
    return this.#adapters.get(providerId) ?? null;
  }

  async dispatch(plan, request) {
    const adapter = this.get(plan.providerId);
    if (!adapter) throw new Error(`provider adapter unavailable: ${plan.providerId}`);
    return adapter.dispatch(plan, request);
  }
}
