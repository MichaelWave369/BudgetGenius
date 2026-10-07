# Board and Steward v0.6

The Board exists above BudgetGenius because **"what is the cheapest qualified route?"** and **"are these the right operating rules for this situation?"** are different questions.

Rung 6 turns the Board/Steward concept into a deterministic governance reference layer.

## Logical seats

- **Treasury** — solvency, liquidity, quotas.
- **Systems** — technical feasibility, runtime safety, congestion.
- **Science** — quality and uncertainty.
- **Risk** — failure consequence, rollback, security, irreversibility.
- **Evidence** — provenance, evidence sufficiency.
- **Memory** — freshness, lineage, memory safety.
- **Operator Advocate** — operator intent and human authority.
- **Auditor** — auditability and accounting integrity.

These are logical responsibilities. BudgetGenius does not spend eight LLM calls every time somebody asks it to format JSON.

## No simple majority rule

The Board is not a popularity contest.

Each seat has a bounded veto domain. A Risk veto can bind on risk/security/irreversibility. Treasury can bind on solvency/liquidity. Evidence can bind on evidence/provenance. A seat cannot acquire universal power by shouting loudly outside its lane.

The Steward first removes candidates that:

- fail hard constraints,
- receive a valid domain veto,
- lack required economic/utility data.

It then resolves the remaining soft tradeoffs using the supplied utility score and economic cost.

## Exception-triggered deliberation

Ordinary traffic stays on the fast path.

Board referral may be triggered by:

- no qualified route,
- spend threshold crossed,
- contingency or emergency capital required,
- novel task class,
- excessive routing regret,
- excessive quality debt,
- model/provider qualification change,
- high-risk work,
- irreversible effects,
- large Cognitive Grants/campaigns,
- policy conflict,
- explicit operator request.

A referral says **the operating policy is insufficient for this case**. It does not itself approve the work.

## Ruling, dissent, precedent

A Steward decision can produce three distinct artifacts:

1. **Ruling** — the selected action for the current case.
2. **Precedent candidate** — a reusable case pattern for later evidence accumulation.
3. **Level 2 policy candidate** — a possible deterministic fast-path action.

Objections and valid vetoes remain attached as dissent. This preserves information about failures that somebody predicted before execution.

## Qualification portfolio

Models and providers move through explicit states:

~~~text
UNQUALIFIED
   |
 SHADOW
   |
 LIMITED
   |
QUALIFIED
   |
PREFERRED
~~~

Regression may demote or suspend an asset.

`SUSPENDED` assets are never treated as qualified. Qualification can be task-class scoped.

This portfolio is evidence-bearing governance state, not a leaderboard.

## Treasury and liquidity

BudgetGenius distinguishes:

- operating pools,
- research/qualification pools,
- bounded exploration capital,
- protected liquid reserve.

The reserve cannot be self-authorized by a worker or route optimizer. Reference authorizations include Board contingency, operator override, or emergency authority.

This prevents cheap exploratory work from consuming the capital needed to recover from failure.

## Exploration capital

Exploration gets a real budget because near-term economic optimization can starve discovery.

Exploration capital is bounded and observable. It does not need immediate ROI, but it does not waive the Constitution either.

## Signed policy snapshots

The Board/Steward control plane can compile a policy snapshot containing:

- Constitution version,
- Board policy version,
- operating policy version,
- qualification portfolio version,
- price-table version,
- directives,
- precedents.

The reference implementation hashes the canonical snapshot and can HMAC-sign it with a runtime-supplied secret. BudgetPass integrations may verify the signature before accepting a new compiled policy.

Secrets are never stored in the snapshot.

## Timescales

~~~text
SLOW LOOP
Board / Steward
strategy, qualifications, treasury, policy
        |
        v
MEDIUM LOOP
BudgetGenius
plans, grants, calibration, route recommendations
        |
        v
FAST LOOP
BudgetPass
enforce, reserve, dispatch, verify, settle
~~~

The organizational richness stays in the control plane. The hot path stays boring.

## Authority boundary

The Steward does not gain the power to alter Level 0 policy.

It may:

- resolve tradeoffs inside governance,
- authorize use of Board-controlled contingency where policy permits,
- generate rulings,
- propose precedent,
- emit Level 2 policy candidates.

It may not:

- rewrite the Constitution,
- fabricate operator authority,
- convert a failed hard constraint into a soft preference,
- make an unqualified model qualified by decree,
- certify its own economic claims without audit evidence.
