// api/admin/users.js
// Admin-only: list all users with balances and linked players.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

  try {
    // Fetch all users
    const { data: users } = await db
      .from('users')
      .select('id, email, display_name, player_id, is_admin, created_at')
      .order('created_at', { ascending: true });

    // Fetch all balances
    const { data: balances } = await db
      .from('point_balances')
      .select('user_id, balance, total_earned, total_wagered');

    const balanceMap = Object.fromEntries(
      (balances || []).map(b => [b.user_id, b])
    );

    // Fetch player names for linked players
    const playerIds = (users || []).filter(u => u.player_id).map(u => u.player_id);
    let playerMap = {};
    if (playerIds.length > 0) {
      const { data: players } = await db
        .from('players')
        .select('id, name, elo')
        .in('id', playerIds);
      playerMap = Object.fromEntries((players || []).map(p => [p.id, p]));
    }

    const enriched = (users || []).map(u => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      playerId: u.player_id,
      playerName: u.player_id ? playerMap[u.player_id]?.name : null,
      playerElo: u.player_id ? playerMap[u.player_id]?.elo : null,
      isAdmin: u.is_admin,
      balance: balanceMap[u.id] ? parseFloat(balanceMap[u.id].balance) : null,
      totalEarned: balanceMap[u.id] ? parseFloat(balanceMap[u.id].total_earned) : null,
      totalWagered: balanceMap[u.id] ? parseFloat(balanceMap[u.id].total_wagered) : null,
      createdAt: u.created_at,
    }));

    return res.status(200).json({ users: enriched });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ error: err.message });
  }
}
