// api/_lib/supabase.js
// Shared utilities for Supabase data operations + ELO calculation

import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey);
}

// Lazily initialized singleton
let _supabase = null;
export function supabase() {
  if (!_supabase) {
    _supabase = getSupabaseClient();
  }
  return _supabase;
}

// Validate that required env vars are present
export function validateEnv() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// CORS helper for all endpoints
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Verify auth token and return user (or null if invalid/missing)
export async function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// K-factor based on games played — new players converge fast, veterans are stable
export function getKFactor(gamesPlayed) {
  if (gamesPlayed < 5) return 40;
  if (gamesPlayed < 15) return 32;
  if (gamesPlayed < 30) return 24;
  return 20;
}

// ELO calculation — must be identical to the client-side version in App.jsx
export function calculateELO(winnerELO, loserELO, winnerScoreVal = null, loserScoreVal = null, winnerGamesPlayed = 0, loserGamesPlayed = 0) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerELO - loserELO) / 400));

  // Use the less experienced player's K-factor so new player matches have fair impact
  const K = getKFactor(Math.min(winnerGamesPlayed, loserGamesPlayed));

  let adjustedK = K;
  if (winnerScoreVal !== null && loserScoreVal !== null) {
    const scoreDiff = winnerScoreVal - loserScoreVal;
    const movMultiplier = Math.log(Math.abs(scoreDiff) + 1) * (2.2 / ((winnerELO - loserELO) * 0.001 + 2.2));
    adjustedK = K * (1 + movMultiplier * 0.5);
    adjustedK = Math.min(adjustedK, K * 1.75);
    adjustedK = Math.max(adjustedK, K * 0.5);
  }

  // Asymmetric K: winners gain slightly more than losers drop (1.1x / 0.9x)
  // Incentivises playing — top players aren't punished for taking on lower opponents
  const winnerK = adjustedK * 1.1;
  const loserK = adjustedK * 0.9;

  return {
    winnerNew: Math.round(winnerELO + winnerK * (1 - expectedWinner)),
    loserNew: Math.round(loserELO + loserK * (0 - expectedLoser)),
    kFactorUsed: adjustedK,
    expectedWinProbability: expectedWinner,
  };
}

// Calculate rank changes (last week's rank) — must match App.jsx
export function calculateRankChanges(updatedPlayers) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return updatedPlayers.map((player) => {
    const weekAgoHistory = player.eloHistory.filter((h) => new Date(h.timestamp) <= oneWeekAgo);
    const weekAgoELO = weekAgoHistory.length > 0 ? weekAgoHistory[weekAgoHistory.length - 1].elo : player.eloHistory[0]?.elo || 1500;

    const weekAgoRankings = updatedPlayers.map((p) => {
      const pWeekAgoHistory = p.eloHistory.filter((h) => new Date(h.timestamp) <= oneWeekAgo);
      const pWeekAgoELO = pWeekAgoHistory.length > 0 ? pWeekAgoHistory[pWeekAgoHistory.length - 1].elo : p.eloHistory[0]?.elo || 1500;
      return { id: p.id, elo: pWeekAgoELO };
    }).sort((a, b) => b.elo - a.elo);

    const weekAgoRank = weekAgoRankings.findIndex((p) => p.id === player.id) + 1;
    return { ...player, lastWeekRank: weekAgoRank };
  });
}

// Fetch all players with their eloHistory reconstructed from the elo_history table
export async function fetchPlayersWithHistory() {
  const db = supabase();

  const { data: players, error: playersError } = await db
    .from('players')
    .select('*');
  if (playersError) throw new Error(`Failed to fetch players: ${playersError.message}`);

  const { data: history, error: historyError } = await db
    .from('elo_history')
    .select('*')
    .order('recorded_at', { ascending: true });
  if (historyError) throw new Error(`Failed to fetch elo_history: ${historyError.message}`);

  // Group history by player_id
  const historyByPlayer = {};
  for (const h of history) {
    if (!historyByPlayer[h.player_id]) historyByPlayer[h.player_id] = [];
    historyByPlayer[h.player_id].push({ elo: h.elo, timestamp: h.recorded_at });
  }

  return players.map(p => ({
    ...p,
    // Map DB snake_case to frontend camelCase
    countryCode: p.country_code,
    joinedAt: p.joined_at,
    lastWeekRank: p.last_week_rank,
    eloHistory: historyByPlayer[p.id] || [{ elo: 1500, timestamp: p.joined_at }],
  }));
}

// Fetch all matches
export async function fetchMatches() {
  const db = supabase();

  const { data: matches, error } = await db
    .from('matches')
    .select('*')
    .order('recorded_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch matches: ${error.message}`);

  return matches.map(m => ({
    id: m.id,
    winnerId: m.winner_id,
    loserId: m.loser_id,
    winner: m.winner_name,
    loser: m.loser_name,
    winnerScore: m.winner_score,
    loserScore: m.loser_score,
    winnerEloChange: m.winner_elo_change,
    loserEloChange: m.loser_elo_change,
    expectedWinProbability: m.expected_win_probability,
    timestamp: m.recorded_at,
  }));
}
