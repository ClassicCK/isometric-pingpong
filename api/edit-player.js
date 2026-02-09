// api/edit-player.js
// Atomic player edit — fetches latest state, updates player, writes back with retry

import { atomicUpdate, setCorsHeaders, validateEnv } from './_lib/github.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { playerId, name, countryCode, office } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'Missing playerId' });
  }
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
    const result = await atomicUpdate(({ players, matches }) => {
      const player = players.find(p => p.id === playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      const updatedPlayers = players.map(p =>
        p.id === playerId
          ? { ...p, name: name.trim(), countryCode, office }
          : p
      );

      return { players: updatedPlayers, matches };
    });

    return res.status(200).json({
      success: true,
      players: result.players,
      matches: result.matches,
    });
  } catch (error) {
    console.error('Error editing player:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
}
