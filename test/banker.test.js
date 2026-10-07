import test from "node:test";
import assert from "node:assert/strict";
import { BudgetBanker } from "../src/banker.js";

test("hierarchical reservation prevents collective overspend", () => {
  const banker = new BudgetBanker();
  banker.createPool({ poolId: "org", limitUsd: 1.0 });
  banker.createPool({ poolId: "project", parentId: "org", limitUsd: 0.8 });
  banker.createPool({ poolId: "agent-a", parentId: "project", limitUsd: 0.6 });
  banker.createPool({ poolId: "agent-b", parentId: "project", limitUsd: 0.6 });

  assert.equal(banker.reserve({ leaseId: "a", poolId: "agent-a", amountUsd: 0.5 }).ok, true);
  const second = banker.reserve({ leaseId: "b", poolId: "agent-b", amountUsd: 0.5 });
  assert.equal(second.ok, false);
  assert.equal(second.blockingPoolId, "project");
});

test("settlement refunds unused reservation through hierarchy", () => {
  const banker = new BudgetBanker();
  banker.createPool({ poolId: "org", limitUsd: 1.0 });
  banker.createPool({ poolId: "project", parentId: "org", limitUsd: 1.0 });
  banker.reserve({ leaseId: "x", poolId: "project", amountUsd: 0.4 });

  const settled = banker.settle({ leaseId: "x", actualUsd: 0.15 });
  assert.equal(settled.refundedUsd, 0.25);
  assert.equal(banker.snapshot("project").spentUsd, 0.15);
  assert.equal(banker.snapshot("project").reservedUsd, 0);
  assert.equal(banker.snapshot("project").availableUsd, 0.85);
});
