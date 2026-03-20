// api/markets/featured.js
// Returns top featured markets with price history for sparkline charts.
// Reconstructs price history by replaying bets through the CPMM.

import { supabase, setCorsHeaders } from '../_lib/supabase.js';
import { getPrices } from '../_lib/cpmm.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();

  try {
    // Fetch top open markets (most volume first, max 4)
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

    // Fetch all outcomes
    const { data: outcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .select('*')
      .in('market_id', marketIds)
      .order('created_at', { ascending: true });
    if (outcomesError) throw outcomesError;

    // Fetch all bets for these markets (chronological)
    const { data: bets, error: betsError } = await db
      .from('bets')
      .select('*')
      .in('market_id', marketIds)
      .order('created_at', { ascending: true });
    if (betsError) throw betsError;

    // Fetch volume per market
    const volumeByMarket = {};
    for (const b of (bets || [])) {
      if (b.direction === 'buy') {
        volumeByMarket[b.market_id] = (volumeByMarket[b.market_id] || 0) + parseFloat(b.cost);
      }
    }

    // Group outcomes by market
    const outcomesByMarket = {};
    for (const o of (outcomes || [])) {
      if (!outcomesByMarket[o.market_id]) outcomesByMarket[o.market_id] = [];
      outcomesByMarket[o.market_id].push(o);
    }

    // Group bets by market
    const betsByMarket = {};
    for (const b of (bets || [])) {
      if (!betsByMarket[b.market_id]) betsByMarket[b.market_id] = [];
      betsByMarket[b.market_id].push(b);
    }

    const featured = markets.map(m => {
      const mOutcomes = outcomesByMarket[m.id] || [];
      const mBets = betsByMarket[m.id] || [];

      // Current pools and prices
      const currentPools = mOutcomes.map(o => parseFloat(o.pool_shares));
      const currentPrices = getPrices(currentPools);

      // Find the leading outcome (highest current price)
      let leadIndex = 0;
      let leadPrice = 0;
      currentPrices.forEach((p, i) => {
        if (p > leadPrice) { leadPrice = p; leadIndex = i; }
      });

      const leadOutcome = mOutcomes[leadIndex];

      // Build price history for the lead outcome by replaying bets
      // Start from initial equal pools (all were 100)
      const initialPools = mOutcomes.map(() => 100);
      const priceHistory = [];

      // Add initial price point
      const initialPrices = getPrices(initialPools);
      const marketCreatedAt = new Date(m.created_at).getTime();
      priceHistory.push({
        time: marketCreatedAt,
        price: Math.round(initialPrices[leadIndex] * 10000) / 10000,
      });

      // Replay each bet to reconstruct price at that point
      if (mBets.length > 0) {
        // We need to reconstruct pool state after each bet
        // Start from initial pools and apply each bet
        let replayPools = [...initialPools];

        for (const bet of mBets) {
          const outcomeIdx = mOutcomes.findIndex(o => o.id === bet.outcome_id);
          if (outcomeIdx === -1) continue;

          const cost = parseFloat(bet.cost);
          const shares = parseFloat(bet.shares);

          if (bet.direction === 'buy') {
            // Apply buy: add cost to all other pools, compute new target pool
            const n = replayPools.length;
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
            // Apply sell: add shares back to target pool, scale others down
            const n = replayPools.length;
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

          // Record price snapshot after this bet
          const prices = getPrices(replayPools);
          priceHistory.push({
            time: new Date(bet.created_at).getTime(),
            price: Math.round(prices[leadIndex] * 10000) / 10000,
          });
        }
      }

      // Always add current price as the final point
      const now = Date.now();
      priceHistory.push({
        time: now,
        price: Math.round(currentPrices[leadIndex] * 10000) / 10000,
      });

      // Build outcomes with prices (top 3 only for preview)
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
        leadOutcome: {
          id: leadOutcome.id,
          label: leadOutcome.label,
          price: Math.round(currentPrices[leadIndex] * 100) / 100,
        },
        priceHistory,
        outcomes: outcomesPreview.slice(0, 3),
        totalOutcomes: mOutcomes.length,
      };
    });

    // Sort by volume descending (most active first)
    featured.sort((a, b) => b.volume - a.volume);

    return res.status(200).json({ featured: featured.slice(0, 4) });
  } catch (err) {
    console.error('Featured markets error:', err);
    return res.status(500).json({ error: err.message });
  }
}
