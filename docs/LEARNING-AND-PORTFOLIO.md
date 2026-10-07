# Learning and Portfolio v0.5

Rung 5 lets BudgetGenius learn from **verified receipts** without letting learning rewrite governance.

The learning layer is advisory and evidence-driven. It can propose Level 2 operating policy. It cannot modify the Constitution, grant authority, or silently lower quality/evidence floors.

## Empirical route calibration

A route is calibrated inside a context bucket rather than globally.

A context key may include:

- task class,
- effect class,
- risk class,
- verifier profile,
- context-size band,
- project/runtime family.

For every route/context pair the calibration book records:

- attempts,
- verified successes,
- total causal cost,
- mean causal cost,
- empirical success rate,
- conservative Wilson lower bound.

The reference learner uses the Wilson lower bound rather than raw success rate when deciding whether a route has enough evidence to satisfy a quality floor.

This avoids the delightful human tradition of declaring a system "99% reliable" after it worked twice.

## Contextual route learning

The learner does not invent routes. It evaluates candidate routes already permitted by governance.

A learned route is eligible only when:

1. it has enough verified samples,
2. its conservative success estimate meets the mandate quality floor,
3. the supplied route metadata still meets evidence/risk/authority/cost constraints.

If no learned candidate qualifies, the learner returns no recommendation. It does not degrade the mandate.

## Genius economic profiles

A Genius profile is descriptive telemetry about how a role performs:

- task classes handled,
- verified success rate,
- mean causal cost,
- mean input/output tokens,
- frequently used context classes,
- route history.

Profiles may inform BrainC/BudgetGenius topology planning. They do not grant authority and are not personality scores.

## Precedent -> policy compiler

An exceptional ruling can become precedent. Repeated successful precedent may become a Level 2 policy candidate.

Promotion requires:

- a minimum number of comparable cases,
- constitutional compliance for every promoted case,
- one stable selected route/policy action,
- failure rate below the configured ceiling.

The compiler emits a **policy candidate**, not a constitutional amendment.

## Cognitive Grants

A Cognitive Grant funds an objective rather than handing every agent an independent wallet.

A grant contains:

- objective,
- total ceiling,
- contingency reserve,
- stage envelopes,
- allowed project/agent scope,
- success/stop conditions.

Stages may be consumed progressively: probe -> investigate -> verify -> scale.

The contingency reserve is kept distinct so a cheap stage cannot spend away its own ability to recover.

## Portfolio allocation

When several grants compete for finite capital, the reference allocator ranks work by:

`priority weight × decision value × expected uncertainty reduction / requested cost`

This is deliberately simple and deterministic. Production systems may use richer utility models, but the operator/Board defines value. The optimizer does not invent what matters.

## Request fusion and cognitive multicast

Agent swarms often ask overlapping questions about the same artifact.

Compatible `PURE` and freshness-compatible `READ` work may share an evidence acquisition/foundation pass when:

- governance scope matches,
- environment/freshness fingerprints match,
- the declared fusion key matches,
- no side effect is requested.

The shared foundation can then be projected to multiple consumers.

`MUTATE` and `IRREVERSIBLE` work is never fused into a shared "result" that pretends execution happened.

## Learning boundary

The control plane learns; the data plane executes.

Rung 5 produces:

- calibration snapshots,
- route recommendations,
- Genius economic profiles,
- precedent candidates,
- grant/portfolio plans,
- fusion plans.

BudgetPass still enforces the mandate and reservation rules from earlier rungs.
