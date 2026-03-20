// api/load-data.js
// Fetches all players and matches from Supabase, returns same shape as before

import { fetchPlayersWithHistory, fetchMatches, setCorsHeaders, validateEnv } from './_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const [players, matches] = await Promise.all([
      fetchPlayersWithHistory(),
      fetchMatches(),
    ]);

    return res.status(200).json({
      players,
      matches,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error loading data:', error);
    return res.status(500).json({ error: error.message });
  }
}
