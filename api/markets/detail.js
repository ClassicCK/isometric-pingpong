// api/markets/detail.js
// Get single market detail with outcomes, prices, and optionally user positions.
// GET /api/markets/detail?id=xxx

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: 'Market ID required' });

  const db = supabase();
  const user = await getAuthUser(req);

  try {
    // Fetch market
    const { data: market, error: marketError } = await db
      .from('markets')
      .select('*')
      .eq('id', id)
      .single();
    if (marketError || !market) return res.status(404).json({ error: 'Market not found' });

    // Fetch outcomes
    const { data: outcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .select('*')
      .eq('market_id', id)
      .order('created_at', { ascending: true });
    if (outcomesError) throw outcomesError;

    // Compute prices
    const pools = (outcomes || []).map(o => parseFloat(o.pool_shares));
    const inverses = pools.map(q => 1 / q);
    const sumInv = inverses.reduce((a, b) => a + b, 0);

    const outcomesWithPrices = (outcomes || []).map((o, i) => ({
      id: o.id,
      label: o.label,
      playerId: o.player_id,
      price: sumInv > 0 ? Math.round((inverses[i] / sumInv) * 10000) / 10000 : 0,
      poolShares: parseFloat(o.pool_shares),
      isWinner: o.is_winner,
    }));

    // Fetch volume
    const { data: volumeData } = await db
      .from('bets')
      .select('cost')
      .eq('market_id', id)
      .eq('direction', 'buy');
    const volume = (volumeData || []).reduce((sum, b) => sum + parseFloat(b.cost), 0);

    // Fetch recent bets for activity feed
    const { data: recentBets } = await db
      .from('bets')
      .select('id, direction, shares, cost, avg_price, created_at, outcome_id')
      .eq('market_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch user positions if authenticated
    let userPositions = [];
    if (user) {
      const { data: positions } = await db
        .from('user_positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', id)
        .gt('shares', 0);
      userPositions = (positions || []).map(p => ({
        outcomeId: p.outcome_id,
        shares: parseFloat(p.shares),
        avgCostBasis: parseFloat(p.avg_cost_basis),
      }));
    }

    // Fetch player info for player-based outcomes
    const playerIds = outcomesWithPrices.filter(o => o.playerId).map(o => o.playerId);
    let playersMap = {};
    if (playerIds.length > 0) {
      const { data: players } = await db
        .from('players')
        .select('id, name, country_code, office, elo')
        .in('id', playerIds);
      playersMap = Object.fromEntries((players || []).map(p => [p.id, {
        name: p.name,
        countryCode: p.country_code,
        office: p.office,
        elo: p.elo,
      }]));
    }

    // Enrich outcomes with player data
    const enrichedOutcomes = outcomesWithPrices.map(o => ({
      ...o,
      player: o.playerId ? playersMap[o.playerId] : null,
    }));

    // Sort by price descending
    enrichedOutcomes.sort((a, b) => b.price - a.price);

    return res.status(200).json({
      market: {
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        status: market.status,
        resolutionDate: market.resolution_date,
        resolvedAt: market.resolved_at,
        createdAt: market.created_at,
        volume: Math.round(volume * 100) / 100,
      },
      outcomes: enrichedOutcomes,
      recentBets: (recentBets || []).map(b => ({
        id: b.id,
        direction: b.direction,
        shares: parseFloat(b.shares),
        cost: parseFloat(b.cost),
        avgPrice: parseFloat(b.avg_price),
        outcomeId: b.outcome_id,
        createdAt: b.created_at,
      })),
      userPositions,
    });
  } catch (err) {
    console.error('Market detail error:', err);
    return res.status(500).json({ error: err.message });
  }
}
