export class CognitiveTreasury {
  #totalUsd;
  #reserveUsd;
  #reserveCommittedUsd = 0;
  #pools = new Map();

  constructor({
    totalUsd,
    liquidReserveUsd = 0,
    pools = []
  }) {
    money("totalUsd", totalUsd);
    money("liquidReserveUsd", liquidReserveUsd);
    if (liquidReserveUsd > totalUsd) throw new Error("liquid reserve exceeds total treasury");

    let allocated = 0;
    for (const pool of pools) {
      requireString("poolId", pool.poolId);
      money("allocationUsd", pool.allocationUsd);
      if (this.#pools.has(pool.poolId)) throw new Error(`duplicate treasury pool: ${pool.poolId}`);
      allocated += pool.allocationUsd;
      this.#pools.set(pool.poolId, {
        poolId: pool.poolId,
        purpose: pool.purpose ?? "OPERATING",
        allocationUsd: pool.allocationUsd,
        committedUsd: 0,
        protected: Boolean(pool.protected)
      });
    }

    if (allocated + liquidReserveUsd > totalUsd + 1e-12) {
      throw new Error("treasury allocations plus reserve exceed totalUsd");
    }

    this.#totalUsd = totalUsd;
    this.#reserveUsd = liquidReserveUsd;
  }

  commit({ poolId, amountUsd }) {
    money("amountUsd", amountUsd);
    const pool = this.#mustPool(poolId);
    const available = pool.allocationUsd - pool.committedUsd;
    if (amountUsd > available + 1e-12) {
      return Object.freeze({ ok: false, reason: "POOL_INSUFFICIENT_FUNDS", poolId });
    }
    pool.committedUsd = round(pool.committedUsd + amountUsd);
    return Object.freeze({ ok: true, poolId, committedUsd: amountUsd });
  }

  release({ poolId, amountUsd }) {
    money("amountUsd", amountUsd);
    const pool = this.#mustPool(poolId);
    if (amountUsd > pool.committedUsd + 1e-12) throw new Error("release exceeds pool commitment");
    pool.committedUsd = round(pool.committedUsd - amountUsd);
    return this.poolSnapshot(poolId);
  }

  transferFromReserve({
    poolId,
    amountUsd,
    authorization
  }) {
    money("amountUsd", amountUsd);
    if (!["BOARD_CONTINGENCY", "OPERATOR_OVERRIDE", "EMERGENCY_AUTHORITY"].includes(authorization)) {
      throw new Error("RESERVE_AUTHORIZATION_REQUIRED");
    }
    const availableReserve = this.#reserveUsd - this.#reserveCommittedUsd;
    if (amountUsd > availableReserve + 1e-12) {
      return Object.freeze({ ok: false, reason: "RESERVE_INSUFFICIENT_FUNDS" });
    }
    const pool = this.#mustPool(poolId);
    pool.allocationUsd = round(pool.allocationUsd + amountUsd);
    this.#reserveCommittedUsd = round(this.#reserveCommittedUsd + amountUsd);
    return Object.freeze({ ok: true, poolId, transferredUsd: amountUsd, authorization });
  }

  poolSnapshot(poolId) {
    const pool = this.#mustPool(poolId);
    return Object.freeze({
      ...pool,
      availableUsd: round(pool.allocationUsd - pool.committedUsd)
    });
  }

  snapshot() {
    const pools = [...this.#pools.values()].map((pool) => this.poolSnapshot(pool.poolId));
    const allocatedUsd = pools.reduce((sum, pool) => sum + pool.allocationUsd, 0);
    const committedUsd = pools.reduce((sum, pool) => sum + pool.committedUsd, 0);
    return Object.freeze({
      totalUsd: this.#totalUsd,
      allocatedUsd: round(allocatedUsd),
      committedUsd: round(committedUsd),
      liquidReserveUsd: this.#reserveUsd,
      reserveTransferredUsd: this.#reserveCommittedUsd,
      reserveAvailableUsd: round(this.#reserveUsd - this.#reserveCommittedUsd),
      unallocatedUsd: round(this.#totalUsd - allocatedUsd - (this.#reserveUsd - this.#reserveCommittedUsd)),
      pools: Object.freeze(pools)
    });
  }

  #mustPool(poolId) {
    const pool = this.#pools.get(poolId);
    if (!pool) throw new Error(`unknown treasury pool: ${poolId}`);
    return pool;
  }
}

export function explorationPool({
  poolId = "exploration",
  allocationUsd,
  protected: isProtected = false
}) {
  return Object.freeze({
    poolId,
    purpose: "EXPLORATION",
    allocationUsd,
    protected: isProtected
  });
}

function money(name, value) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be non-negative`);
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${name} is required`);
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
