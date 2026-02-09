// api/record-match.js
// Atomic match recording — fetches latest state, applies match, writes back with retry

import { atomicUpdate, calculateELO, calculateRankChanges, setCorsHeaders, validateEnv } from './_lib/github.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!validateEnv()) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { winnerId, loserId, winnerScore, loserScore, matchDate } = req.body;

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
    const result = await atomicUpdate(({ players, matches }) => {
      const winner = players.find(p => p.id === winnerId);
      const loser = players.find(p => p.id === loserId);

      if (!winner || !loser) {
        throw new Error('Selected players not found in current data');
      }

      const winnerGamesPlayed = winner.wins + winner.losses;
      const loserGamesPlayed = loser.wins + loser.losses;

      const { winnerNew, loserNew, expectedWinProbability } = calculateELO(
        winner.elo, loser.elo, winnerScoreNum, loserScoreNum, winnerGamesPlayed, loserGamesPlayed
      );

      const timestamp = matchDate ? new Date(matchDate).toISOString() : new Date().toISOString();

      const updatedPlayers = players.map(p => {
        if (p.id === winnerId) {
          return {
            ...p,
            elo: winnerNew,
            wins: p.wins + 1,
            eloHistory: [...p.eloHistory, { elo: winnerNew, timestamp }],
          };
        }
        if (p.id === loserId) {
          return {
            ...p,
            elo: loserNew,
            losses: p.losses + 1,
            eloHistory: [...p.eloHistory, { elo: loserNew, timestamp }],
          };
        }
        return { ...p };
      });

      const playersWithRanks = calculateRankChanges(updatedPlayers);

      const newMatch = {
        id: Date.now().toString(),
        winnerId,
        loserId,
        winner: winner.name,
        loser: loser.name,
        winnerScore: winnerScoreNum,
        loserScore: loserScoreNum,
        winnerEloChange: winnerNew - winner.elo,
        loserEloChange: loserNew - loser.elo,
        expectedWinProbability,
        timestamp,
      };

      const updatedMatches = [newMatch, ...matches];

      return { players: playersWithRanks, matches: updatedMatches };
    });

    return res.status(200).json({
      success: true,
      players: result.players,
      matches: result.matches,
    });
  } catch (error) {
    console.error('Error recording match:', error);
    return res.status(500).json({ error: error.message });
  }
}
