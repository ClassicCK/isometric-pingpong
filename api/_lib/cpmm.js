// api/_lib/cpmm.js
// Constant Product Market Maker (CPMM) for multi-outcome prediction markets
// Inspired by Polymarket / Uniswap-style AMMs
//
// The pool is a vector of shares [q1, q2, ..., qN].
// Invariant: product(q_i) = k (constant).
// Implied price for outcome i: p_i = (1/q_i) / sum(1/q_j for all j)
// Lower pool value = higher price (more demand = fewer shares remaining).

/**
 * Get implied probabilities (prices) for each outcome.
 * @param {number[]} pools - Array of pool share counts for each outcome
 * @returns {number[]} Prices between 0 and 1 summing to ~1
 */
export function getPrices(pools) {
  const inverses = pools.map(q => 1 / q);
  const sumInv = inverses.reduce((a, b) => a + b, 0);
  return inverses.map(inv => inv / sumInv);
}

/**
 * Calculate cost to buy a given number of shares of an outcome.
 *
 * When buying shares of outcome i:
 * - User pays cost c
 * - c is added to all OTHER pools (q_j += c for j != i)
 * - q_i adjusts down to maintain invariant: q_i' = k / product(q_j' for j != i)
 * - Shares received = (q_i + c) - q_i' = q_i + c - k/product(q_j + c for j != i)
 *
 * We use binary search to find the cost c that yields the desired shares.
 *
 * @param {number[]} pools
 * @param {number} outcomeIndex
 * @param {number} shares - Desired number of shares to buy
 * @returns {number} Cost in points
 */
export function getCostForShares(pools, outcomeIndex, shares) {
  if (shares <= 0) return 0;

  // Binary search for cost
  let lo = 0;
  let hi = shares * 10; // Upper bound — cost can't exceed shares * max_price

  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    const received = _sharesForCost(pools, outcomeIndex, mid);
    if (received < shares) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.0001) break;
  }

  return Math.ceil((lo + hi) / 2 * 100) / 100; // Round up to nearest cent
}

/**
 * Calculate shares received for a given cost.
 * @param {number[]} pools
 * @param {number} outcomeIndex
 * @param {number} cost - Points to spend
 * @returns {number} Shares received
 */
export function getSharesForCost(pools, outcomeIndex, cost) {
  if (cost <= 0) return 0;
  return _sharesForCost(pools, outcomeIndex, cost);
}

/**
 * Internal: compute shares received when spending `cost` on outcome `outcomeIndex`.
 */
function _sharesForCost(pools, outcomeIndex, cost) {
  const n = pools.length;

  // Current invariant k = product of all pools
  let k = 1;
  for (let i = 0; i < n; i++) k *= pools[i];

  // After adding cost to all other pools, compute product of others
  let productOthers = 1;
  for (let i = 0; i < n; i++) {
    if (i === outcomeIndex) continue;
    productOthers *= (pools[i] + cost);
  }

  // New pool for target outcome (to maintain invariant)
  const newPool = k / productOthers;

  // Shares received = old pool + cost - new pool
  // (cost is added to target pool conceptually, then new pool is subtracted)
  const sharesReceived = pools[outcomeIndex] + cost - newPool;

  return Math.max(0, sharesReceived);
}

/**
 * Execute a buy: spend `cost` points on outcome `outcomeIndex`.
 * Returns new pool state, shares received, and average price.
 *
 * @param {number[]} pools
 * @param {number} outcomeIndex
 * @param {number} cost
 * @returns {{ newPools: number[], sharesReceived: number, avgPrice: number }}
 */
export function applyBuy(pools, outcomeIndex, cost) {
  if (cost <= 0) throw new Error('Cost must be positive');

  const n = pools.length;
  const sharesReceived = _sharesForCost(pools, outcomeIndex, cost);

  if (sharesReceived <= 0) throw new Error('Trade too small');

  // Compute new pools
  let k = 1;
  for (let i = 0; i < n; i++) k *= pools[i];

  const newPools = pools.map((q, i) => {
    if (i === outcomeIndex) {
      let productOthers = 1;
      for (let j = 0; j < n; j++) {
        if (j === outcomeIndex) continue;
        productOthers *= (pools[j] + cost);
      }
      return k / productOthers;
    }
    return q + cost;
  });

  // Enforce minimum pool sizes (prevents prices going to 0 or 1)
  const MIN_POOL = 1;
  for (let i = 0; i < newPools.length; i++) {
    if (newPools[i] < MIN_POOL) {
      throw new Error('Trade would exhaust liquidity');
    }
  }

  return {
    newPools: newPools.map(q => Math.round(q * 10000) / 10000),
    sharesReceived: Math.round(sharesReceived * 10000) / 10000,
    avgPrice: Math.round((cost / sharesReceived) * 10000) / 10000,
  };
}

/**
 * Execute a sell: return `shares` of outcome `outcomeIndex` to the pool.
 * This is the reverse of a buy.
 *
 * @param {number[]} pools
 * @param {number} outcomeIndex
 * @param {number} shares
 * @returns {{ newPools: number[], proceeds: number, avgPrice: number }}
 */
export function applySell(pools, outcomeIndex, shares) {
  if (shares <= 0) throw new Error('Shares must be positive');

  const n = pools.length;

  // When selling, the target pool increases (shares returned to pool)
  // Other pools decrease to maintain invariant
  // User receives cost = amount removed from other pools

  // Binary search for proceeds
  let lo = 0;
  let hi = shares; // Max proceeds = shares * $1

  for (let iter = 0; iter < 100; iter++) {
    const mid = (lo + hi) / 2;
    // If we remove `mid` from other pools and add shares to target pool,
    // check if invariant holds
    const testShares = _sharesForCost(pools, outcomeIndex, mid);
    // We need the reverse: selling `shares` should yield `mid` proceeds
    // Use the identity: buying `testShares` at cost `mid` is equivalent
    // to reversing a sell of `testShares` at proceeds `mid`
    if (testShares > shares) {
      hi = mid;
    } else {
      lo = mid;
    }
    if (hi - lo < 0.0001) break;
  }

  const proceeds = Math.floor((lo + hi) / 2 * 100) / 100; // Round down (house edge)

  if (proceeds <= 0) throw new Error('Trade too small');

  // Apply: add shares back to target pool, remove proceeds from others
  let k = 1;
  for (let i = 0; i < n; i++) k *= pools[i];

  // New target pool after adding shares back
  const newTargetPool = pools[outcomeIndex] + shares;

  // New other pools: product must maintain invariant
  // k = newTargetPool * product(newOtherPools)
  // We distribute the reduction proportionally
  const newPools = [...pools];
  newPools[outcomeIndex] = newTargetPool;

  // Adjust other pools to maintain invariant
  const targetProductOthers = k / newTargetPool;
  let currentProductOthers = 1;
  for (let i = 0; i < n; i++) {
    if (i === outcomeIndex) continue;
    currentProductOthers *= pools[i];
  }

  const scaleFactor = Math.pow(targetProductOthers / currentProductOthers, 1 / (n - 1));
  for (let i = 0; i < n; i++) {
    if (i === outcomeIndex) continue;
    newPools[i] = pools[i] * scaleFactor;
  }

  // Actual proceeds = total reduction in other pools
  let actualProceeds = 0;
  for (let i = 0; i < n; i++) {
    if (i === outcomeIndex) continue;
    actualProceeds += (pools[i] - newPools[i]);
  }

  actualProceeds = Math.floor(actualProceeds * 100) / 100;

  return {
    newPools: newPools.map(q => Math.round(q * 10000) / 10000),
    proceeds: Math.max(0, actualProceeds),
    avgPrice: shares > 0 ? Math.round((actualProceeds / shares) * 10000) / 10000 : 0,
  };
}

/**
 * Calculate initial pool shares from target probabilities.
 * Higher probability = lower pool value (more demand expected).
 *
 * @param {number[]} probabilities - Target probabilities (should sum to ~1)
 * @param {number} liquidity - Base liquidity constant (default 100)
 * @returns {number[]} Initial pool shares
 */
export function poolsFromProbabilities(probabilities, liquidity = 100) {
  // p_i = (1/q_i) / sum(1/q_j)
  // If we set q_i = L / p_i, then (1/q_i) = p_i/L
  // and sum(1/q_j) = sum(p_j)/L = 1/L
  // so p_i = (p_i/L) / (1/L) = p_i ✓

  return probabilities.map(p => {
    const clampedP = Math.max(0.01, Math.min(0.99, p));
    return Math.round((liquidity / clampedP) * 10000) / 10000;
  });
}
