// api/leaderboard/traders.js
// GET endpoint — top traders by profit from prediction markets. No auth required.

import { supabase, setCorsHeaders } from '../_lib/supabase.js';
import { getPrices } from '../_lib/cpmm.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();

  try {
    // 1. Fetch all users
    const { data: users, error: usersError } = await db
      .from('users')
      .select('id, display_name, player_id');
    if (usersError) throw usersError;

    // 2. Fetch all point_balances
    const { data: balances, error: balancesError } = await db
      .from('point_balances')
      .select('*');
    if (balancesError) throw balancesError;

    const balanceByUser = {};
    for (const b of (balances || [])) {
      balanceByUser[b.user_id] = parseFloat(b.balance);
    }

    // 3. Fetch all user_positions with joined market_outcomes and markets
    const { data: positions, error: positionsError } = await db
      .from('user_positions')
      .select('*, market_outcomes!inner(id, market_id, pool_shares, is_winner), markets!inner(id, status)');
    if (positionsError) throw positionsError;

    // 4. Fetch all market_outcomes for computing current prices per market
    const { data: allOutcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .select('id, market_id, pool_shares, created_at')
      .order('created_at', { ascending: true });
    if (outcomesError) throw outcomesError;

    // Build price lookup: outcome_id -> current price
    const outcomesByMarket = {};
    for (const o of (allOutcomes || [])) {
      if (!outcomesByMarket[o.market_id]) outcomesByMarket[o.market_id] = [];
      outcomesByMarket[o.market_id].push(o);
    }

    const priceByOutcome = {};
    for (const [marketId, outcomes] of Object.entries(outcomesByMarket)) {
      const pools = outcomes.map(o => parseFloat(o.pool_shares));
      const prices = getPrices(pools);
      for (let i = 0; i < outcomes.length; i++) {
        priceByOutcome[outcomes[i].id] = prices[i];
      }
    }

    // 5. Fetch all bets for trade counts
    const { data: allBets, error: betsError } = await db
      .from('bets')
      .select('id, user_id, market_id');
    if (betsError) throw betsError;

    // Count trades and distinct markets per user
    const tradesCountByUser = {};
    const marketsByUser = {};
    for (const bet of (allBets || [])) {
      tradesCountByUser[bet.user_id] = (tradesCountByUser[bet.user_id] || 0) + 1;
      if (!marketsByUser[bet.user_id]) marketsByUser[bet.user_id] = new Set();
      marketsByUser[bet.user_id].add(bet.market_id);
    }

    // 6. Fetch point_transactions for realized profit and initial grants
    const { data: transactions, error: txError } = await db
      .from('point_transactions')
      .select('user_id, type, amount');
    if (txError) throw txError;

    const initialGrantByUser = {};
    for (const tx of (transactions || [])) {
      if (tx.type === 'initial_grant') {
        initialGrantByUser[tx.user_id] = (initialGrantByUser[tx.user_id] || 0) + parseFloat(tx.amount);
      }
    }

    // 7. Compute stats per user
    // Group positions by user
    const positionsByUser = {};
    for (const pos of (positions || [])) {
      if (!positionsByUser[pos.user_id]) positionsByUser[pos.user_id] = [];
      positionsByUser[pos.user_id].push(pos);
    }

    const traders = users.map(user => {
      const userPositions = positionsByUser[user.id] || [];
      const balance = balanceByUser[user.id] || 0;

      let totalInvested = 0;
      let currentValue = 0;

      for (const pos of userPositions) {
        const shares = parseFloat(pos.shares);
        const avgCostBasis = parseFloat(pos.avg_cost_basis);
        totalInvested += shares * avgCostBasis;

        const marketStatus = pos.markets.status;
        const outcomeId = pos.market_outcomes.id;
        const isWinner = pos.market_outcomes.is_winner;

        if (marketStatus === 'resolved') {
          if (isWinner) {
            currentValue += shares * 1;
          }
          // is_winner = false -> value = 0
        } else {
          // Open market: use current CPMM price
          const currentPrice = priceByOutcome[outcomeId] || 0;
          currentValue += shares * currentPrice;
        }
      }

      const totalInitialGrants = initialGrantByUser[user.id] || 0;
      const totalProfit = currentValue + balance - totalInitialGrants;
      const roi = (totalProfit / Math.max(1, totalInvested)) * 100;
      const tradesCount = tradesCountByUser[user.id] || 0;
      const marketsTraded = marketsByUser[user.id] ? marketsByUser[user.id].size : 0;

      return {
        userId: user.id,
        displayName: user.display_name,
        playerName: user.player_id,
        totalProfit: Math.round(totalProfit * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        currentValue: Math.round(currentValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        tradesCount,
        marketsTraded,
        balance: Math.round(balance * 100) / 100,
      };
    });

    // Sort by totalProfit descending, return top 50
    traders.sort((a, b) => b.totalProfit - a.totalProfit);
    const top50 = traders.slice(0, 50);

    return res.status(200).json({ traders: top50 });
  } catch (err) {
    console.error('Traders leaderboard error:', err);
    return res.status(500).json({ error: err.message });
  }
}
