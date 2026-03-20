// api/delete-match.js
// Deletes a match and replays all remaining matches to recalculate ELOs

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

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const { matchId } = req.body;

  if (!matchId) {
    return res.status(400).json({ error: 'Missing matchId' });
  }

  try {
    const db = supabase();

    // Verify match exists
    const { data: existingMatch, error: fetchError } = await db
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .single();
    if (fetchError || !existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Delete the match
    const { error: deleteError } = await db.from('matches').delete().eq('id', matchId);
    if (deleteError) throw new Error(`Failed to delete match: ${deleteError.message}`);

    // Fetch all remaining matches in chronological order
    const { data: remainingMatches, error: matchesError } = await db
      .from('matches')
      .select('*')
      .order('recorded_at', { ascending: true });
    if (matchesError) throw new Error(`Failed to fetch matches: ${matchesError.message}`);

    // Fetch all players
    const { data: dbPlayers, error: playersError } = await db.from('players').select('*');
    if (playersError) throw new Error(`Failed to fetch players: ${playersError.message}`);

    // Reset all players to base ELO
    let recalculatedPlayers = dbPlayers.map(p => ({
      id: p.id,
      name: p.name,
      countryCode: p.country_code,
      office: p.office,
      elo: 1500,
      wins: 0,
      losses: 0,
      joinedAt: p.joined_at,
      lastWeekRank: null,
      eloHistory: [{ elo: 1500, timestamp: p.joined_at }],
    }));

    // Replay all remaining matches in chronological order
    const updatedMatchData = [];
    for (const match of remainingMatches) {
      const winner = recalculatedPlayers.find(p => p.id === match.winner_id);
      const loser = recalculatedPlayers.find(p => p.id === match.loser_id);

      if (winner && loser) {
        const winnerGamesPlayed = winner.wins + winner.losses;
        const loserGamesPlayed = loser.wins + loser.losses;

        const { winnerNew, loserNew, expectedWinProbability } = calculateELO(
          winner.elo, loser.elo, match.winner_score, match.loser_score, winnerGamesPlayed, loserGamesPlayed
        );

        recalculatedPlayers = recalculatedPlayers.map(p => {
          if (p.id === match.winner_id) {
            return {
              ...p,
              elo: winnerNew,
              wins: p.wins + 1,
              eloHistory: [...p.eloHistory, { elo: winnerNew, timestamp: match.recorded_at }],
            };
          }
          if (p.id === match.loser_id) {
            return {
              ...p,
              elo: loserNew,
              losses: p.losses + 1,
              eloHistory: [...p.eloHistory, { elo: loserNew, timestamp: match.recorded_at }],
            };
          }
          return p;
        });

        updatedMatchData.push({
          id: match.id,
          expected_win_probability: expectedWinProbability,
          winner_elo_change: winnerNew - (winner.elo),
          loser_elo_change: loserNew - (loser.elo),
        });
      }
    }

    const playersWithRanks = calculateRankChanges(recalculatedPlayers);

    // Batch update players in DB
    for (const p of playersWithRanks) {
      await db.from('players').update({
        elo: p.elo,
        wins: p.wins,
        losses: p.losses,
        last_week_rank: p.lastWeekRank,
      }).eq('id', p.id);
    }

    // Update match ELO data
    for (const m of updatedMatchData) {
      await db.from('matches').update({
        expected_win_probability: m.expected_win_probability,
        winner_elo_change: m.winner_elo_change,
        loser_elo_change: m.loser_elo_change,
      }).eq('id', m.id);
    }

    // Rebuild elo_history table
    await db.from('elo_history').delete().neq('id', 0); // delete all rows

    const historyRows = [];
    for (const p of playersWithRanks) {
      for (const h of p.eloHistory) {
        historyRows.push({
          player_id: p.id,
          elo: h.elo,
          recorded_at: h.timestamp,
        });
      }
    }

    for (let i = 0; i < historyRows.length; i += 500) {
      const chunk = historyRows.slice(i, i + 500);
      await db.from('elo_history').insert(chunk);
    }

    // Return updated data
    const allMatches = await fetchMatches();

    return res.status(200).json({
      success: true,
      players: playersWithRanks,
      matches: allMatches,
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
}
