// api/markets/list.js
// List markets with current prices. Public endpoint (no auth required for reading).

import { supabase, setCorsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();
  const { status = 'open', category } = req.query || {};

  try {
    // Fetch markets
    let query = db.from('markets').select('*').order('created_at', { ascending: false });
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: markets, error: marketsError } = await query;
    if (marketsError) throw marketsError;

    if (!markets || markets.length === 0) {
      return res.status(200).json({ markets: [] });
    }

    // Fetch all outcomes for these markets
    const marketIds = markets.map(m => m.id);
    const { data: outcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .select('*')
      .in('market_id', marketIds)
      .order('created_at', { ascending: true });
    if (outcomesError) throw outcomesError;

    // Fetch total volume per market from bets
    const { data: volumeData } = await db
      .from('bets')
      .select('market_id, cost')
      .in('market_id', marketIds)
      .eq('direction', 'buy');

    const volumeByMarket = {};
    for (const b of (volumeData || [])) {
      volumeByMarket[b.market_id] = (volumeByMarket[b.market_id] || 0) + parseFloat(b.cost);
    }

    // Group outcomes by market and compute prices
    const outcomesByMarket = {};
    for (const o of (outcomes || [])) {
      if (!outcomesByMarket[o.market_id]) outcomesByMarket[o.market_id] = [];
      outcomesByMarket[o.market_id].push(o);
    }

    const enrichedMarkets = markets.map(m => {
      const mOutcomes = outcomesByMarket[m.id] || [];
      const pools = mOutcomes.map(o => parseFloat(o.pool_shares));
      const inverses = pools.map(q => 1 / q);
      const sumInv = inverses.reduce((a, b) => a + b, 0);

      const outcomesWithPrices = mOutcomes.map((o, i) => ({
        id: o.id,
        label: o.label,
        playerId: o.player_id,
        price: sumInv > 0 ? Math.round((inverses[i] / sumInv) * 100) / 100 : 0,
        poolShares: parseFloat(o.pool_shares),
        isWinner: o.is_winner,
      }));

      // Sort by price descending (favorites first)
      outcomesWithPrices.sort((a, b) => b.price - a.price);

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        status: m.status,
        resolutionDate: m.resolution_date,
        resolvedAt: m.resolved_at,
        createdAt: m.created_at,
        volume: Math.round((volumeByMarket[m.id] || 0) * 100) / 100,
        outcomes: outcomesWithPrices,
      };
    });

    return res.status(200).json({ markets: enrichedMarkets });
  } catch (err) {
    console.error('Markets list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
