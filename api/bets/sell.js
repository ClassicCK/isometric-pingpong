// api/bets/sell.js
// Sell shares of a market outcome back to the pool. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { applySell, getPrices } from '../_lib/cpmm.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { marketId, outcomeId, shares: sharesToSell } = req.body || {};

  if (!marketId || !outcomeId || !sharesToSell || sharesToSell <= 0) {
    return res.status(400).json({ error: 'marketId, outcomeId, and positive shares required' });
  }

  const db = supabase();

  try {
    // Verify market is open
    const { data: market } = await db
      .from('markets')
      .select('status')
      .eq('id', marketId)
      .single();

    if (!market || market.status !== 'open') {
      return res.status(400).json({ error: 'Market is not open for trading' });
    }

    // Check user has enough shares
    const { data: position } = await db
      .from('user_positions')
      .select('shares, avg_cost_basis')
      .eq('user_id', user.id)
      .eq('outcome_id', outcomeId)
      .single();

    if (!position || parseFloat(position.shares) < sharesToSell) {
      return res.status(400).json({ error: 'Insufficient shares' });
    }

    // Fetch all outcomes for this market
    const { data: outcomes } = await db
      .from('market_outcomes')
      .select('id, pool_shares')
      .eq('market_id', marketId)
      .order('created_at', { ascending: true });

    const outcomeIndex = outcomes.findIndex(o => o.id === outcomeId);
    if (outcomeIndex === -1) return res.status(400).json({ error: 'Outcome not found' });

    const pools = outcomes.map(o => parseFloat(o.pool_shares));

    // Execute CPMM sell
    const { newPools, proceeds, avgPrice } = applySell(pools, outcomeIndex, sharesToSell);

    // Update pool shares
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
        direction: 'sell',
        shares: sharesToSell,
        cost: proceeds,
        avg_price: avgPrice,
      });

    // Update position
    const newShares = parseFloat(position.shares) - sharesToSell;
    if (newShares <= 0.0001) {
      await db
        .from('user_positions')
        .update({ shares: 0, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('outcome_id', outcomeId);
    } else {
      await db
        .from('user_positions')
        .update({ shares: newShares, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('outcome_id', outcomeId);
    }

    // Credit balance
    const { data: balance } = await db
      .from('point_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const newBalance = parseFloat(balance.balance) + proceeds;

    await db
      .from('point_balances')
      .update({
        balance: Math.round(newBalance * 100) / 100,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Record transaction
    await db
      .from('point_transactions')
      .insert({
        user_id: user.id,
        amount: proceeds,
        type: 'bet_sale',
        description: `Sold ${sharesToSell.toFixed(2)} shares`,
        reference_id: outcomeId,
        balance_after: Math.round(newBalance * 100) / 100,
      });

    // Return new prices
    const newPrices = getPrices(newPools);
    const outcomePrices = outcomes.map((o, i) => ({
      id: o.id,
      price: Math.round(newPrices[i] * 10000) / 10000,
      poolShares: newPools[i],
    }));

    return res.status(200).json({
      sharesSold: sharesToSell,
      proceeds: Math.round(proceeds * 100) / 100,
      avgPrice: Math.round(avgPrice * 10000) / 10000,
      newBalance: Math.round(newBalance * 100) / 100,
      outcomes: outcomePrices,
    });
  } catch (err) {
    console.error('Sell bet error:', err);
    return res.status(500).json({ error: err.message });
  }
}
