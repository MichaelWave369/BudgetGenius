export const QUALIFICATION_STATUS = Object.freeze({
  UNQUALIFIED: "UNQUALIFIED",
  SHADOW: "SHADOW",
  LIMITED: "LIMITED",
  QUALIFIED: "QUALIFIED",
  PREFERRED: "PREFERRED",
  SUSPENDED: "SUSPENDED"
});

const forward = Object.freeze({
  UNQUALIFIED: new Set(["SHADOW", "SUSPENDED"]),
  SHADOW: new Set(["LIMITED", "UNQUALIFIED", "SUSPENDED"]),
  LIMITED: new Set(["QUALIFIED", "SHADOW", "SUSPENDED"]),
  QUALIFIED: new Set(["PREFERRED", "LIMITED", "SUSPENDED"]),
  PREFERRED: new Set(["QUALIFIED", "SUSPENDED"]),
  SUSPENDED: new Set(["SHADOW", "UNQUALIFIED"])
});

const rank = Object.freeze({
  UNQUALIFIED: 0,
  SHADOW: 1,
  LIMITED: 2,
  QUALIFIED: 3,
  PREFERRED: 4,
  SUSPENDED: -1
});

export class QualificationPortfolio {
  #assets = new Map();
  #version = 0;

  register({
    assetId,
    assetType,
    taskClasses = [],
    status = QUALIFICATION_STATUS.UNQUALIFIED,
    evidence = {}
  }) {
    requireString("assetId", assetId);
    if (!["MODEL", "PROVIDER"].includes(assetType)) throw new TypeError("assetType must be MODEL or PROVIDER");
    if (!Object.values(QUALIFICATION_STATUS).includes(status)) throw new TypeError("invalid qualification status");
    if (this.#assets.has(assetId)) throw new Error(`asset already registered: ${assetId}`);

    this.#assets.set(assetId, {
      assetId,
      assetType,
      taskClasses: new Set(taskClasses),
      status,
      evidence: structuredClone(evidence),
      history: [{ from: null, to: status, reason: "REGISTERED" }]
    });
    this.#version += 1;
    return this.snapshot(assetId);
  }

  transition(assetId, nextStatus, {
    reason,
    evidence = {},
    taskClasses = null
  } = {}) {
    const asset = this.#must(assetId);
    if (!Object.values(QUALIFICATION_STATUS).includes(nextStatus)) throw new TypeError("invalid qualification status");
    if (!forward[asset.status].has(nextStatus)) {
      throw new Error(`INVALID_QUALIFICATION_TRANSITION:${asset.status}->${nextStatus}`);
    }
    const previous = asset.status;
    asset.status = nextStatus;
    asset.evidence = { ...asset.evidence, ...structuredClone(evidence) };
    if (taskClasses) asset.taskClasses = new Set(taskClasses);
    asset.history.push({ from: previous, to: nextStatus, reason: reason ?? null });
    this.#version += 1;
    return this.snapshot(assetId);
  }

  isQualified(assetId, { minimumStatus = QUALIFICATION_STATUS.QUALIFIED, taskClass = null } = {}) {
    const asset = this.#must(assetId);
    if (asset.status === QUALIFICATION_STATUS.SUSPENDED) return false;
    if (rank[asset.status] < rank[minimumStatus]) return false;
    if (taskClass && asset.taskClasses.size > 0 && !asset.taskClasses.has(taskClass)) return false;
    return true;
  }

  snapshot(assetId) {
    const asset = this.#must(assetId);
    return Object.freeze({
      assetId: asset.assetId,
      assetType: asset.assetType,
      status: asset.status,
      taskClasses: Object.freeze([...asset.taskClasses].sort()),
      evidence: Object.freeze(structuredClone(asset.evidence)),
      history: Object.freeze(asset.history.map((row) => Object.freeze(structuredClone(row)))),
      portfolioVersion: this.#version
    });
  }

  get version() {
    return this.#version;
  }

  #must(assetId) {
    const asset = this.#assets.get(assetId);
    if (!asset) throw new Error(`unknown qualification asset: ${assetId}`);
    return asset;
  }
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
}
