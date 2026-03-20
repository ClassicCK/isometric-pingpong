// api/portfolio/history.js
// Returns portfolio value history for the authenticated user.
// Used to render a Robinhood-style portfolio performance chart.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { getPrices } from '../_lib/cpmm.js';

const MAX_HISTORY_POINTS = 100;

/**
 * Downsample a history array to at most `max` points.
 * Always keeps the first and last point, and samples evenly in between.
 * Also preserves points where totalValue changed significantly (>5% swing).
 */
function sampleHistory(history, max) {
  if (history.length <= max) return history;

  const result = [history[0]];
  const last = history[history.length - 1];

  // Find significant change points (>5% swing from previous)
  const significant = new Set([0, history.length - 1]);
  for (let i = 1; i < history.length - 1; i++) {
    const prev = history[i - 1].totalValue;
    const curr = history[i].totalValue;
    if (prev > 0 && Math.abs(curr - prev) / prev > 0.05) {
      significant.add(i);
    }
  }

  // If significant points alone exceed budget, sample from them
  const sigIndices = Array.from(significant).sort((a, b) => a - b);

  if (sigIndices.length >= max) {
    // Take evenly spaced from significant points
    const step = (sigIndices.length - 1) / (max - 1);
    for (let i = 1; i < max - 1; i++) {
      const idx = sigIndices[Math.round(i * step)];
      result.push(history[idx]);
    }
  } else {
    // Fill remaining budget with evenly spaced points
    const budget = max - sigIndices.length;
    const step = (history.length - 1) / (budget + 1);
    const allIndices = new Set(sigIndices);
    for (let i = 1; i <= budget; i++) {
      allIndices.add(Math.round(i * step));
    }
    const sorted = Array.from(allIndices).sort((a, b) => a - b);
    // Skip first (already added) and last (added below)
    for (const idx of sorted) {
      if (idx === 0 || idx === history.length - 1) continue;
      result.push(history[idx]);
    }
  }

  result.push(last);
  // Sort by time just in case
  result.sort((a, b) => a.time - b.time);
  return result;
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Require auth
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = supabase();
    const userId = user.id;

    // 2. Fetch all point_transactions for the user, ordered ascending
    const { data: transactions, error: txError } = await db
      .from('point_transactions')
      .select('amount, type, balance_after, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (txError) throw txError;

    // 3. Fetch all bets for the user, ordered ascending
    const { data: bets, error: betsError } = await db
      .from('bets')
      .select('market_id, outcome_id, direction, shares, cost, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (betsError) throw betsError;

    // 4. Fetch current positions from user_positions
    const { data: positions, error: posError } = await db
      .from('user_positions')
      .select('shares, avg_cost_basis, outcome_id, market_id')
      .eq('user_id', userId)
      .gt('shares', 0);
    if (posError) throw posError;

    // 5. Fetch current market outcomes (pool_shares) for position valuation
    const marketIds = [...new Set((positions || []).map(p => p.market_id))];
    let outcomesByMarket = {};

    if (marketIds.length > 0) {
      const { data: outcomes, error: outError } = await db
        .from('market_outcomes')
        .select('id, market_id, pool_shares')
        .in('market_id', marketIds)
        .order('created_at', { ascending: true });
      if (outError) throw outError;

      for (const o of (outcomes || [])) {
        if (!outcomesByMarket[o.market_id]) outcomesByMarket[o.market_id] = [];
        outcomesByMarket[o.market_id].push(o);
      }
    }

    // Compute current positions value using CPMM prices
    let currentPositionsValue = 0;
    for (const pos of (positions || [])) {
      const mOutcomes = outcomesByMarket[pos.market_id];
      if (!mOutcomes || mOutcomes.length === 0) continue;

      const pools = mOutcomes.map(o => parseFloat(o.pool_shares));
      const prices = getPrices(pools);
      const outcomeIdx = mOutcomes.findIndex(o => o.id === pos.outcome_id);
      if (outcomeIdx === -1) continue;

      const price = prices[outcomeIdx];
      currentPositionsValue += parseFloat(pos.shares) * price;
    }
    currentPositionsValue = Math.round(currentPositionsValue * 100) / 100;

    // Current balance from the latest transaction
    const currentBalance = transactions && transactions.length > 0
      ? parseFloat(transactions[transactions.length - 1].balance_after)
      : 0;

    const currentTotalValue = Math.round((currentBalance + currentPositionsValue) * 100) / 100;

    // Total deposited (sum of initial_grant transactions)
    const totalDeposited = (transactions || [])
      .filter(tx => tx.type === 'initial_grant')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const totalProfit = Math.round((currentTotalValue - totalDeposited) * 100) / 100;

    // Build timeline of portfolio value snapshots
    // Walk through bets chronologically to track shares held over time
    const holdingsMap = {}; // outcomeId -> { shares, totalCost }

    // Pre-process bets into a time-indexed structure
    const betEvents = (bets || []).map(b => ({
      time: new Date(b.created_at).getTime(),
      outcomeId: b.outcome_id,
      direction: b.direction,
      shares: parseFloat(b.shares),
      cost: parseFloat(b.cost),
    }));

    // Sort bets by time
    betEvents.sort((a, b) => a.time - b.time);

    // Helper: compute total positions value at cost basis
    function getPositionsValueAtCost() {
      let value = 0;
      for (const [, holding] of Object.entries(holdingsMap)) {
        if (holding.shares > 0) {
          const avgCost = holding.totalCost / holding.shares;
          value += holding.shares * avgCost;
        }
      }
      return value;
    }

    // Build history using transactions as the backbone
    let betIdx = 0;
    const history = [];

    for (const tx of (transactions || [])) {
      const txTime = new Date(tx.created_at).getTime();
      const balance = parseFloat(tx.balance_after);

      // Process any bets that happened before or at this transaction time
      while (betIdx < betEvents.length && betEvents[betIdx].time <= txTime) {
        const bet = betEvents[betIdx];
        if (!holdingsMap[bet.outcomeId]) {
          holdingsMap[bet.outcomeId] = { shares: 0, totalCost: 0 };
        }
        if (bet.direction === 'buy') {
          holdingsMap[bet.outcomeId].shares += bet.shares;
          holdingsMap[bet.outcomeId].totalCost += bet.cost;
        } else {
          // Sell: reduce shares proportionally
          const h = holdingsMap[bet.outcomeId];
          if (h.shares > 0) {
            const fraction = Math.min(bet.shares / h.shares, 1);
            h.totalCost -= h.totalCost * fraction;
            h.shares -= bet.shares;
            if (h.shares < 0.0001) {
              h.shares = 0;
              h.totalCost = 0;
            }
          }
        }
        betIdx++;
      }

      const positionsValue = Math.round(getPositionsValueAtCost() * 100) / 100;
      const totalValue = Math.round((balance + positionsValue) * 100) / 100;

      history.push({
        time: txTime,
        balance,
        positionsValue,
        totalValue,
      });
    }

    // Process any remaining bets after the last transaction
    while (betIdx < betEvents.length) {
      const bet = betEvents[betIdx];
      if (!holdingsMap[bet.outcomeId]) {
        holdingsMap[bet.outcomeId] = { shares: 0, totalCost: 0 };
      }
      if (bet.direction === 'buy') {
        holdingsMap[bet.outcomeId].shares += bet.shares;
        holdingsMap[bet.outcomeId].totalCost += bet.cost;
      } else {
        const h = holdingsMap[bet.outcomeId];
        if (h.shares > 0) {
          const fraction = Math.min(bet.shares / h.shares, 1);
          h.totalCost -= h.totalCost * fraction;
          h.shares -= bet.shares;
          if (h.shares < 0.0001) {
            h.shares = 0;
            h.totalCost = 0;
          }
        }
      }
      betIdx++;
    }

    // Add current point with actual CPMM-priced positions value
    const now = Date.now();
    if (history.length === 0 || history[history.length - 1].time < now) {
      history.push({
        time: now,
        balance: currentBalance,
        positionsValue: currentPositionsValue,
        totalValue: currentTotalValue,
      });
    } else {
      // Update the last point with accurate market-priced positions
      const lastPoint = history[history.length - 1];
      lastPoint.positionsValue = currentPositionsValue;
      lastPoint.totalValue = Math.round((lastPoint.balance + currentPositionsValue) * 100) / 100;
    }

    // Sample history to max ~100 points
    const sampledHistory = sampleHistory(history, MAX_HISTORY_POINTS);

    return res.status(200).json({
      currentBalance,
      currentPositionsValue,
      currentTotalValue,
      totalDeposited,
      totalProfit,
      history: sampledHistory,
    });
  } catch (err) {
    console.error('Portfolio history error:', err);
    return res.status(500).json({ error: err.message });
  }
}
