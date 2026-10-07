# Information Economy v0.2

Rung 2 makes **information movement** a governed resource.

BudgetGenius should not treat an LLM prompt as one undifferentiated string. A request is represented as a typed `BudgetPacket` whose segments carry handling policy.

## BudgetPacket segment classes

- `LOCKED` — policy/system material; never dropped or rewritten by the information-economy layer.
- `LOSSLESS` — must remain semantically exact.
- `STABLE_CACHEABLE` — stable prefix material suitable for provider caching.
- `NBG_ADAPTIVE` — memory that may be opened at a qualified resolution.
- `RETRIEVABLE` — keep a reference; inline only when needed.
- `COMPRESSIBLE` — eligible for a later governed compression module.
- `PROJECTABLE` — may be reduced to the subset needed by the task.
- `DROPPABLE` — optional context that policy permits removing.

Rung 2 does **not** perform generative compression. It establishes typed handling rules and reversible references first.

## Exact governed cache

The exact result cache is intentionally conservative.

A hit requires both:

1. exact request identity, and
2. exact governance/state scope identity.

The scope includes tenant, project, authority scope, data classification, purpose, freshness epoch, and environment fingerprint. `MUTATE` and `IRREVERSIBLE` requests are never result-cache eligible. `READ` requests require a freshness epoch.

This is a result cache, not a provider prompt cache and not an evidence cache. Those are separate species.

## Context delta

Context delta compares typed segments by stable segment ID and content fingerprint. It reports:

- added,
- changed,
- unchanged,
- removed.

The caller can use this to avoid retransmitting unchanged state where a provider/runtime supports stateful or cached context.

## Tool projection

Tool schemas cost tokens. The tool projector keeps:

- mandatory tools,
- explicitly required tool names,
- the smallest deterministic greedy set of tools that covers required capabilities.

Unresolved capabilities remain explicit. The projector never invents a tool or authority.

## NBG adaptive-resolution contract

Rung 2 adds a small integration contract, not a replacement for Nested Bubble Gear.

An NBG bubble may expose multiple resolution records, conventionally from compact routing/state views toward deeper evidence/raw views. BudgetGenius selects the cheapest level that satisfies the current evidence floor and token ceiling. A caller may request one-step expansion when uncertainty remains.

Raw artifacts remain addressable by reference.

## Structured handoff packet

Downstream agents should not automatically inherit a raw completion. A `HandoffPacket` carries structured fields such as result, decisions, uncertainties, evidence references, artifact references, open questions, and a raw-response reference.

The raw response may remain in durable storage while the reasoning path receives the smaller handoff packet.

## Non-goals

Rung 2 does not claim:

- semantic cache safety,
- learned marginal context value,
- live NBG storage integration,
- provider-specific prompt-cache support,
- automatic lossy compression,
- empirical token savings.

Those require later qualification.
