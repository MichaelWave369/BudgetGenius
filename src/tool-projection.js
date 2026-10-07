export function projectTools({ availableTools = [], requiredCapabilities = [], requiredToolNames = [] }) {
  const byName = new Map();
  for (const tool of availableTools) {
    if (!tool || typeof tool.name !== "string") throw new TypeError("every tool requires a name");
    if (byName.has(tool.name)) throw new Error(`duplicate tool name: ${tool.name}`);
    byName.set(tool.name, tool);
  }

  const selected = new Map();
  for (const tool of availableTools) {
    if (tool.mandatory) selected.set(tool.name, tool);
  }

  for (const name of requiredToolNames) {
    const tool = byName.get(name);
    if (!tool) throw new Error(`required tool unavailable: ${name}`);
    selected.set(name, tool);
  }

  const required = new Set(requiredCapabilities);
  removeCovered(required, selected.values());

  const candidates = availableTools.filter((tool) => !selected.has(tool.name));
  while (required.size > 0) {
    const ranked = candidates
      .filter((tool) => !selected.has(tool.name))
      .map((tool) => ({
        tool,
        coverage: (tool.capabilities ?? []).filter((capability) => required.has(capability)).length
      }))
      .filter((entry) => entry.coverage > 0)
      .sort((a, b) => b.coverage - a.coverage || a.tool.name.localeCompare(b.tool.name));

    if (ranked.length === 0) break;
    selected.set(ranked[0].tool.name, ranked[0].tool);
    removeCovered(required, [ranked[0].tool]);
  }

  return Object.freeze({
    tools: Object.freeze([...selected.values()].map((tool) => Object.freeze(structuredClone(tool)))),
    unresolvedCapabilities: Object.freeze([...required].sort())
  });
}

function removeCovered(required, tools) {
  for (const tool of tools) {
    for (const capability of tool.capabilities ?? []) required.delete(capability);
  }
}
