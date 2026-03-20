// api/auth/claim-player.js
// Link the authenticated user to an existing player, or create a new player and link.
// Prevents two users from claiming the same player.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const db = supabase();

  const { playerId, createNew, name, countryCode, office } = req.body || {};

  try {
    // Check if user already has a linked player
    const { data: userRow } = await db
      .from('users')
      .select('player_id')
      .eq('id', user.id)
      .single();

    if (userRow?.player_id) {
      return res.status(400).json({ error: 'You already have a linked player profile' });
    }

    let linkedPlayerId;

    if (createNew) {
      // Create a new player
      if (!name?.trim() || !countryCode || !office) {
        return res.status(400).json({ error: 'Name, country, and office are required to create a player' });
      }

      // Check name uniqueness
      const { data: existing } = await db
        .from('players')
        .select('id')
        .eq('name', name.trim())
        .single();

      if (existing) {
        return res.status(400).json({ error: 'A player with that name already exists. Try claiming them instead.' });
      }

      // Generate an ID
      const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const { error: insertError } = await db
        .from('players')
        .insert({
          id,
          name: name.trim(),
          country_code: countryCode,
          office,
          elo: 1500,
          wins: 0,
          losses: 0,
        });

      if (insertError) throw insertError;

      // Insert initial ELO history entry
      await db
        .from('elo_history')
        .insert({
          player_id: id,
          elo: 1500,
          recorded_at: new Date().toISOString(),
        });

      linkedPlayerId = id;
    } else {
      // Claim an existing player
      if (!playerId) {
        return res.status(400).json({ error: 'playerId is required' });
      }

      // Check the player exists
      const { data: player } = await db
        .from('players')
        .select('id, name')
        .eq('id', playerId)
        .single();

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Check no one else has claimed this player
      const { data: claimedBy } = await db
        .from('users')
        .select('id')
        .eq('player_id', playerId)
        .single();

      if (claimedBy) {
        return res.status(400).json({ error: 'This player has already been claimed by another account' });
      }

      linkedPlayerId = playerId;
    }

    // Link the user to the player
    const { error: updateError } = await db
      .from('users')
      .update({ player_id: linkedPlayerId })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Fetch the linked player info to return
    const { data: linkedPlayer } = await db
      .from('players')
      .select('id, name, country_code, office, elo, wins, losses')
      .eq('id', linkedPlayerId)
      .single();

    return res.status(200).json({
      playerId: linkedPlayerId,
      player: linkedPlayer ? {
        id: linkedPlayer.id,
        name: linkedPlayer.name,
        countryCode: linkedPlayer.country_code,
        office: linkedPlayer.office,
        elo: linkedPlayer.elo,
        wins: linkedPlayer.wins,
        losses: linkedPlayer.losses,
      } : null,
    });
  } catch (err) {
    console.error('Claim player error:', err);
    return res.status(500).json({ error: err.message });
  }
}
