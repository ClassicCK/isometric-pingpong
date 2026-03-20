// api/markets/resolve.js
// Admin-only: resolve a market (pick winner) or void it (refund all).

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const db = supabase();

  // Check admin
  const { data: userRow } = await db
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userRow?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { marketId, winningOutcomeId, void: voidMarket } = req.body || {};

  if (!marketId) return res.status(400).json({ error: 'marketId required' });
  if (!voidMarket && !winningOutcomeId) return res.status(400).json({ error: 'winningOutcomeId or void required' });

  try {
    // Verify market exists and is open/closed
    const { data: market } = await db
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (!market) return res.status(404).json({ error: 'Market not found' });
    if (market.status === 'resolved' || market.status === 'voided') {
      return res.status(400).json({ error: 'Market already resolved or voided' });
    }

    if (voidMarket) {
      // Void: refund all users at their cost basis
      const { data: positions } = await db
        .from('user_positions')
        .select('*')
        .eq('market_id', marketId)
        .gt('shares', 0);

      for (const pos of (positions || [])) {
        const refundAmount = parseFloat(pos.shares) * parseFloat(pos.avg_cost_basis);
        if (refundAmount <= 0) continue;

        // Get current balance
        const { data: bal } = await db
          .from('point_balances')
          .select('balance')
          .eq('user_id', pos.user_id)
          .single();

        const newBalance = parseFloat(bal?.balance || 0) + refundAmount;

        await db
          .from('point_balances')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', pos.user_id);

        await db
          .from('point_transactions')
          .insert({
            user_id: pos.user_id,
            amount: refundAmount,
            type: 'market_refund',
            description: `Refund for voided market: ${market.title}`,
            reference_id: marketId,
            balance_after: newBalance,
          });
      }

      await db
        .from('markets')
        .update({ status: 'voided', resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', marketId);

      return res.status(200).json({ status: 'voided', refunded: (positions || []).length });
    }

    // Resolve with a winner
    // Mark winning outcome
    await db
      .from('market_outcomes')
      .update({ is_winner: false })
      .eq('market_id', marketId);

    await db
      .from('market_outcomes')
      .update({ is_winner: true })
      .eq('id', winningOutcomeId);

    // Pay out winning shareholders: each share = 1 point
    const { data: winningPositions } = await db
      .from('user_positions')
      .select('*')
      .eq('outcome_id', winningOutcomeId)
      .gt('shares', 0);

    let totalPaidOut = 0;

    for (const pos of (winningPositions || [])) {
      const payout = parseFloat(pos.shares); // 1 point per share

      const { data: bal } = await db
        .from('point_balances')
        .select('balance, total_earned')
        .eq('user_id', pos.user_id)
        .single();

      const newBalance = parseFloat(bal?.balance || 0) + payout;
      const newTotalEarned = parseFloat(bal?.total_earned || 0) + payout;

      await db
        .from('point_balances')
        .update({
          balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', pos.user_id);

      await db
        .from('point_transactions')
        .insert({
          user_id: pos.user_id,
          amount: payout,
          type: 'market_payout',
          description: `Payout for "${market.title}"`,
          reference_id: marketId,
          balance_after: newBalance,
        });

      totalPaidOut += payout;
    }

    await db
      .from('markets')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', marketId);

    return res.status(200).json({
      status: 'resolved',
      winningOutcomeId,
      payouts: (winningPositions || []).length,
      totalPaidOut,
    });
  } catch (err) {
    console.error('Resolve market error:', err);
    return res.status(500).json({ error: err.message });
  }
}
