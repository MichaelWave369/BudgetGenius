# Cognitive Mandate

A Cognitive Mandate is the contract between operator/Board intent and BudgetGenius execution.

BudgetGenius may optimize inside the mandate. It may not redefine the objective to make it cheaper.

## Minimal v0.1 shape

~~~json
{
  "mandateId": "CM-00482",
  "objective": "Diagnose a failed release and produce a verified repair.",
  "poolId": "project:release",
  "qualityFloor": 0.97,
  "evidenceFloor": 0.95,
  "maxRiskScore": 0.15,
  "maxCostUsd": 0.25,
  "authority": ["repo:read", "tests:run", "patch:propose"],
  "effectClass": "PROPOSE",
  "riskClass": "IMPORTANT",
  "baseline": {
    "routeId": "frontier-direct",
    "estimatedCostUsd": 0.12
  }
}
~~~

## Requirements

- Floors are hard constraints.
- Authority is allowlisted.
- The declared baseline anchors savings calculations.
- Route qualification data must come from empirical qualification/evaluation data or an explicitly marked prior, not model self-confidence.
- Mutation and irreversible effect classes require stronger execution semantics than pure/read/propose work.
