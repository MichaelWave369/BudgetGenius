# BudgetPass Protocol v0.1

BudgetPass is the fast transactional gate. Every bounded execution should pass through the same state machine.

## States

~~~text
PROPOSED
  -> ADMITTED
  -> PLANNED
  -> RESERVED
  -> DISPATCHED
  -> RECEIVED
  -> VERIFIED
  -> SETTLED
~~~

Terminal/side states may include:

- REJECTED
- EXPIRED
- FAILED
- RELEASED

## Admission and reservation

A plan may not dispatch until the Banker successfully reserves its quoted cost and contingency requirement against every pool in its hierarchy.

Reservation is not spending. Settlement converts reserved amount into actual spend and refunds the unused amount.

## Hard-floor behavior

If no candidate route satisfies quality, evidence, authority, and risk constraints, the correct result is **no qualified route**. BudgetPass must not silently drop a tier to fit the wallet.

## Counterfactual receipt

A receipt should preserve:

- selected route,
- routes considered,
- qualification failures,
- reserved amount,
- actual amount,
- refund,
- baseline,
- provisional/verified savings,
- policy/constitution versions.

## Recovery direction

Production adapters should persist lease IDs, reservation IDs, provider request IDs, and idempotency keys where available so an interrupted DISPATCHED request can be reconciled and settled exactly once.
