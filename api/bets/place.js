// api/bets/place.js
// Buy shares in a market outcome. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { applyBuy, getPrices } from '../_lib/cpmm.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { marketId, outcomeId, amount } = req.body || {};

  if (!marketId || !outcomeId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'marketId, outcomeId, and positive amount required' });
  }

  const cost = Math.round(parseFloat(amount) * 100) / 100;
  if (cost < 0.01) return res.status(400).json({ error: 'Minimum bet is 0.01 points' });

  const db = supabase();

  try {
    // Verify market is open
    const { data: market } = await db
      .from('markets')
      .select('status')
      .eq('id', marketId)
      .single();

    if (!market || market.status !== 'open') {
      return res.status(400).json({ error: 'Market is not open for betting' });
    }

    // Check user balance (fetch all fields we need)
    const { data: balance } = await db
      .from('point_balances')
      .select('balance, total_wagered')
      .eq('user_id', user.id)
      .single();

    if (!balance || parseFloat(balance.balance) < cost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Fetch all outcomes for this market to get current pools
    const { data: outcomes } = await db
      .from('market_outcomes')
      .select('id, pool_shares')
      .eq('market_id', marketId)
      .order('created_at', { ascending: true });

    if (!outcomes || outcomes.length === 0) {
      return res.status(400).json({ error: 'Market has no outcomes' });
    }

    // Find the index of the target outcome
    const outcomeIndex = outcomes.findIndex(o => o.id === outcomeId);
    if (outcomeIndex === -1) {
      return res.status(400).json({ error: 'Outcome not found in this market' });
    }

    const pools = outcomes.map(o => parseFloat(o.pool_shares));

    // Execute CPMM buy
    const { newPools, sharesReceived, avgPrice } = applyBuy(pools, outcomeIndex, cost);

    // Update pool shares for all outcomes
    for (let i = 0; i < outcomes.length; i++) {
      await db
        .from('market_outcomes')
        .update({ pool_shares: newPools[i] })
        .eq('id', outcomes[i].id);
    }

    // Record the bet
    await db
      .from('bets')
      .insert({
        user_id: user.id,
        market_id: marketId,
        outcome_id: outcomeId,
        direction: 'buy',
        shares: sharesReceived,
        cost: cost,
        avg_price: avgPrice,
      });

    // Upsert user position
    const { data: existingPos } = await db
      .from('user_positions')
      .select('shares, avg_cost_basis')
      .eq('user_id', user.id)
      .eq('outcome_id', outcomeId)
      .single();

    if (existingPos) {
      const oldShares = parseFloat(existingPos.shares);
      const oldCost = parseFloat(existingPos.avg_cost_basis);
      const newShares = oldShares + sharesReceived;
      const newAvgCost = (oldShares * oldCost + cost) / newShares;

      await db
        .from('user_positions')
        .update({
          shares: newShares,
          avg_cost_basis: Math.round(newAvgCost * 10000) / 10000,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('outcome_id', outcomeId);
    } else {
      await db
        .from('user_positions')
        .insert({
          user_id: user.id,
          market_id: marketId,
          outcome_id: outcomeId,
          shares: sharesReceived,
          avg_cost_basis: avgPrice,
        });
    }

    // Debit balance — single clean update
    const newBalance = Math.round((parseFloat(balance.balance) - cost) * 100) / 100;
    const newTotalWagered = Math.round((parseFloat(balance.total_wagered || 0) + cost) * 100) / 100;

    await db
      .from('point_balances')
      .update({
        balance: newBalance,
        total_wagered: newTotalWagered,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Record transaction
    await db
      .from('point_transactions')
      .insert({
        user_id: user.id,
        amount: -cost,
        type: 'bet_purchase',
        description: `Bought ${sharesReceived.toFixed(2)} shares`,
        reference_id: outcomeId,
        balance_after: newBalance,
      });

    // Return new prices
    const newPrices = getPrices(newPools);
    const outcomePrices = outcomes.map((o, i) => ({
      id: o.id,
      price: Math.round(newPrices[i] * 10000) / 10000,
      poolShares: newPools[i],
    }));

    return res.status(200).json({
      sharesReceived: Math.round(sharesReceived * 10000) / 10000,
      cost,
      avgPrice: Math.round(avgPrice * 10000) / 10000,
      newBalance,
      outcomes: outcomePrices,
    });
  } catch (err) {
    console.error('Place bet error:', err);
    return res.status(500).json({ error: err.message });
  }
}
