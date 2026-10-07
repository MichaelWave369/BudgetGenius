import test from "node:test";
import assert from "node:assert/strict";
import { PASS_STATE } from "../src/constants.js";
import { transition } from "../src/state-machine.js";

test("BudgetPass state machine rejects impossible jumps", () => {
  const pass = { state: PASS_STATE.PROPOSED };
  assert.throws(() => transition(pass, PASS_STATE.SETTLED), /INVALID_TRANSITION/);
});

test("valid admission transition succeeds", () => {
  const pass = transition({ state: PASS_STATE.PROPOSED }, PASS_STATE.ADMITTED);
  assert.equal(pass.state, PASS_STATE.ADMITTED);
});
