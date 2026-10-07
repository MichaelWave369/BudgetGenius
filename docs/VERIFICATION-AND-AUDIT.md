# Verification and Audit v0.4

Rung 4 answers the question that every cost optimizer eventually tries to dodge:

> Did the cheaper route actually deserve to be called cheaper?

Immediate spend is not enough. A route that saves money now but creates retries, repair work, or bad downstream state has only produced **provisional savings**.

## Verifier registry

Verifiers are explicit, named mechanisms with metadata:

- verifier ID,
- mechanism class,
- expected external cost,
- independence score,
- deterministic / model-based flag,
- supported task classes.

Examples include schema validation, compiler/test suites, static analysis, evidence checks, independent model judges, and human review.

A verifier does not gain authority merely because it can inspect an output.

## Verification independence

Verification is more valuable when its failure modes differ from the generator.

A compiler validating generated code is usually more independent than the same model reviewing its own answer.

Rung 4 stores an explicit `independenceScore` in [0,1]. This is qualification metadata, not a metaphysical truth. Integrations must calibrate it.

A verification policy may require:

- all required checks to pass,
- a minimum aggregate confidence,
- a minimum independence score.

## Escalation bonds

Rung 1 already reserves `estimatedCostUsd + escalationBondUsd`.

Rung 4 makes the intent explicit: if a route only satisfies its quality promise because it can escalate on verifier failure, the fallback must be fundable **before** the cheap route starts.

An escalation bond is a reservation, not a mandatory spend.

## Provisional vs verified savings

At settlement:

`provisional savings = baseline - immediate actual cost`

After the outcome survives its verification horizon:

`verified savings = baseline - total attributable causal cost`

Attributable causal cost may include retries, escalation, repair, and other downstream work linked to the original route.

If the outcome is not verified, savings remain provisional.

## Quality debt

Lossy transformations and derived-from-derived memory may accumulate epistemic fragility.

Rung 4 provides a deliberately simple reference metric:

`new debt = inherited debt + transform risk - verification credit`

clamped to [0,1].

The number is a policy signal, not a claim that truth has a universal scalar unit. The important part is lineage:

- parent artifact IDs,
- derivation depth,
- transformation class,
- verifier evidence,
- raw evidence references.

Policy can require source reopening when debt exceeds a threshold.

## Shadow evaluation

A selected route may be sampled against one or more alternatives. Shadow results are recorded separately so learning does not pretend the selected route was the only possible world.

Shadow evaluation should have its own budget pool.

## Routing regret

For audited cases with known successful alternatives:

`regret = actual chosen causal cost - cheapest known successful causal cost`

Regret is never negative. Unknown counterfactual quality stays unknown.

## Negative results

Verifier failures, failed compression attempts, route mispredictions, and dissent are audit data. They are not deleted to make a savings chart prettier.

## Non-goals

Rung 4 does not provide:

- universal verifier calibration,
- automatic human-review pricing,
- a production-grade causal attribution engine,
- statistical confidence intervals for shadow experiments,
- learned quality-debt coefficients.

Those arrive only with empirical data.
