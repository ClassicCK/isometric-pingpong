// api/head-to-head.js
// Returns head-to-head rivalry stats between two players

import { supabase, setCorsHeaders } from './_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { player1, player2 } = req.query;
  if (!player1 || !player2) {
    return res.status(400).json({ error: 'Missing player1 or player2 query parameters' });
  }
  if (player1 === player2) {
    return res.status(400).json({ error: 'player1 and player2 must be different' });
  }

  try {
    const db = supabase();

    // 1. Fetch both players
    const { data: players, error: playersError } = await db
      .from('players')
      .select('id, name, country_code, office, elo, wins, losses')
      .in('id', [player1, player2]);

    if (playersError) {
      return res.status(500).json({ error: `Failed to fetch players: ${playersError.message}` });
    }
    if (!players || players.length < 2) {
      return res.status(404).json({ error: 'One or both players not found' });
    }

    const p1 = players.find(p => p.id === player1);
    const p2 = players.find(p => p.id === player2);

    // 2. Fetch all matches between them, ordered by recorded_at ascending
    const { data: matches, error: matchesError } = await db
      .from('matches')
      .select('id, winner_id, loser_id, winner_score, loser_score, winner_elo_change, loser_elo_change, recorded_at')
      .or(
        `and(winner_id.eq.${player1},loser_id.eq.${player2}),and(winner_id.eq.${player2},loser_id.eq.${player1})`
      )
      .order('recorded_at', { ascending: true });

    if (matchesError) {
      return res.status(500).json({ error: `Failed to fetch matches: ${matchesError.message}` });
    }

    // 3. Fetch ELO history for both players
    const { data: eloHistory, error: eloError } = await db
      .from('elo_history')
      .select('player_id, elo, recorded_at')
      .in('player_id', [player1, player2])
      .order('recorded_at', { ascending: true });

    if (eloError) {
      return res.status(500).json({ error: `Failed to fetch elo_history: ${eloError.message}` });
    }

    // Group elo history by player
    const eloByPlayer = { [player1]: [], [player2]: [] };
    for (const h of eloHistory) {
      if (eloByPlayer[h.player_id]) {
        eloByPlayer[h.player_id].push({ elo: h.elo, recordedAt: h.recorded_at });
      }
    }

    // Helper: find ELO closest to a given timestamp for a player
    function findEloAtTime(playerId, timestamp) {
      const history = eloByPlayer[playerId];
      if (!history || history.length === 0) return null;

      const matchTime = new Date(timestamp).getTime();
      let closest = history[0];
      let closestDiff = Math.abs(new Date(closest.recordedAt).getTime() - matchTime);

      for (const entry of history) {
        const diff = Math.abs(new Date(entry.recordedAt).getTime() - matchTime);
        if (diff < closestDiff) {
          closest = entry;
          closestDiff = diff;
        }
      }
      return closest.elo;
    }

    // 4. Compute stats
    let p1Wins = 0;
    let p2Wins = 0;
    let p1TotalMargin = 0;
    let p2TotalMargin = 0;

    const matchesFormatted = matches.map(m => {
      const margin = m.winner_score - m.loser_score;
      if (m.winner_id === player1) {
        p1Wins++;
        p1TotalMargin += margin;
      } else {
        p2Wins++;
        p2TotalMargin += margin;
      }

      return {
        id: m.id,
        winnerId: m.winner_id,
        loserId: m.loser_id,
        winnerScore: m.winner_score,
        loserScore: m.loser_score,
        winnerEloChange: m.winner_elo_change,
        loserEloChange: m.loser_elo_change,
        recordedAt: m.recorded_at,
        p1Elo: findEloAtTime(player1, m.recorded_at),
        p2Elo: findEloAtTime(player2, m.recorded_at),
      };
    });

    // Current win streak: who won the last N consecutive H2H matches
    let currentStreak = { playerId: null, count: 0 };
    if (matches.length > 0) {
      const lastWinner = matches[matches.length - 1].winner_id;
      let count = 0;
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i].winner_id === lastWinner) {
          count++;
        } else {
          break;
        }
      }
      currentStreak = { playerId: lastWinner, count };
    }

    // Average margin of victory
    const p1AvgMargin = p1Wins > 0 ? Math.round((p1TotalMargin / p1Wins) * 100) / 100 : 0;
    const p2AvgMargin = p2Wins > 0 ? Math.round((p2TotalMargin / p2Wins) * 100) / 100 : 0;

    // 5. Fetch challenges between these two players
    let challengesFormatted = [];
    try {
      const { data: challenges } = await db
        .from('challenges')
        .select('id, challenger_id, challenged_id, message, status, created_at, responded_at, market_id')
        .or(
          `and(challenger_id.eq.${player1},challenged_id.eq.${player2}),and(challenger_id.eq.${player2},challenged_id.eq.${player1})`
        )
        .order('created_at', { ascending: false })
        .limit(20);

      challengesFormatted = (challenges || []).map(c => ({
        id: c.id,
        challengerId: c.challenger_id,
        challengedId: c.challenged_id,
        message: c.message,
        status: c.status,
        createdAt: c.created_at,
        respondedAt: c.responded_at,
        marketId: c.market_id || null,
      }));
    } catch (e) {
      // challenges table might not exist yet — gracefully skip
      console.error('Failed to fetch challenges for H2H:', e);
    }

    return res.status(200).json({
      player1: {
        id: p1.id,
        name: p1.name,
        elo: p1.elo,
        office: p1.office,
        countryCode: p1.country_code,
        wins: p1.wins,
        losses: p1.losses,
      },
      player2: {
        id: p2.id,
        name: p2.name,
        elo: p2.elo,
        office: p2.office,
        countryCode: p2.country_code,
        wins: p2.wins,
        losses: p2.losses,
      },
      h2h: {
        p1Wins,
        p2Wins,
        currentStreak,
        matches: matchesFormatted,
        p1AvgMargin,
        p2AvgMargin,
      },
      challenges: challengesFormatted,
    });
  } catch (error) {
    console.error('Error fetching head-to-head data:', error);
    return res.status(500).json({ error: error.message });
  }
}
