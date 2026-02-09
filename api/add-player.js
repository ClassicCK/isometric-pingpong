// api/add-player.js
// Atomic player addition — fetches latest state, adds player, writes back with retry

import { atomicUpdate, calculateRankChanges, setCorsHeaders, validateEnv } from './_lib/github.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
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
    const result = await atomicUpdate(({ players, matches }) => {
      // Check for duplicate names
      const trimmedName = name.trim();
      const duplicate = players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
      if (duplicate) {
        throw new Error(`A player named "${duplicate.name}" already exists`);
      }

      const newPlayer = {
        id: Date.now().toString(),
        name: trimmedName,
        countryCode,
        office,
        elo: 1500,
        wins: 0,
        losses: 0,
        eloHistory: [{ elo: 1500, timestamp: new Date().toISOString() }],
        joinedAt: new Date().toISOString(),
        lastWeekRank: null,
      };

      const updatedPlayers = calculateRankChanges([...players, newPlayer]);

      return { players: updatedPlayers, matches };
    });

    return res.status(200).json({
      success: true,
      players: result.players,
      matches: result.matches,
    });
  } catch (error) {
    console.error('Error adding player:', error);
    const status = error.message.includes('already exists') ? 409 : 500;
    return res.status(status).json({ error: error.message });
  }
}
