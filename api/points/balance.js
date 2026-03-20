// api/points/balance.js
// Get authenticated user's point balance + active positions

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const db = supabase();

  try {
    // Fetch balance
    const { data: balance } = await db
      .from('point_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!balance) {
      return res.status(200).json({
        balance: 0,
        totalEarned: 0,
        totalWagered: 0,
        positions: [],
        initialized: false,
      });
    }

    // Fetch active positions with market/outcome info
    const { data: positions } = await db
      .from('user_positions')
      .select(`
        id,
        shares,
        avg_cost_basis,
        outcome_id,
        market_id,
        market_outcomes (
          id,
          label,
          player_id,
          pool_shares,
          is_winner,
          market_id
        )
      `)
      .eq('user_id', user.id)
      .gt('shares', 0);

    // Fetch markets for those positions
    const marketIds = [...new Set((positions || []).map(p => p.market_id))];
    let marketsMap = {};
    if (marketIds.length > 0) {
      const { data: markets } = await db
        .from('markets')
        .select('id, title, status, category')
        .in('id', marketIds);
      marketsMap = Object.fromEntries((markets || []).map(m => [m.id, m]));
    }

    // Get all outcomes for each market to compute current prices
    let pricesMap = {};
    if (marketIds.length > 0) {
      const { data: allOutcomes } = await db
        .from('market_outcomes')
        .select('id, market_id, pool_shares')
        .in('market_id', marketIds);

      // Group by market
      const outcomesByMarket = {};
      for (const o of (allOutcomes || [])) {
        if (!outcomesByMarket[o.market_id]) outcomesByMarket[o.market_id] = [];
        outcomesByMarket[o.market_id].push(o);
      }

      // Compute prices
      for (const [mId, outcomes] of Object.entries(outcomesByMarket)) {
        const pools = outcomes.map(o => parseFloat(o.pool_shares));
        const inverses = pools.map(q => 1 / q);
        const sumInv = inverses.reduce((a, b) => a + b, 0);
        for (let i = 0; i < outcomes.length; i++) {
          pricesMap[outcomes[i].id] = inverses[i] / sumInv;
        }
      }
    }

    const enrichedPositions = (positions || []).map(p => ({
      id: p.id,
      marketId: p.market_id,
      marketTitle: marketsMap[p.market_id]?.title || 'Unknown Market',
      marketStatus: marketsMap[p.market_id]?.status || 'unknown',
      outcomeId: p.outcome_id,
      outcomeLabel: p.market_outcomes?.label || 'Unknown',
      shares: parseFloat(p.shares),
      avgCostBasis: parseFloat(p.avg_cost_basis),
      currentPrice: pricesMap[p.outcome_id] || 0,
      currentValue: parseFloat(p.shares) * (pricesMap[p.outcome_id] || 0),
      costBasis: parseFloat(p.shares) * parseFloat(p.avg_cost_basis),
    }));

    return res.status(200).json({
      balance: parseFloat(balance.balance),
      totalEarned: parseFloat(balance.total_earned),
      totalWagered: parseFloat(balance.total_wagered),
      positions: enrichedPositions,
      initialized: true,
    });
  } catch (err) {
    console.error('Balance error:', err);
    return res.status(500).json({ error: err.message });
  }
}
