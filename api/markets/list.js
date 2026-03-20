// api/markets/list.js
// List markets with current prices and price history. Public endpoint.

import { supabase, setCorsHeaders } from '../_lib/supabase.js';
import { getPrices } from '../_lib/cpmm.js';

function buildPriceHistory(mOutcomes, mBets, market, topN = 5) {
  const initialPools = mOutcomes.map(() => 100);
  const currentPools = mOutcomes.map(o => parseFloat(o.pool_shares));
  const currentPrices = getPrices(currentPools);

  const ranked = currentPrices
    .map((price, i) => ({ price, i }))
    .sort((a, b) => b.price - a.price)
    .slice(0, topN);
  const topIndices = ranked.map(r => r.i);

  const histories = {};
  const initialPrices = getPrices(initialPools);
  const marketCreatedAt = new Date(market.created_at).getTime();

  for (const idx of topIndices) {
    const o = mOutcomes[idx];
    histories[o.id] = {
      id: o.id,
      label: o.label,
      currentPrice: Math.round(currentPrices[idx] * 10000) / 10000,
      points: [{ time: marketCreatedAt, price: Math.round(initialPrices[idx] * 10000) / 10000 }],
    };
  }

  if (mBets.length > 0) {
    let replayPools = [...initialPools];
    for (const bet of mBets) {
      const outcomeIdx = mOutcomes.findIndex(o => o.id === bet.outcome_id);
      if (outcomeIdx === -1) continue;
      const cost = parseFloat(bet.cost);
      const shares = parseFloat(bet.shares);
      const n = replayPools.length;

      if (bet.direction === 'buy') {
        let k = 1;
        for (let i = 0; i < n; i++) k *= replayPools[i];
        const newPools = [...replayPools];
        for (let i = 0; i < n; i++) { if (i !== outcomeIdx) newPools[i] += cost; }
        let prodOthers = 1;
        for (let i = 0; i < n; i++) { if (i !== outcomeIdx) prodOthers *= newPools[i]; }
        newPools[outcomeIdx] = k / prodOthers;
        replayPools = newPools;
      } else {
        let k = 1;
        for (let i = 0; i < n; i++) k *= replayPools[i];
        const newPools = [...replayPools];
        newPools[outcomeIdx] += shares;
        const targetProd = k / newPools[outcomeIdx];
        let curProd = 1;
        for (let i = 0; i < n; i++) { if (i !== outcomeIdx) curProd *= replayPools[i]; }
        const sf = Math.pow(targetProd / curProd, 1 / (n - 1));
        for (let i = 0; i < n; i++) { if (i !== outcomeIdx) newPools[i] = replayPools[i] * sf; }
        replayPools = newPools;
      }

      const prices = getPrices(replayPools);
      const betTime = new Date(bet.created_at).getTime();
      for (const idx of topIndices) {
        const o = mOutcomes[idx];
        if (histories[o.id]) {
          histories[o.id].points.push({ time: betTime, price: Math.round(prices[idx] * 10000) / 10000 });
        }
      }
    }
  }

  const now = Date.now();
  for (const idx of topIndices) {
    const o = mOutcomes[idx];
    if (histories[o.id]) {
      histories[o.id].points.push({ time: now, price: Math.round(currentPrices[idx] * 10000) / 10000 });
    }
  }

  return Object.values(histories);
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();
  const { status = 'open', category } = req.query || {};

  try {
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

    const marketIds = markets.map(m => m.id);

    const { data: outcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .select('*')
      .in('market_id', marketIds)
      .order('created_at', { ascending: true });
    if (outcomesError) throw outcomesError;

    // Fetch all bets for price history
    const { data: allBets, error: betsError } = await db
      .from('bets')
      .select('*')
      .in('market_id', marketIds)
      .order('created_at', { ascending: true });
    if (betsError) throw betsError;

    const volumeByMarket = {};
    const betsByMarket = {};
    for (const b of (allBets || [])) {
      if (b.direction === 'buy') {
        volumeByMarket[b.market_id] = (volumeByMarket[b.market_id] || 0) + parseFloat(b.cost);
      }
      if (!betsByMarket[b.market_id]) betsByMarket[b.market_id] = [];
      betsByMarket[b.market_id].push(b);
    }

    const outcomesByMarket = {};
    for (const o of (outcomes || [])) {
      if (!outcomesByMarket[o.market_id]) outcomesByMarket[o.market_id] = [];
      outcomesByMarket[o.market_id].push(o);
    }

    const enrichedMarkets = markets.map(m => {
      const mOutcomes = outcomesByMarket[m.id] || [];
      const mBets = betsByMarket[m.id] || [];
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

      outcomesWithPrices.sort((a, b) => b.price - a.price);

      // Build multi-outcome price history (top 5)
      const priceHistories = buildPriceHistory(mOutcomes, mBets, m, 5);

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
        priceHistories,
      };
    });

    return res.status(200).json({ markets: enrichedMarkets });
  } catch (err) {
    console.error('Markets list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
