export class BudgetBanker {
  #pools = new Map();
  #leases = new Map();

  createPool({ poolId, limitUsd, parentId = null }) {
    if (this.#pools.has(poolId)) throw new Error(`pool already exists: ${poolId}`);
    if (!Number.isFinite(limitUsd) || limitUsd < 0) throw new TypeError("limitUsd must be non-negative");
    if (parentId && !this.#pools.has(parentId)) throw new Error(`unknown parent pool: ${parentId}`);
    this.#pools.set(poolId, { poolId, parentId, limitUsd, reservedUsd: 0, spentUsd: 0 });
    return this.snapshot(poolId);
  }

  snapshot(poolId) {
    const pool = this.#mustPool(poolId);
    return Object.freeze({
      ...pool,
      availableUsd: round(pool.limitUsd - pool.reservedUsd - pool.spentUsd)
    });
  }

  reserve({ leaseId, poolId, amountUsd }) {
    if (this.#leases.has(leaseId)) throw new Error(`lease already exists: ${leaseId}`);
    if (!Number.isFinite(amountUsd) || amountUsd < 0) throw new TypeError("amountUsd must be non-negative");
    const chain = this.#chain(poolId);
    for (const pool of chain) {
      const available = pool.limitUsd - pool.reservedUsd - pool.spentUsd;
      if (available + 1e-12 < amountUsd) {
        return Object.freeze({ ok: false, reason: "INSUFFICIENT_BUDGET", blockingPoolId: pool.poolId });
      }
    }
    for (const pool of chain) pool.reservedUsd = round(pool.reservedUsd + amountUsd);
    this.#leases.set(leaseId, { leaseId, poolId, amountUsd, state: "RESERVED" });
    return Object.freeze({ ok: true, leaseId, amountUsd });
  }

  settle({ leaseId, actualUsd }) {
    const lease = this.#mustLease(leaseId);
    if (lease.state !== "RESERVED") throw new Error(`lease is not reservable: ${lease.state}`);
    if (!Number.isFinite(actualUsd) || actualUsd < 0) throw new TypeError("actualUsd must be non-negative");
    if (actualUsd > lease.amountUsd + 1e-12) throw new Error("SETTLEMENT_EXCEEDS_RESERVATION");
    const chain = this.#chain(lease.poolId);
    for (const pool of chain) {
      pool.reservedUsd = round(pool.reservedUsd - lease.amountUsd);
      pool.spentUsd = round(pool.spentUsd + actualUsd);
    }
    lease.state = "SETTLED";
    lease.actualUsd = round(actualUsd);
    return Object.freeze({
      leaseId,
      reservedUsd: lease.amountUsd,
      actualUsd: round(actualUsd),
      refundedUsd: round(lease.amountUsd - actualUsd)
    });
  }

  release({ leaseId }) {
    const lease = this.#mustLease(leaseId);
    if (lease.state !== "RESERVED") throw new Error(`lease cannot be released from ${lease.state}`);
    for (const pool of this.#chain(lease.poolId)) {
      pool.reservedUsd = round(pool.reservedUsd - lease.amountUsd);
    }
    lease.state = "RELEASED";
    return Object.freeze({ leaseId, releasedUsd: lease.amountUsd });
  }

  #chain(poolId) {
    const chain = [];
    let pool = this.#mustPool(poolId);
    while (pool) {
      chain.push(pool);
      pool = pool.parentId ? this.#mustPool(pool.parentId) : null;
    }
    return chain;
  }

  #mustPool(poolId) {
    const pool = this.#pools.get(poolId);
    if (!pool) throw new Error(`unknown pool: ${poolId}`);
    return pool;
  }

  #mustLease(leaseId) {
    const lease = this.#leases.get(leaseId);
    if (!lease) throw new Error(`unknown lease: ${leaseId}`);
    return lease;
  }
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1e9) / 1e9;
}
