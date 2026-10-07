import { validVetoes } from "./board.js";

export function resolveStewardDecision({
  boardCase,
  policyVersion = "board-candidate",
  precedentEligible = false,
  policyCandidateEligible = false
}) {
  if (!boardCase || typeof boardCase !== "object") throw new TypeError("boardCase is required");

  const vetoes = validVetoes(boardCase);
  const vetoedCandidates = new Set(vetoes.map((item) => item.candidateId).filter(Boolean));

  const evaluations = boardCase.candidates.map((candidate) => {
    const reasons = [];
    if (candidate.hardConstraintsPass === false) reasons.push("HARD_CONSTRAINT_FAILURE");
    if (vetoedCandidates.has(candidate.candidateId)) reasons.push("VALID_DOMAIN_VETO");
    if (!Number.isFinite(candidate.utilityScore)) reasons.push("MISSING_UTILITY_SCORE");
    if (!Number.isFinite(candidate.economicCostUsd) || candidate.economicCostUsd < 0) reasons.push("INVALID_ECONOMIC_COST");

    return Object.freeze({
      candidateId: candidate.candidateId,
      eligible: reasons.length === 0,
      rejectionReasons: Object.freeze(reasons),
      utilityScore: candidate.utilityScore,
      economicCostUsd: candidate.economicCostUsd
    });
  });

  const eligible = evaluations.filter((row) => row.eligible);
  eligible.sort((a, b) =>
    b.utilityScore - a.utilityScore ||
    a.economicCostUsd - b.economicCostUsd ||
    a.candidateId.localeCompare(b.candidateId)
  );

  const selected = eligible[0] ?? null;
  const dissent = boardCase.opinions.filter((opinion) =>
    opinion.stance === "OBJECT" ||
    (opinion.stance === "VETO" && (!selected || opinion.candidateId === selected.candidateId))
  );

  const ruling = Object.freeze({
    caseId: boardCase.caseId,
    mandateId: boardCase.mandateId,
    policyVersion,
    selectedCandidateId: selected?.candidateId ?? null,
    disposition: selected ? "APPROVED" : "NO_APPROVABLE_CANDIDATE",
    evaluations: Object.freeze(evaluations),
    dissent: Object.freeze(dissent.map((item) => Object.freeze(structuredClone(item))))
  });

  return Object.freeze({
    ruling,
    precedent: precedentEligible && selected
      ? Object.freeze({
          caseId: boardCase.caseId,
          signature: boardCase.metadata?.precedentSignature ?? null,
          action: Object.freeze({ candidateId: selected.candidateId }),
          status: "CANDIDATE"
        })
      : null,
    policyCandidate: policyCandidateEligible && selected
      ? Object.freeze({
          policyLevel: 2,
          sourceCaseId: boardCase.caseId,
          action: Object.freeze({ candidateId: selected.candidateId }),
          status: "CANDIDATE"
        })
      : null
  });
}
