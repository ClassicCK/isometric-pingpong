// api/orders/place.js
// Place a limit order on a market outcome. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { getPrices } from '../_lib/cpmm.js';
import { applyBuy, applySell } from '../_lib/cpmm.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { marketId, outcomeId, direction, targetPrice, amount } = req.body || {};

  // Validate inputs
  if (!marketId || !outcomeId || !direction || targetPrice == null || !amount) {
    return res.status(400).json({ error: 'marketId, outcomeId, direction, targetPrice, and amount required' });
  }

  if (direction !== 'buy' && direction !== 'sell') {
    return res.status(400).json({ error: 'direction must be "buy" or "sell"' });
  }

  const parsedTargetPrice = parseFloat(targetPrice);
  if (parsedTargetPrice < 0.01 || parsedTargetPrice > 0.99) {
    return res.status(400).json({ error: 'targetPrice must be between 0.01 and 0.99' });
  }

  const parsedAmount = parseFloat(amount);
  if (parsedAmount <= 0) {
    return res.status(400).json({ error: 'amount must be positive' });
  }

  const db = supabase();

  try {
    // Verify market is open
    const { data: market } = await db
      .from('markets')
      .select('id, status')
      .eq('id', marketId)
      .single();

    if (!market || market.status !== 'open') {
      return res.status(400).json({ error: 'Market is not open for trading' });
    }

    // Fetch all outcomes for this market
    const { data: outcomes } = await db
      .from('market_outcomes')
      .select('id, pool_shares')
      .eq('market_id', marketId)
      .order('created_at', { ascending: true });

    if (!outcomes || outcomes.length === 0) {
      return res.status(400).json({ error: 'Market has no outcomes' });
    }

    const outcomeIndex = outcomes.findIndex(o => o.id === outcomeId);
    if (outcomeIndex === -1) {
      return res.status(400).json({ error: 'Outcome not found in this market' });
    }

    const pools = outcomes.map(o => parseFloat(o.pool_shares));
    const currentPrices = getPrices(pools);
    const currentPrice = currentPrices[outcomeIndex];

    if (direction === 'buy') {
      // Check user has sufficient balance
      const { data: balance } = await db
        .from('point_balances')
        .select('balance, total_wagered')
        .eq('user_id', user.id)
        .single();

      if (!balance || parseFloat(balance.balance) < parsedAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Check if order can be filled immediately (current price <= target)
      if (currentPrice <= parsedTargetPrice) {
        // Execute immediately as a market order (buy logic from bets/place.js)
        const cost = Math.round(parsedAmount * 100) / 100;
        const { newPools, sharesReceived, avgPrice } = applyBuy(pools, outcomeIndex, cost);

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

        // Debit balance
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
            description: `Limit order filled: bought ${sharesReceived.toFixed(2)} shares`,
            reference_id: outcomeId,
            balance_after: newBalance,
          });

        const newPrices = getPrices(newPools);
        const outcomePrices = outcomes.map((o, i) => ({
          id: o.id,
          price: Math.round(newPrices[i] * 10000) / 10000,
          poolShares: newPools[i],
        }));

        return res.status(200).json({
          filled: true,
          sharesReceived: Math.round(sharesReceived * 10000) / 10000,
          cost,
          avgPrice: Math.round(avgPrice * 10000) / 10000,
          newBalance,
          outcomes: outcomePrices,
        });
      }

      // Not immediately fillable — reserve funds and create limit order
      const newBalance = Math.round((parseFloat(balance.balance) - parsedAmount) * 100) / 100;
      const newTotalWagered = Math.round((parseFloat(balance.total_wagered || 0)) * 100) / 100;

      await db
        .from('point_balances')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Record reserve transaction
      await db
        .from('point_transactions')
        .insert({
          user_id: user.id,
          amount: -parsedAmount,
          type: 'bet_purchase',
          description: 'Limit order reserve',
          reference_id: outcomeId,
          balance_after: newBalance,
        });

      // Insert limit order
      const { data: order, error: orderError } = await db
        .from('limit_orders')
        .insert({
          user_id: user.id,
          market_id: marketId,
          outcome_id: outcomeId,
          direction: 'buy',
          target_price: parsedTargetPrice,
          amount: parsedAmount,
          filled_amount: 0,
          status: 'open',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      return res.status(200).json({
        orderId: order.id,
        status: 'open',
        direction: 'buy',
        targetPrice: parsedTargetPrice,
        amount: parsedAmount,
        newBalance,
      });

    } else {
      // Sell order — check user has sufficient shares
      const { data: position } = await db
        .from('user_positions')
        .select('shares')
        .eq('user_id', user.id)
        .eq('outcome_id', outcomeId)
        .single();

      if (!position || parseFloat(position.shares) < parsedAmount) {
        return res.status(400).json({ error: 'Insufficient shares' });
      }

      // Check if order can be filled immediately (current price >= target)
      if (currentPrice >= parsedTargetPrice) {
        // Execute immediately as a market order (sell logic from bets/sell.js)
        const sharesToSell = parsedAmount;
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

        const newBalance = Math.round((parseFloat(balance.balance) + proceeds) * 100) / 100;

        await db
          .from('point_balances')
          .update({
            balance: newBalance,
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
            description: `Limit order filled: sold ${sharesToSell.toFixed(2)} shares`,
            reference_id: outcomeId,
            balance_after: newBalance,
          });

        const newPrices = getPrices(newPools);
        const outcomePrices = outcomes.map((o, i) => ({
          id: o.id,
          price: Math.round(newPrices[i] * 10000) / 10000,
          poolShares: newPools[i],
        }));

        return res.status(200).json({
          filled: true,
          sharesSold: sharesToSell,
          proceeds: Math.round(proceeds * 100) / 100,
          avgPrice: Math.round(avgPrice * 10000) / 10000,
          newBalance,
          outcomes: outcomePrices,
        });
      }

      // Not immediately fillable — create limit order (no funds to reserve for sells)
      const { data: order, error: orderError } = await db
        .from('limit_orders')
        .insert({
          user_id: user.id,
          market_id: marketId,
          outcome_id: outcomeId,
          direction: 'sell',
          target_price: parsedTargetPrice,
          amount: parsedAmount,
          filled_amount: 0,
          status: 'open',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      return res.status(200).json({
        orderId: order.id,
        status: 'open',
        direction: 'sell',
        targetPrice: parsedTargetPrice,
        amount: parsedAmount,
      });
    }
  } catch (err) {
    console.error('Place order error:', err);
    return res.status(500).json({ error: err.message });
  }
}
