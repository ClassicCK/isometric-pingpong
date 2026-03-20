// api/activity/feed.js
// Unified activity feed of recent events across the app. Public endpoint.

import { supabase, setCorsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();

  try {
    // Run all queries in parallel
    const [matchesResult, betsResult, marketsResult] = await Promise.all([
      // 1. Recent matches
      db
        .from('matches')
        .select('id, winner_id, loser_id, winner_name, loser_name, winner_score, loser_score, winner_elo_change, loser_elo_change, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(50),

      // 2. Recent bets with outcome label, market title, and user display name
      db
        .from('bets')
        .select('id, user_id, market_id, outcome_id, direction, shares, cost, avg_price, created_at, market_outcomes(label), markets(title), users(display_name)')
        .order('created_at', { ascending: false })
        .limit(50),

      // 3. Recent markets (created or resolved)
      db
        .from('markets')
        .select('id, title, created_at, resolved_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (matchesResult.error) throw matchesResult.error;
    if (betsResult.error) throw betsResult.error;
    if (marketsResult.error) throw marketsResult.error;

    const events = [];

    // Map matches
    for (const m of matchesResult.data || []) {
      events.push({
        type: 'match',
        timestamp: m.recorded_at,
        data: {
          matchId: m.id,
          winnerName: m.winner_name,
          loserName: m.loser_name,
          winnerScore: m.winner_score,
          loserScore: m.loser_score,
          winnerEloChange: m.winner_elo_change,
          loserEloChange: m.loser_elo_change,
        },
      });
    }

    // Map bets
    for (const b of betsResult.data || []) {
      events.push({
        type: 'bet',
        timestamp: b.created_at,
        data: {
          userName: b.users?.display_name || 'Unknown',
          direction: b.direction,
          shares: b.shares,
          cost: b.cost,
          outcomeLabel: b.market_outcomes?.label || null,
          marketTitle: b.markets?.title || null,
        },
      });
    }

    // Map markets — created and resolved
    for (const m of marketsResult.data || []) {
      events.push({
        type: 'market_created',
        timestamp: m.created_at,
        data: {
          marketId: m.id,
          title: m.title,
        },
      });

      if (m.resolved_at) {
        events.push({
          type: 'market_resolved',
          timestamp: m.resolved_at,
          data: {
            marketId: m.id,
            title: m.title,
            resolvedAt: m.resolved_at,
          },
        });
      }
    }

    // Sort by timestamp descending, limit to 50
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limited = events.slice(0, 50);

    return res.status(200).json({ events: limited });
  } catch (err) {
    console.error('Activity feed error:', err);
    return res.status(500).json({ error: err.message });
  }
}
