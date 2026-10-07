import test from "node:test";
import assert from "node:assert/strict";
import {
  EFFECT_CLASS,
  SEGMENT_CLASS,
  createBudgetPacket,
  GovernedExactCache,
  computeContextDelta,
  projectTools,
  selectNbgResolution,
  expandNbgResolution,
  createHandoffPacket,
  prepareInformationPass
} from "../src/index.js";

function packet(overrides = {}) {
  return createBudgetPacket({
    packetId: overrides.packetId ?? "P-1",
    taskClass: overrides.taskClass ?? "lookup",
    effectClass: overrides.effectClass ?? EFFECT_CLASS.PURE,
    scope: overrides.scope ?? {
      tenantId: "t1",
      projectId: "p1",
      authorityScope: ["repo:read"],
      dataClassification: "internal",
      purpose: "build",
      freshnessEpoch: "repo:abc123",
      environmentFingerprint: "env:v1"
    },
    segments: overrides.segments ?? [{
      segmentId: "task",
      class: SEGMENT_CLASS.LOSSLESS,
      content: "Find the failing contract."
    }],
    tools: overrides.tools ?? [],
    outputContract: overrides.outputContract ?? { format: "json" }
  });
}

test("exact governed cache does not cross project scope", () => {
  const cache = new GovernedExactCache();
  const a = packet();
  assert.equal(cache.put({ packet: a, value: { answer: 42 } }).stored, true);
  assert.equal(cache.get({ packet: a }).hit, true);

  const b = packet({
    packetId: "P-2",
    scope: { ...a.scope, projectId: "p2" }
  });
  assert.equal(cache.get({ packet: b }).hit, false);
});

test("mutation is never satisfied from the result cache", () => {
  const cache = new GovernedExactCache();
  const mutate = packet({ effectClass: EFFECT_CLASS.MUTATE });
  const stored = cache.put({ packet: mutate, value: { claimed: "sent" } });
  assert.equal(stored.stored, false);
  assert.equal(cache.get({ packet: mutate }).hit, false);
});

test("read requests require an explicit freshness epoch", () => {
  const cache = new GovernedExactCache();
  const read = packet({
    effectClass: EFFECT_CLASS.READ,
    scope: {
      tenantId: "t1",
      projectId: "p1",
      authorityScope: ["repo:read"],
      dataClassification: "internal",
      purpose: "build",
      environmentFingerprint: "env:v1"
    }
  });
  assert.equal(cache.put({ packet: read, value: "stale?" }).stored, false);
});

test("context delta separates changed and unchanged segments", () => {
  const before = packet({
    segments: [
      { segmentId: "policy", class: SEGMENT_CLASS.LOCKED, content: "A" },
      { segmentId: "task", class: SEGMENT_CLASS.LOSSLESS, content: "old" }
    ]
  });
  const after = packet({
    packetId: "P-2",
    segments: [
      { segmentId: "policy", class: SEGMENT_CLASS.LOCKED, content: "A" },
      { segmentId: "task", class: SEGMENT_CLASS.LOSSLESS, content: "new" },
      { segmentId: "evidence", class: SEGMENT_CLASS.RETRIEVABLE, ref: "blob:1" }
    ]
  });
  const delta = computeContextDelta(before, after);
  assert.deepEqual(delta.unchanged, ["policy"]);
  assert.deepEqual(delta.changed, ["task"]);
  assert.deepEqual(delta.added, ["evidence"]);
  assert.deepEqual(delta.removed, []);
});

test("tool projection keeps mandatory tools and minimal capability cover", () => {
  const result = projectTools({
    availableTools: [
      { name: "ledger", mandatory: true, capabilities: ["audit"] },
      { name: "repo", capabilities: ["read_repo", "read_file"] },
      { name: "file", capabilities: ["read_file"] },
      { name: "mail", capabilities: ["send_mail"] }
    ],
    requiredCapabilities: ["read_repo", "read_file"]
  });
  assert.deepEqual(result.tools.map((tool) => tool.name), ["ledger", "repo"]);
  assert.deepEqual(result.unresolvedCapabilities, []);
});

test("NBG selection starts at the cheapest qualified resolution and can expand", () => {
  const bubble = {
    bubbleId: "B-1",
    levels: [
      { level: "L4", tokens: 40, evidenceScore: 0.5, ref: "b:l4" },
      { level: "L3", tokens: 180, evidenceScore: 0.8, ref: "b:l3" },
      { level: "L2", tokens: 800, evidenceScore: 0.95, ref: "b:l2" },
      { level: "L1", tokens: 2700, evidenceScore: 0.99, ref: "b:l1" }
    ]
  };
  const selected = selectNbgResolution({ bubble, requiredEvidenceScore: 0.9, tokenBudget: 1000 });
  assert.equal(selected.selected.level, "L2");
  assert.equal(expandNbgResolution({ bubble, currentLevel: "L2" }).level, "L1");
});

test("structured handoff retains evidence and raw-response pointer without requiring raw inline output", () => {
  const handoff = createHandoffPacket({
    handoffId: "H-1",
    result: { verdict: "PASS" },
    decisions: ["ship"],
    evidenceRefs: ["ev:1"],
    rawResponseRef: "blob:sha256:abc"
  });
  assert.deepEqual(handoff.result, { verdict: "PASS" });
  assert.deepEqual(handoff.evidenceRefs, ["ev:1"]);
  assert.equal(handoff.rawResponseRef, "blob:sha256:abc");
});

test("information pass short-circuits on exact governed cache hit", () => {
  const cache = new GovernedExactCache();
  const p = packet();
  cache.put({ packet: p, value: { answer: "cached" } });
  const prepared = prepareInformationPass({ packet: p, exactCache: cache });
  assert.equal(prepared.action, "CACHE_HIT");
  assert.equal(prepared.cacheResult.value.answer, "cached");
});
