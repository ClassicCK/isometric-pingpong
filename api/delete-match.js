// api/delete-match.js
// Atomic match deletion — fetches latest state, removes match, recalculates all ELO, writes back with retry

import { atomicUpdate, calculateELO, calculateRankChanges, setCorsHeaders, validateEnv } from './_lib/github.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { matchId } = req.body;

  if (!matchId) {
    return res.status(400).json({ error: 'Missing matchId' });
  }

  try {
    const result = await atomicUpdate(({ players, matches }) => {
      const matchExists = matches.find(m => m.id === matchId);
      if (!matchExists) {
        throw new Error('Match not found');
      }

      // Remove the match
      const updatedMatches = matches.filter(m => m.id !== matchId);

      // Sort remaining matches chronologically for replay
      const sortedMatches = [...updatedMatches].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Reset all players to base ELO
      let recalculatedPlayers = players.map(p => ({
        ...p,
        elo: 1500,
        wins: 0,
        losses: 0,
        eloHistory: [{ elo: 1500, timestamp: p.joinedAt }],
      }));

      // Replay all remaining matches in chronological order
      sortedMatches.forEach(match => {
        const winner = recalculatedPlayers.find(p => p.id === match.winnerId);
        const loser = recalculatedPlayers.find(p => p.id === match.loserId);

        if (winner && loser) {
          const { winnerNew, loserNew, expectedWinProbability } = calculateELO(
            winner.elo, loser.elo, match.winnerScore, match.loserScore
          );
          match.expectedWinProbability = expectedWinProbability;

          recalculatedPlayers = recalculatedPlayers.map(p => {
            if (p.id === match.winnerId) {
              return {
                ...p,
                elo: winnerNew,
                wins: p.wins + 1,
                eloHistory: [...p.eloHistory, { elo: winnerNew, timestamp: match.timestamp }],
              };
            }
            if (p.id === match.loserId) {
              return {
                ...p,
                elo: loserNew,
                losses: p.losses + 1,
                eloHistory: [...p.eloHistory, { elo: loserNew, timestamp: match.timestamp }],
              };
            }
            return p;
          });
        }
      });

      const playersWithRanks = calculateRankChanges(recalculatedPlayers);

      return { players: playersWithRanks, matches: updatedMatches };
    });

    return res.status(200).json({
      success: true,
      players: result.players,
      matches: result.matches,
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
}
