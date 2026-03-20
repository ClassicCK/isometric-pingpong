// api/edit-player.js
// Updates player metadata in Supabase

import {
  supabase, fetchPlayersWithHistory, fetchMatches,
  setCorsHeaders, validateEnv, getAuthUser,
} from './_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const { playerId, name, countryCode, office } = req.body;

  if (!playerId) return res.status(400).json({ error: 'Missing playerId' });

  // Authorization: user can only edit their own linked player, or admin can edit any
  const db0 = supabase();
  const { data: userRow } = await db0
    .from('users')
    .select('player_id, is_admin')
    .eq('id', user.id)
    .single();

  if (!userRow?.is_admin && userRow?.player_id !== playerId) {
    return res.status(403).json({ error: 'You can only edit your own player profile.' });
  }
  if (!name || !name.trim()) return res.status(400).json({ error: 'Missing player name' });
  if (!countryCode) return res.status(400).json({ error: 'Missing country code' });
  if (!office) return res.status(400).json({ error: 'Missing office' });

  try {
    const db = supabase();

    const { error: updateError, count } = await db.from('players')
      .update({
        name: name.trim(),
        country_code: countryCode,
        office,
      })
      .eq('id', playerId);

    if (updateError) throw new Error(`Failed to update player: ${updateError.message}`);

    // Also update denormalized names in matches
    const { error: winnerNameError } = await db.from('matches')
      .update({ winner_name: name.trim() })
      .eq('winner_id', playerId);
    if (winnerNameError) console.warn('Failed to update winner names:', winnerNameError.message);

    const { error: loserNameError } = await db.from('matches')
      .update({ loser_name: name.trim() })
      .eq('loser_id', playerId);
    if (loserNameError) console.warn('Failed to update loser names:', loserNameError.message);

    const players = await fetchPlayersWithHistory();
    const matches = await fetchMatches();

    return res.status(200).json({
      success: true,
      players,
      matches,
    });
  } catch (error) {
    console.error('Error editing player:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
}
