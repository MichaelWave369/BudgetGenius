# Architecture v0.5

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

Rung 3 introduced runtime-economic quotes that keep real external spend separate from virtual comparison costs for latency and movement.

## Verification economy

Rung 4 makes verification a first-class economic component.

A route that appears cheap before verification may be expensive after verifier cost, escalation, retry, repair, and downstream correction.

Immediate savings are provisional. Verified savings require a successful verification policy and causal-cost accounting.

## Learning economy

Rung 5 turns verified receipts into conservative operating knowledge.

The learning layer may recommend a route only after enough comparable outcomes exist. The reference calibration uses a Wilson lower confidence bound rather than the raw historical success fraction.

~~~text
verified receipts
      |
context bucket
      |
route calibration
      |
conservative success bound
      |
governance qualification
      |
operating recommendation
~~~

Learning never bypasses the existing mandate. A route with excellent historical performance still loses if it lacks authority, evidence, risk clearance, or budget.

## Genius economic profiles

BrainC-style roles can accumulate descriptive profiles about task success, causal cost, token usage, route history, and context use.

These profiles answer questions such as:

- Which role tends to succeed on this task class?
- How much context does it normally consume?
- Which routes have actually worked?
- What does that success cost after repair and verification?

Profiles do not grant authority.

## Precedent and policy compilation

Exceptional cases may be retained as precedents.

Repeated comparable precedent can produce a Level 2 operating-policy candidate only when:

- enough comparable cases exist,
- constitutional compliance is explicit,
- the action is stable,
- observed failure stays below policy threshold.

The compiler cannot emit Level 0 constitutional changes.

## Cognitive Grants and portfolios

A Cognitive Grant funds an objective and preserves contingency separately from normal stage spend.

~~~text
grant
  |
  +-- probe
  +-- investigate
  +-- verify
  +-- scale
  |
  +-- protected contingency
~~~

A portfolio allocator can rank competing proposals using operator/Board-supplied priority, decision value, expected uncertainty reduction, and requested cost. BudgetGenius optimizes allocation; it does not invent what the operator should value.

## Request fusion and cognitive multicast

Compatible read-only agents may share a foundation pass when governance scope, freshness/environment state, evidence source, and fusion topic match.

One evidence computation can then multicast scoped projections to multiple consumers.

Side-effecting requests remain unfused.

## Control plane vs data plane

**Control plane:** Board, Steward, BudgetGenius planners, qualification, verification policy, calibration, precedent, grants, learning.

**Data plane:** BudgetPass enforcement, information pre-pass, runtime-economic quote, reservation, execution, verifier invocation, accounting, settlement.

**The control plane learns; the data plane executes.**

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

## Runtime state locality

Runtime state is economic information:

- model residency in VRAM,
- warm provider/model prompt prefixes,
- queue wait,
- provider batch capability.

Later integrations may extend the same contract to authenticated tool sessions, build/compiler caches, browser state, and agent working state.

## Real dollars vs shadow prices

BudgetGenius keeps two concepts distinct:

- `estimatedCostUsd`: external monetary spend used for hard budget reservation.
- `effectiveEconomicCostUsd`: route-comparison score that may add policy-defined latency and movement shadow costs.

The Banker never turns a virtual comparison cost into a real charge.

## Learning direction

Cases become precedent. Repeated precedent becomes compiled policy. Common policy becomes a deterministic fast path.

The system should become cheaper because it learns how much thought a situation deserves, not because it silently lowers standards.
