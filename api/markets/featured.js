// api/markets/featured.js
// Returns top featured markets with price history for multi-line sparkline charts.
// Reconstructs price history by replaying bets through the CPMM.

import { supabase, setCorsHeaders } from '../_lib/supabase.js';
import { getPrices } from '../_lib/cpmm.js';

/**
 * Replay all bets for a market and return price history for the top N outcomes.
 */
function buildPriceHistory(mOutcomes, mBets, market, topN = 5) {
  const initialPools = mOutcomes.map(() => 100);
  const currentPools = mOutcomes.map(o => parseFloat(o.pool_shares));
  const currentPrices = getPrices(currentPools);

  // Find top N outcomes by current price
  const ranked = currentPrices
    .map((price, i) => ({ price, i }))
    .sort((a, b) => b.price - a.price)
    .slice(0, topN);
  const topIndices = ranked.map(r => r.i);

  // Initialize price history per tracked outcome
  const histories = {};
  const initialPrices = getPrices(initialPools);
  const marketCreatedAt = new Date(market.created_at).getTime();

  for (const idx of topIndices) {
    const o = mOutcomes[idx];
    histories[o.id] = {
      id: o.id,
      label: o.label,
      color: null, // assigned on client
      currentPrice: Math.round(currentPrices[idx] * 10000) / 10000,
      points: [{ time: marketCreatedAt, price: Math.round(initialPrices[idx] * 10000) / 10000 }],
    };
  }

  // Replay bets
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
        for (let i = 0; i < n; i++) {
          if (i !== outcomeIdx) newPools[i] += cost;
        }
        let productOthers = 1;
        for (let i = 0; i < n; i++) {
          if (i !== outcomeIdx) productOthers *= newPools[i];
        }
        newPools[outcomeIdx] = k / productOthers;
        replayPools = newPools;
      } else {
        let k = 1;
        for (let i = 0; i < n; i++) k *= replayPools[i];
        const newPools = [...replayPools];
        newPools[outcomeIdx] += shares;
        const targetProductOthers = k / newPools[outcomeIdx];
        let currentProductOthers = 1;
        for (let i = 0; i < n; i++) {
          if (i !== outcomeIdx) currentProductOthers *= replayPools[i];
        }
        const scaleFactor = Math.pow(targetProductOthers / currentProductOthers, 1 / (n - 1));
        for (let i = 0; i < n; i++) {
          if (i !== outcomeIdx) newPools[i] = replayPools[i] * scaleFactor;
        }
        replayPools = newPools;
      }

      // Record price snapshot for tracked outcomes
      const prices = getPrices(replayPools);
      const betTime = new Date(bet.created_at).getTime();
      for (const idx of topIndices) {
        const o = mOutcomes[idx];
        histories[o.id].points.push({
          time: betTime,
          price: Math.round(prices[idx] * 10000) / 10000,
        });
      }
    }
  }

  // Add current price as final point
  const now = Date.now();
  for (const idx of topIndices) {
    const o = mOutcomes[idx];
    histories[o.id].points.push({
      time: now,
      price: Math.round(currentPrices[idx] * 10000) / 10000,
    });
  }

  return Object.values(histories);
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();

  try {
    const { data: markets, error: marketsError } = await db
      .from('markets')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .limit(6);
    if (marketsError) throw marketsError;

    if (!markets || markets.length === 0) {
      return res.status(200).json({ featured: [] });
    }

    const marketIds = markets.map(m => m.id);

    const { data: outcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .select('*')
      .in('market_id', marketIds)
      .order('created_at', { ascending: true });
    if (outcomesError) throw outcomesError;

    const { data: bets, error: betsError } = await db
      .from('bets')
      .select('*')
      .in('market_id', marketIds)
      .order('created_at', { ascending: true });
    if (betsError) throw betsError;

    const volumeByMarket = {};
    for (const b of (bets || [])) {
      if (b.direction === 'buy') {
        volumeByMarket[b.market_id] = (volumeByMarket[b.market_id] || 0) + parseFloat(b.cost);
      }
    }

    const outcomesByMarket = {};
    for (const o of (outcomes || [])) {
      if (!outcomesByMarket[o.market_id]) outcomesByMarket[o.market_id] = [];
      outcomesByMarket[o.market_id].push(o);
    }

    const betsByMarket = {};
    for (const b of (bets || [])) {
      if (!betsByMarket[b.market_id]) betsByMarket[b.market_id] = [];
      betsByMarket[b.market_id].push(b);
    }

    const featured = markets.map(m => {
      const mOutcomes = outcomesByMarket[m.id] || [];
      const mBets = betsByMarket[m.id] || [];

      const currentPools = mOutcomes.map(o => parseFloat(o.pool_shares));
      const currentPrices = getPrices(currentPools);

      // Build multi-outcome price history (top 5 for featured cards)
      const priceHistories = buildPriceHistory(mOutcomes, mBets, m, 5);

      // All outcomes with prices
      const outcomesPreview = mOutcomes.map((o, i) => ({
        id: o.id,
        label: o.label,
        price: Math.round(currentPrices[i] * 100) / 100,
      }));
      outcomesPreview.sort((a, b) => b.price - a.price);

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        status: m.status,
        volume: Math.round((volumeByMarket[m.id] || 0) * 100) / 100,
        priceHistories,
        outcomes: outcomesPreview.slice(0, 5),
        totalOutcomes: mOutcomes.length,
      };
    });

    featured.sort((a, b) => b.volume - a.volume);

    return res.status(200).json({ featured: featured.slice(0, 4) });
  } catch (err) {
    console.error('Featured markets error:', err);
    return res.status(500).json({ error: err.message });
  }
}
