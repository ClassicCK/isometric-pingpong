// api/admin/update-balance.js
// Admin-only: manually set a user's point balance.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const db = supabase();

  const { data: userRow } = await db
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userRow?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { userId, balance, reason } = req.body || {};

  if (!userId || balance == null) {
    return res.status(400).json({ error: 'userId and balance required' });
  }

  const newBalance = Math.round(parseFloat(balance) * 100) / 100;

  try {
    // Get current balance
    const { data: current } = await db
      .from('point_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!current) {
      // Create if doesn't exist
      await db
        .from('point_balances')
        .insert({
          user_id: userId,
          balance: newBalance,
          total_earned: newBalance,
          total_wagered: 0,
        });
    } else {
      const diff = newBalance - parseFloat(current.balance);
      const newTotalEarned = diff > 0
        ? parseFloat(current.balance) + diff // only increase total_earned if adding
        : undefined;

      const updateData = {
        balance: newBalance,
        updated_at: new Date().toISOString(),
      };
      // Only update total_earned if we're adding points
      if (newTotalEarned !== undefined && diff > 0) {
        // Fetch current total_earned
        const { data: full } = await db
          .from('point_balances')
          .select('total_earned')
          .eq('user_id', userId)
          .single();
        updateData.total_earned = Math.round((parseFloat(full?.total_earned || 0) + diff) * 100) / 100;
      }

      await db
        .from('point_balances')
        .update(updateData)
        .eq('user_id', userId);
    }

    // Record transaction
    const oldBalance = current ? parseFloat(current.balance) : 0;
    const diff = newBalance - oldBalance;

    await db
      .from('point_transactions')
      .insert({
        user_id: userId,
        amount: diff,
        type: 'initial_grant',
        description: reason || `Admin adjustment`,
        balance_after: newBalance,
      });

    return res.status(200).json({ userId, newBalance });
  } catch (err) {
    console.error('Update balance error:', err);
    return res.status(500).json({ error: err.message });
  }
}
