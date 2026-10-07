import { PASS_STATE } from "./constants.js";

const allowed = Object.freeze({
  [PASS_STATE.PROPOSED]: new Set([PASS_STATE.ADMITTED, PASS_STATE.REJECTED]),
  [PASS_STATE.ADMITTED]: new Set([PASS_STATE.PLANNED, PASS_STATE.REJECTED]),
  [PASS_STATE.PLANNED]: new Set([PASS_STATE.RESERVED, PASS_STATE.REJECTED]),
  [PASS_STATE.RESERVED]: new Set([PASS_STATE.DISPATCHED, PASS_STATE.RELEASED]),
  [PASS_STATE.DISPATCHED]: new Set([PASS_STATE.RECEIVED, PASS_STATE.FAILED]),
  [PASS_STATE.RECEIVED]: new Set([PASS_STATE.VERIFIED, PASS_STATE.FAILED]),
  [PASS_STATE.VERIFIED]: new Set([PASS_STATE.SETTLED, PASS_STATE.FAILED]),
  [PASS_STATE.SETTLED]: new Set(),
  [PASS_STATE.REJECTED]: new Set(),
  [PASS_STATE.FAILED]: new Set(),
  [PASS_STATE.RELEASED]: new Set()
});

export function transition(pass, nextState) {
  const options = allowed[pass.state];
  if (!options || !options.has(nextState)) {
    throw new Error(`INVALID_TRANSITION:${pass.state}->${nextState}`);
  }
  return Object.freeze({ ...pass, state: nextState });
}
