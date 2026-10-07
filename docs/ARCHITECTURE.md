# Architecture v0.1

## Principle

BudgetGenius optimizes **proportionate intelligence**: the smallest trustworthy amount of cognition that satisfies the mandate.

The cost function is not just tokens or dollars. A route may consume money, input/output tokens, latency, GPU time, VRAM churn, bandwidth, provider quota, human attention, verification effort, and future context burden.

## Three economies

### Result economy
Can the work be avoided safely through an exact reusable result, deterministic computation, reusable evidence, or qualified cache?

### Information economy
What is the minimum sufficient information that must move? Future modules include NBG resolution, context delta, retrieval pruning, tool projection, and reversible compression.

### Compute economy
Where is the cheapest qualified place to reason, considering model capability, provider cost, local residency, warm prefix state, queueing, and verification?

## Control plane vs data plane

**Control plane:** Board, Steward, BudgetGenius planners, qualification, learning, precedent.

**Data plane:** BudgetPass enforcement, reservation, route execution, accounting, settlement.

The control plane may be sophisticated. The data plane must remain fast, deterministic, and auditable.

## State locality

Routing should eventually treat these as first-class state:

- model residency in VRAM,
- warm provider prompt prefixes,
- NBG/context locality,
- authenticated tool sessions,
- build/compiler caches,
- agent working state.

A route's sticker price is insufficient if changing routes destroys valuable warm state.

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
