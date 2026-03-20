// api/record-match.js
// Records a match, updates player ELOs, and inserts elo_history rows

import {
  supabase, calculateELO, calculateRankChanges,
  fetchPlayersWithHistory, fetchMatches,
  setCorsHeaders, validateEnv, getAuthUser,
} from './_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Auth check
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const { winnerId, loserId, winnerScore, loserScore, matchDate } = req.body;

  // Authorization: user must be one of the players, or an admin
  const db0 = supabase();
  const { data: userRow } = await db0
    .from('users')
    .select('player_id, is_admin')
    .eq('id', user.id)
    .single();

  if (!userRow?.is_admin) {
    if (!userRow?.player_id || (userRow.player_id !== winnerId && userRow.player_id !== loserId)) {
      return res.status(403).json({ error: 'You can only record matches you played in.' });
    }
  }

  if (!winnerId || !loserId) {
    return res.status(400).json({ error: 'Missing winnerId or loserId' });
  }
  if (winnerId === loserId) {
    return res.status(400).json({ error: 'Winner and loser cannot be the same player' });
  }

  const winnerScoreNum = winnerScore !== null && winnerScore !== undefined ? parseInt(winnerScore, 10) : null;
  const loserScoreNum = loserScore !== null && loserScore !== undefined ? parseInt(loserScore, 10) : null;

  if (winnerScoreNum !== null && loserScoreNum !== null) {
    if (winnerScoreNum <= loserScoreNum) {
      return res.status(400).json({ error: 'Winner score must be greater than loser score' });
    }
    if (winnerScoreNum < 0 || loserScoreNum < 0) {
      return res.status(400).json({ error: 'Scores must be positive numbers' });
    }
  }

  try {
    const db = supabase();

    // Fetch current player data
    const players = await fetchPlayersWithHistory();
    const winner = players.find(p => p.id === winnerId);
    const loser = players.find(p => p.id === loserId);

    if (!winner || !loser) {
      return res.status(404).json({ error: 'Selected players not found' });
    }

    const winnerGamesPlayed = winner.wins + winner.losses;
    const loserGamesPlayed = loser.wins + loser.losses;

    const { winnerNew, loserNew, expectedWinProbability } = calculateELO(
      winner.elo, loser.elo, winnerScoreNum, loserScoreNum, winnerGamesPlayed, loserGamesPlayed
    );

    const timestamp = matchDate ? new Date(matchDate).toISOString() : new Date().toISOString();
    const matchId = Date.now().toString();

    // Insert match
    const { error: matchError } = await db.from('matches').insert({
      id: matchId,
      winner_id: winnerId,
      loser_id: loserId,
      winner_name: winner.name,
      loser_name: loser.name,
      winner_score: winnerScoreNum,
      loser_score: loserScoreNum,
      winner_elo_change: winnerNew - winner.elo,
      loser_elo_change: loserNew - loser.elo,
      expected_win_probability: expectedWinProbability,
      recorded_at: timestamp,
      recorded_by: user.id,
    });
    if (matchError) throw new Error(`Failed to insert match: ${matchError.message}`);

    // Update winner
    const { error: winnerError } = await db.from('players')
      .update({ elo: winnerNew, wins: winner.wins + 1 })
      .eq('id', winnerId);
    if (winnerError) throw new Error(`Failed to update winner: ${winnerError.message}`);

    // Update loser
    const { error: loserError } = await db.from('players')
      .update({ elo: loserNew, losses: loser.losses + 1 })
      .eq('id', loserId);
    if (loserError) throw new Error(`Failed to update loser: ${loserError.message}`);

    // Insert elo_history for both players
    const { error: historyError } = await db.from('elo_history').insert([
      { player_id: winnerId, elo: winnerNew, match_id: matchId, recorded_at: timestamp },
      { player_id: loserId, elo: loserNew, match_id: matchId, recorded_at: timestamp },
    ]);
    if (historyError) throw new Error(`Failed to insert elo_history: ${historyError.message}`);

    // Calculate rank changes and update last_week_rank
    const updatedPlayers = players.map(p => {
      if (p.id === winnerId) {
        return { ...p, elo: winnerNew, wins: p.wins + 1, eloHistory: [...p.eloHistory, { elo: winnerNew, timestamp }] };
      }
      if (p.id === loserId) {
        return { ...p, elo: loserNew, losses: p.losses + 1, eloHistory: [...p.eloHistory, { elo: loserNew, timestamp }] };
      }
      return p;
    });
    const playersWithRanks = calculateRankChanges(updatedPlayers);

    // Batch update last_week_rank
    for (const p of playersWithRanks) {
      await db.from('players').update({ last_week_rank: p.lastWeekRank }).eq('id', p.id);
    }

    // Return updated data in the same shape the frontend expects
    const allMatches = await fetchMatches();

    return res.status(200).json({
      success: true,
      players: playersWithRanks,
      matches: allMatches,
    });
  } catch (error) {
    console.error('Error recording match:', error);
    return res.status(500).json({ error: error.message });
  }
}
