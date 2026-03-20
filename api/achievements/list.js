// api/achievements/list.js
// GET endpoint — returns achievements for a player (or the authenticated user)
// No auth required for viewing others' achievements.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { ACHIEVEMENTS, getAchievementDef } from './definitions.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();

  try {
    let targetUserId = null;
    let playerName = null;

    const { playerId } = req.query || {};

    if (playerId) {
      // Look up the user linked to this player
      const { data: userRow } = await db
        .from('users')
        .select('id')
        .eq('player_id', playerId)
        .single();

      if (!userRow) {
        return res.status(404).json({ error: 'No user found for that player' });
      }
      targetUserId = userRow.id;

      // Get player name
      const { data: playerRow } = await db
        .from('players')
        .select('name')
        .eq('id', playerId)
        .single();

      playerName = playerRow?.name || null;
    } else {
      // Fall back to authenticated user
      const user = await getAuthUser(req);
      if (!user) {
        return res.status(400).json({ error: 'Provide playerId query param or authenticate' });
      }
      targetUserId = user.id;

      // Get player name via user row
      const { data: userRow } = await db
        .from('users')
        .select('player_id')
        .eq('id', user.id)
        .single();

      if (userRow?.player_id) {
        const { data: playerRow } = await db
          .from('players')
          .select('name')
          .eq('id', userRow.player_id)
          .single();

        playerName = playerRow?.name || null;
      }
    }

    // Fetch awarded achievements
    const { data: awarded, error } = await db
      .from('user_achievements')
      .select('achievement_key, awarded_at')
      .eq('user_id', targetUserId)
      .order('awarded_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch achievements: ${error.message}`);

    // Enrich with definitions
    const achievements = (awarded || []).map(row => {
      const def = getAchievementDef(row.achievement_key);
      return {
        key: row.achievement_key,
        name: def?.name || row.achievement_key,
        description: def?.description || '',
        icon: def?.icon || '',
        category: def?.category || 'unknown',
        awardedAt: row.awarded_at,
      };
    });

    return res.status(200).json({ achievements, playerName });
  } catch (err) {
    console.error('Achievement list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
