// api/auth/me.js
// Returns the current authenticated user's info

import { supabase, setCorsHeaders, validateEnv } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const db = supabase();
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user profile from our users table
    const { data: profile } = await db
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return res.status(200).json({
      id: user.id,
      email: user.email,
      displayName: profile?.display_name || user.user_metadata?.full_name || user.email.split('@')[0],
      playerId: profile?.player_id || null,
      isAdmin: profile?.is_admin || false,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: error.message });
  }
}
