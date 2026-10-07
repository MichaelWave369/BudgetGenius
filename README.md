# BudgetGenius

**Governed cognitive economics for agent systems.**

> BudgetGenius does not minimize intelligence. It minimizes wasted intelligence.

BudgetGenius is a governed cognitive-economics architecture for deciding how much cognition an objective deserves, which qualified route should perform it, what information should move, how resources are reserved, and whether claimed savings survived verification.

> **Purchase intelligence incrementally, only as uncertainty and consequence justify it.**

## Architecture

~~~text
Operator values
      |
Budget Constitution
      |
Board of Directors
      |
Steward
      |  signed policy / Cognitive Mandate
      v
BudgetGenius control plane
      |  qualified route / grant / topology
      v
BudgetPass data plane
      |
Information economy
      |  BudgetPacket / cache / delta / tools / NBG
      v
Runtime economy
      |  prices / affinity / GPU / queues / batch
      v
Local / API / Tools
      |
Verification economy
      |  independent checks / quality debt / shadow eval
      v
Ledger + NBG / memory
      |
Auditor / regret / verified savings
      |
Calibration / precedent / grants / fusion
      |
compiled operating policy
      +-----------------------------> fast path
~~~

Heavy "Genius" reasoning belongs in the control plane. The fast path is deliberately boring.

## Current implementation

### Rung 1 — deterministic spine
Cognitive Mandates, Constitution, hierarchical budgets, reservation/settlement, route qualification, BudgetPass state machine, ledger, counterfactual receipts.

### Rung 2 — information economy
Typed `BudgetPacket`, governed exact cache, context delta, tool projection, NBG adaptive-resolution contract, structured handoffs.

### Rung 3 — runtime economics
Price snapshots, provider adapters, session/prefix affinity, switch tax, GPU residency, movement cost, queue/backpressure, batch-aware routing.

### Rung 4 — verification and audit
Verifier registry, independence metadata, escalation bonds, provisional vs verified savings, causal cleanup cost, quality debt, lineage, shadow evaluation, routing regret.

### Rung 5 — learned policy
Empirical calibration, conservative confidence bounds, governance-bound route learning, Genius economic profiles, precedent compiler, Cognitive Grants, portfolio allocation, request fusion / cognitive multicast.

### Rung 6 — Board / Steward
Exception-triggered governance, bounded veto domains, Steward rulings and dissent, qualification portfolio, Treasury/liquidity policy, bounded exploration capital, signed compiled policy snapshots.

## Core rule

**Governance determines which routes are qualified. Economics chooses among qualified routes. Verification decides whether the savings were real. Learning may improve operating policy, but it may not rewrite governance.**

A cheaper route that violates quality, evidence, authority, risk, or liquidity constraints is not a bargain. It is disqualified.

## Governance roles

| Role | Responsibility |
| --- | --- |
| Operator | Values, Level 0 constraints, risk appetite |
| Board | Strategy, Level 1 policy, Treasury, qualification |
| Steward | Resolve exceptional tradeoffs into rulings |
| Banker | Leases, reservations, settlement |
| Packet Processor | Information economy |
| Designer | Candidate cognitive topologies |
| Coder | Provider/runtime execution plans |
| Auditor | Verification, causal savings, regret, debt |

## Integration target

SuperPhiVessel is the first integration target. BrainC, BudgetCompute, Credit Governor, GPU Runtime Governor, NBG, and Reality Gate are integration points, not components this repository intends to bulldoze because software projects apparently enjoy eating their parents.

## Lab axiom

**If it isn't fun, it isn't finished.** Joy gets an exploration budget; it does not get to waive evidence.

See [Architecture](docs/ARCHITECTURE.md), [Board & Steward](docs/BOARD-AND-STEWARD.md), [Information Economy](docs/INFORMATION-ECONOMY.md), [Runtime Economics](docs/RUNTIME-ECONOMICS.md), [Verification & Audit](docs/VERIFICATION-AND-AUDIT.md), [Learning & Portfolio](docs/LEARNING-AND-PORTFOLIO.md), [Constitution](docs/CONSTITUTION.md), [Cognitive Mandate](docs/COGNITIVE-MANDATE.md), and [BudgetPass Protocol](docs/BUDGET-PASS-PROTOCOL.md).
