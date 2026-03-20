// api/points/initialize.js
// Initialize a user's Hall of Fame point balance based on their ELO ranking.
// Called automatically on first visit to markets, or manually.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const db = supabase();

  try {
    // Check if user already has a balance
    const { data: existing } = await db
      .from('point_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return res.status(200).json({
        balance: parseFloat(existing.balance),
        totalEarned: parseFloat(existing.total_earned),
        totalWagered: parseFloat(existing.total_wagered),
        alreadyInitialized: true,
      });
    }

    // Look up user's linked player
    const { data: userRow } = await db
      .from('users')
      .select('player_id')
      .eq('id', user.id)
      .single();

    let allocation = 1000; // Base allocation for everyone

    if (userRow?.player_id) {
      // Fetch all players sorted by ELO to determine rank
      const { data: allPlayers } = await db
        .from('players')
        .select('id, elo')
        .order('elo', { ascending: false });

      if (allPlayers && allPlayers.length > 0) {
        const rank = allPlayers.findIndex(p => p.id === userRow.player_id) + 1;
        if (rank > 0) {
          // Rank bonus: higher rank = more points
          const rankBonus = (allPlayers.length - rank + 1) * 10;
          allocation += rankBonus;
        }
      }
    }

    // Create balance
    const { error: balanceError } = await db
      .from('point_balances')
      .insert({
        user_id: user.id,
        balance: allocation,
        total_earned: allocation,
        total_wagered: 0,
      });

    if (balanceError) throw balanceError;

    // Record transaction
    const { error: txError } = await db
      .from('point_transactions')
      .insert({
        user_id: user.id,
        amount: allocation,
        type: 'initial_grant',
        description: `Initial Hall of Fame point allocation`,
        balance_after: allocation,
      });

    if (txError) console.error('Failed to record transaction:', txError);

    return res.status(200).json({
      balance: allocation,
      totalEarned: allocation,
      totalWagered: 0,
      alreadyInitialized: false,
    });
  } catch (err) {
    console.error('Initialize points error:', err);
    return res.status(500).json({ error: err.message });
  }
}
