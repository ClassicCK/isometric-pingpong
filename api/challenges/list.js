// api/challenges/list.js
// List challenges. Public for all pending, auth required for personal view.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();
  const scope = req.query?.scope || 'all';

  try {
    let challenges;

    if (scope === 'mine') {
      // Auth required for personal challenges
      const user = await getAuthUser(req);
      if (!user) return res.status(401).json({ error: 'Authentication required for scope=mine' });

      const { data, error } = await db
        .from('challenges')
        .select(`
          id, challenger_id, challenged_id, message, status, created_at, expires_at, market_id,
          challenger:players!challenges_challenger_id_fkey(id, name, office, elo),
          challenged:players!challenges_challenged_id_fkey(id, name, office, elo)
        `)
        .or(`challenger_user_id.eq.${user.id},challenged_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      challenges = data;
    } else {
      // Public: all pending + accepted challenges
      const { data, error } = await db
        .from('challenges')
        .select(`
          id, challenger_id, challenged_id, message, status, created_at, expires_at, market_id,
          challenger:players!challenges_challenger_id_fkey(id, name, office, elo),
          challenged:players!challenges_challenged_id_fkey(id, name, office, elo)
        `)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      challenges = data;
    }

    // Format response
    const formatted = (challenges || []).map(c => ({
      id: c.id,
      challenger: {
        id: c.challenger?.id,
        name: c.challenger?.name,
        office: c.challenger?.office,
        elo: c.challenger?.elo,
      },
      challenged: {
        id: c.challenged?.id,
        name: c.challenged?.name,
        office: c.challenged?.office,
        elo: c.challenged?.elo,
      },
      message: c.message,
      status: c.status,
      createdAt: c.created_at,
      expiresAt: c.expires_at,
      marketId: c.market_id || null,
    }));

    return res.status(200).json({ challenges: formatted });
  } catch (err) {
    console.error('List challenges error:', err);
    return res.status(500).json({ error: err.message });
  }
}
