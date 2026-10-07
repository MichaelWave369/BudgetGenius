# Architecture v0.3

## Principle

BudgetGenius optimizes **proportionate intelligence**: the smallest trustworthy amount of cognition that satisfies the mandate.

The cost function is not just tokens or dollars. A route may consume money, input/output tokens, latency, GPU time, VRAM churn, bandwidth, provider quota, human attention, verification effort, and future context burden.

## Three economies

### Result economy
Can the work be avoided safely through an exact reusable result, deterministic computation, reusable evidence, or qualified cache?

Rung 2 introduced an exact governed result cache whose key includes governance/state scope. Mutation and irreversible work cannot be replaced by a cached result.

### Information economy
What is the minimum sufficient information that must move?

Rung 2 represents context as a typed `BudgetPacket`, supports exact context delta, deterministic tool projection, an NBG adaptive-resolution integration contract, and structured handoff packets. Generative compression and semantic caching remain out of scope until separately qualified.

### Compute economy
Where is the cheapest qualified place to reason, considering model capability, provider cost, local residency, warm prefix state, queueing, and verification?

Rung 3 introduces runtime-economic quotes that keep **real external spend** separate from **virtual comparison costs** for latency and movement.

A route may be nominally cheaper but economically worse because:

- it destroys a warm provider prefix,
- it requires loading/evicting a local model,
- its execution queue is congested,
- it misses an available batch discount,
- it would exceed a task's useful latency window.

## Control plane vs data plane

**Control plane:** Board, Steward, BudgetGenius planners, qualification, learning, precedent.

**Data plane:** BudgetPass enforcement, information pre-pass, runtime-economic quote, reservation, route execution, accounting, settlement.

The control plane may be sophisticated. The data plane must remain fast, deterministic, and auditable.

## Information handling classes

BudgetPacket segments declare handling classes rather than arriving as one untyped prompt blob:

- locked,
- lossless,
- stable/cacheable,
- NBG-adaptive,
- retrievable,
- compressible,
- projectable,
- droppable.

Policy can therefore distinguish "must remain exact" from "may be reduced" without guessing from prose.

## Runtime state locality

Rung 3 begins treating runtime state as economic information:

- model residency in VRAM,
- warm provider/model prompt prefixes,
- queue wait,
- provider batch capability.

Later integrations may extend the same contract to authenticated tool sessions, build/compiler caches, browser state, and agent working state.

A route's sticker price is insufficient if changing routes destroys valuable warm state.

## Real dollars vs shadow prices

BudgetGenius keeps two concepts distinct:

- `estimatedCostUsd`: external monetary spend used for hard budget reservation.
- `effectiveEconomicCostUsd`: route-comparison score that may add policy-defined latency and movement shadow costs.

The Banker never turns a virtual comparison cost into a real charge.

## Progressive funding

Cognition should be stage-gated where useful:

~~~text
probe -> investigate -> verify -> scale
  |          |            |
 stop       stop         settle
~~~

An escalation path that is required to satisfy a quality guarantee must have funded contingency before execution.

## Learning direction

Cases become precedent. Repeated precedent becomes compiled policy. Common policy becomes a deterministic fast path.

The system should become cheaper because it learns how much thought a situation deserves, not because it silently lowers standards.
