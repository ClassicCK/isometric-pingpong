// api/recalculate-elo.js
// One-time endpoint to replay all matches with the updated K-factor formula
// Call POST /api/recalculate-elo after deploying K-factor changes to recalculate all historical ELO

import { atomicUpdate, calculateELO, calculateRankChanges, setCorsHeaders, validateEnv } from './_lib/github.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const result = await atomicUpdate(({ players, matches }) => {
      // Sort all matches chronologically for replay
      const sortedMatches = [...matches].sort(
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

      // Replay all matches in chronological order with new K-factor formula
      sortedMatches.forEach(match => {
        const winner = recalculatedPlayers.find(p => p.id === match.winnerId);
        const loser = recalculatedPlayers.find(p => p.id === match.loserId);

        if (winner && loser) {
          const winnerGamesPlayed = winner.wins + winner.losses;
          const loserGamesPlayed = loser.wins + loser.losses;

          const { winnerNew, loserNew, expectedWinProbability } = calculateELO(
            winner.elo, loser.elo, match.winnerScore, match.loserScore, winnerGamesPlayed, loserGamesPlayed
          );
          match.expectedWinProbability = expectedWinProbability;
          match.winnerEloChange = winnerNew - winner.elo;
          match.loserEloChange = loserNew - loser.elo;

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

      return { players: playersWithRanks, matches: sortedMatches };
    });

    return res.status(200).json({
      success: true,
      message: `Recalculated ELO for ${result.players.length} players across ${result.matches.length} matches`,
      players: result.players,
      matches: result.matches,
    });
  } catch (error) {
    console.error('Error recalculating ELO:', error);
    return res.status(500).json({ error: error.message });
  }
}
