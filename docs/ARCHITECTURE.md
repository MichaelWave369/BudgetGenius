# Architecture v0.6

## Principle

BudgetGenius optimizes **proportionate intelligence**: the smallest trustworthy amount of cognition that satisfies the mandate.

The cost function is not just tokens or dollars. A route may consume money, input/output tokens, latency, GPU time, VRAM churn, bandwidth, provider quota, human attention, verification effort, and future context burden.

## Governance hierarchy

~~~text
Operator values
      |
Level 0 Constitution
      |
Board strategy / Level 1 policy
      |
Steward ruling
      |
compiled signed policy snapshot
      |
BudgetGenius planning / Level 2 policy
      |
BudgetPass enforcement
~~~

Learning may influence Level 2 operating policy. It may not climb upward and rewrite its own authority.

## Result economy

Can the work be avoided safely through an exact reusable result, deterministic computation, reusable evidence, or qualified cache?

Rung 2 introduced an exact governed result cache whose key includes governance/state scope. Mutation and irreversible work cannot be replaced by a cached result.

## Information economy

What is the minimum sufficient information that must move?

Rung 2 represents context as a typed `BudgetPacket`, supports exact context delta, deterministic tool projection, an NBG adaptive-resolution integration contract, and structured handoff packets.

## Compute economy

Where is the cheapest qualified place to reason, considering model capability, provider cost, local residency, warm prefix state, queueing, and verification?

Rung 3 introduced runtime-economic quotes that keep real external spend separate from virtual comparison costs for latency and movement.

## Verification economy

Rung 4 makes verification a first-class economic component.

A route that appears cheap before verification may be expensive after verifier cost, escalation, retry, repair, and downstream correction.

Immediate savings are provisional. Verified savings require successful verification and causal-cost accounting.

## Learning economy

Rung 5 turns verified receipts into conservative operating knowledge.

The learning layer may recommend a route only after enough comparable outcomes exist. The reference calibration uses a Wilson lower confidence bound rather than raw historical success.

Learning never bypasses the mandate. Excellent history cannot grant authority.

## Governance economy

Rung 6 adds the Board and Steward.

Ordinary requests do **not** convene the Board. Exception triggers identify situations where compiled operating policy is insufficient.

The Board expresses bounded domain concerns. The Steward resolves tradeoffs after hard constraints and valid domain vetoes remove unacceptable candidates.

This is intentionally not majority voting.

~~~text
candidate strategies
        |
hard constraints
        |
valid domain vetoes
        |
eligible set
        |
utility / economic tradeoff
        |
Steward ruling
~~~

## Qualification portfolio

Models and providers are governance assets with explicit lifecycle state:

`UNQUALIFIED -> SHADOW -> LIMITED -> QUALIFIED -> PREFERRED`

Regression can suspend/demote them. A cheap new model does not enter production because somebody on the internet called it cracked.

## Treasury

The Treasury separates normal pools, exploration capital, and protected reserve.

The optimizer may spend from the pool granted to it. It cannot raid contingency or emergency liquidity without an allowed authorization path.

## Signed policy snapshots

Compiled policy is versioned and digestible.

A snapshot binds Constitution, Board policy, operating policy, qualification portfolio, price table, directives, and precedents to one digest. Integrations may HMAC-sign/verify the digest so BudgetPass can reject tampered or stale policy.

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

Portfolio allocation uses operator/Board-supplied value. BudgetGenius optimizes allocation; it does not invent what matters.

## Request fusion and cognitive multicast

Compatible read-only agents may share a foundation pass when governance scope, freshness/environment state, evidence source, and fusion topic match.

Side-effecting requests remain unfused.

## Control plane vs data plane

**Control plane:** Board, Steward, qualification, Treasury policy, BudgetGenius planners, verification policy, calibration, precedent, grants, learning.

**Data plane:** BudgetPass enforcement, information pre-pass, runtime quote, reservation, execution, verifier invocation, accounting, settlement.

> **The control plane learns; the data plane executes.**

## Economic boundaries

BudgetGenius keeps distinct:

- actual external monetary spend,
- virtual movement/latency shadow costs,
- quality/evidence signals,
- provisional savings,
- verified causal savings,
- protected liquidity.

Collapsing those into one number would be convenient and wrong, humanity's favorite spreadsheet feature.

## Learning direction

Cases become precedent. Repeated precedent becomes compiled policy. Common policy becomes a deterministic fast path.

The system should become cheaper because it learns how much thought a situation deserves, not because it silently lowers standards.
