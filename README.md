# BudgetGenius

**Governed cognitive economics for agent systems.**

> BudgetGenius does not minimize intelligence. It minimizes wasted intelligence.

BudgetGenius is a control-plane and data-plane architecture for deciding how much cognition a task deserves, which qualified route should perform it, what context should move, how cost is reserved and settled, and how the system proves afterward that the claimed savings were real.

It began with a simple question: can an agent gateway reduce token/API spend before and after a call? The answer turned into a broader principle:

> **Purchase intelligence incrementally, only as uncertainty and consequence justify it.**

## Architecture

~~~text
Operator values
      |
Budget Constitution
      |
Board + Steward
      |  Cognitive Mandate
      v
BudgetGenius control plane
      |  qualified route plan
      v
BudgetPass data plane
      |
Information economy
      |  BudgetPacket / cache / delta / tools / NBG
      v
Local / API / Tools
      |
Reality / verifier layer
      |
Ledger + NBG / memory
      |
Audit, regret, precedent, learning
~~~

The fast path is deliberately boring. Heavy "Genius" reasoning belongs in the control plane, not in front of every cheap call.

## Current implementation

### Rung 1 — deterministic spine

- versioned Constitution,
- Cognitive Mandate validation,
- hierarchical in-memory budget pools,
- atomic reservation and settlement semantics,
- hard quality/evidence/authority/risk qualification,
- cheapest-qualified route selection,
- BudgetPass state machine,
- append-only reference ledger,
- counterfactual route receipts.

### Rung 2 — information economy

- typed `BudgetPacket` segments,
- exact governed result cache,
- context delta,
- deterministic tool-schema projection,
- NBG adaptive-resolution contract,
- structured downstream handoff packets,
- composable information pre-pass.

Rung 2 deliberately remains reversible and conservative. It does **not** introduce semantic caching or generative prompt compression.

## Core rule

**Governance determines which routes are qualified. Economics chooses among qualified routes.**

A cheaper route that violates a quality floor, evidence floor, authority boundary, or risk ceiling is not a bargain. It is disqualified.

## Roles

| Role | Responsibility |
| --- | --- |
| Board | Strategy, portfolios, policy, precedent |
| Steward | Resolve tradeoffs into a governed mandate |
| Banker | Leases, reservations, liquidity, settlement |
| Packet Processor | Context economy, cache, NBG resolution, prompt construction |
| Designer | Candidate cognitive topologies |
| Coder | Executable provider/runtime plan |
| Auditor | Receipts, regret, quality debt, counterfactuals |
| Operator | Values, hard constraints, risk appetite |

## Integration target

SuperPhiVessel is the first integration target. Existing BrainC, BudgetCompute, Credit Governor, GPU Runtime Governor, NBG, and Reality Gate systems should be adapted to BudgetGenius rather than replaced.

## Lab axiom

**If it isn't fun, it isn't finished.** Joy gets an exploration budget; it does not get to waive evidence.

See [Architecture](docs/ARCHITECTURE.md), [Information Economy](docs/INFORMATION-ECONOMY.md), [Constitution](docs/CONSTITUTION.md), [Board & Steward](docs/BOARD-AND-STEWARD.md), [Cognitive Mandate](docs/COGNITIVE-MANDATE.md), and [BudgetPass Protocol](docs/BUDGET-PASS-PROTOCOL.md).
