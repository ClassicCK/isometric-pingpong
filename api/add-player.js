// api/add-player.js
// Adds a new player to Supabase

import {
  supabase, calculateRankChanges, fetchPlayersWithHistory, fetchMatches,
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

  const { name, countryCode, office } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Missing player name' });
  }
  if (!countryCode) {
    return res.status(400).json({ error: 'Missing country code' });
  }
  if (!office) {
    return res.status(400).json({ error: 'Missing office' });
  }

  try {
    const db = supabase();
    const trimmedName = name.trim();
    const now = new Date().toISOString();
    const playerId = Date.now().toString();

    // Check for duplicate names
    const { data: existing } = await db
      .from('players')
      .select('name')
      .ilike('name', trimmedName)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: `A player named "${existing[0].name}" already exists` });
    }

    // Insert player
    const { error: insertError } = await db.from('players').insert({
      id: playerId,
      name: trimmedName,
      country_code: countryCode,
      office,
      elo: 1500,
      wins: 0,
      losses: 0,
      joined_at: now,
      last_week_rank: null,
    });
    if (insertError) throw new Error(`Failed to add player: ${insertError.message}`);

    // Insert initial elo_history entry
    const { error: historyError } = await db.from('elo_history').insert({
      player_id: playerId,
      elo: 1500,
      recorded_at: now,
    });
    if (historyError) throw new Error(`Failed to insert elo_history: ${historyError.message}`);

    // Fetch updated data and calculate ranks
    const players = await fetchPlayersWithHistory();
    const playersWithRanks = calculateRankChanges(players);
    const matches = await fetchMatches();

    return res.status(200).json({
      success: true,
      players: playersWithRanks,
      matches,
    });
  } catch (error) {
    console.error('Error adding player:', error);
    const status = error.message.includes('already exists') ? 409 : 500;
    return res.status(status).json({ error: error.message });
  }
}
