export function createHandoffPacket(input) {
  if (!input || typeof input !== "object") throw new TypeError("handoff input is required");
  if (typeof input.handoffId !== "string" || input.handoffId.trim() === "") {
    throw new TypeError("handoffId must be a non-empty string");
  }
  if (input.result == null) throw new TypeError("result is required");

  return Object.freeze({
    handoffId: input.handoffId,
    result: structuredClone(input.result),
    decisions: freezeArray(input.decisions),
    uncertainties: freezeArray(input.uncertainties),
    evidenceRefs: freezeArray(input.evidenceRefs),
    artifactRefs: freezeArray(input.artifactRefs),
    openQuestions: freezeArray(input.openQuestions),
    rawResponseRef: input.rawResponseRef ?? null,
    provenance: input.provenance ? Object.freeze(structuredClone(input.provenance)) : null
  });
}

function freezeArray(value = []) {
  if (!Array.isArray(value)) throw new TypeError("handoff list fields must be arrays");
  return Object.freeze(value.map((item) => Object.freeze(structuredClone(item))));
}
