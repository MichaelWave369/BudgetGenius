# Runtime Economics v0.3

Rung 3 makes **where cognition runs** part of the economic decision.

The cheapest model by list price is not necessarily the cheapest execution path. Runtime state can make a route expensive through cold prompt prefixes, GPU model swaps, queueing, rate pressure, latency, or lost batch discounts.

## Price snapshots

BudgetGenius does not hard-code vendor prices as eternal truth.

A `PriceTable` is a versioned snapshot supplied by an integration:

- provider,
- model,
- input USD / 1M tokens,
- cached-input USD / 1M tokens,
- output USD / 1M tokens,
- optional batch multiplier,
- source metadata and effective timestamp.

Receipts can therefore say which pricing snapshot produced a quote.

## Stateful affinity

A session may have a warm provider/model prefix. When the same prefix remains warm:

- cacheable carried tokens may be billed at cached-input rates,
- a model switch may force those tokens cold again.

The affinity registry stores provider, model, prefix fingerprint, cacheable-token count, and expiry. Runtime quotes expose both the warm-input advantage and the switch tax.

The rule is simple:

> Route on total stateful movement cost, not sticker price.

## GPU residency

Local execution has zero marginal API dollars but non-zero runtime cost.

A local model quote may include:

- resident / cold state,
- load time,
- eviction time,
- queue wait,
- GPU fit.

These are converted into a policy-defined virtual economic cost for route comparison without pretending they are provider charges.

## Real dollars vs virtual economics

Rung 3 keeps these separate.

- `estimatedCostUsd` is expected external monetary spend and is what the Banker reserves.
- `effectiveEconomicCostUsd` is a comparison score that may add shadow prices for latency, movement, and queueing.

A virtual cost never silently becomes a real charge.

## Backpressure

The runtime can return one of four broad scheduling recommendations:

- `RUN` — execute now.
- `BATCH` — latency is flexible and the provider supports discounted batch work.
- `SPILL` — the preferred/local path is congested enough that another qualified route should be considered.
- `QUEUE` — wait rather than violate the mandate.

BudgetPass does not invent a lower-quality route when a queue is busy. It chooses among routes that already satisfy governance.

## Batch eligibility

Batching is disabled by default for `MUTATE` and `IRREVERSIBLE` effects. It also requires:

- provider batch support,
- operator/task permission,
- enough latency budget.

## Provider adapter contract

Provider adapters are registered behind a small interface. They report capabilities and receive an already-governed dispatch plan. They do not choose policy, alter the mandate, or grant themselves authority.

Rung 3 includes a registry and dispatch contract; real provider SDK integrations belong in integration repositories or later qualified adapters.

## Non-goals

Rung 3 does not claim:

- a universal dollar value for one second of latency,
- that one provider's cache semantics match another's,
- that an estimated prompt-cache hit actually occurred,
- live vendor prices unless the integration supplied a current snapshot,
- autonomous failover across unqualified models.

Those remain explicit integration responsibilities.
