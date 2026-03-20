// api/activity/feed.js
// Unified activity feed of recent events across the app. Public endpoint.

import { supabase, setCorsHeaders } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db = supabase();

  try {
    // Run all queries in parallel — catch individual failures gracefully
    const [matchesResult, betsResult, marketsResult] = await Promise.allSettled([
      // 1. Recent matches
      db
        .from('matches')
        .select('id, winner_id, loser_id, winner_name, loser_name, winner_score, loser_score, winner_elo_change, loser_elo_change, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(50),

      // 2. Recent bets — fetch without joins first, then enrich
      db
        .from('bets')
        .select('id, user_id, market_id, outcome_id, direction, shares, cost, avg_price, created_at')
        .order('created_at', { ascending: false })
        .limit(50),

      // 3. Recent markets (created or resolved)
      db
        .from('markets')
        .select('id, title, created_at, resolved_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const events = [];

    // Map matches
    const matches = matchesResult.status === 'fulfilled' && !matchesResult.value.error
      ? matchesResult.value.data || []
      : [];

    for (const m of matches) {
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

    // Map bets — enrich with user names, outcome labels, market titles
    const bets = betsResult.status === 'fulfilled' && !betsResult.value.error
      ? betsResult.value.data || []
      : [];

    if (bets.length > 0) {
      // Collect unique IDs for batch lookups
      const userIds = [...new Set(bets.map(b => b.user_id).filter(Boolean))];
      const outcomeIds = [...new Set(bets.map(b => b.outcome_id).filter(Boolean))];
      const marketIds = [...new Set(bets.map(b => b.market_id).filter(Boolean))];

      // Batch fetch user names, outcome labels, market titles
      const [usersRes, outcomesRes, marketsRes2] = await Promise.allSettled([
        userIds.length > 0
          ? db.from('users').select('id, display_name').in('id', userIds)
          : Promise.resolve({ data: [] }),
        outcomeIds.length > 0
          ? db.from('market_outcomes').select('id, label').in('id', outcomeIds)
          : Promise.resolve({ data: [] }),
        marketIds.length > 0
          ? db.from('markets').select('id, title').in('id', marketIds)
          : Promise.resolve({ data: [] }),
      ]);

      const userMap = {};
      const outcomeMap = {};
      const marketMap = {};

      if (usersRes.status === 'fulfilled') {
        for (const u of (usersRes.value.data || [])) {
          userMap[u.id] = u.display_name;
        }
      }
      if (outcomesRes.status === 'fulfilled') {
        for (const o of (outcomesRes.value.data || [])) {
          outcomeMap[o.id] = o.label;
        }
      }
      if (marketsRes2.status === 'fulfilled') {
        for (const m of (marketsRes2.value.data || [])) {
          marketMap[m.id] = m.title;
        }
      }

      for (const b of bets) {
        events.push({
          type: 'bet',
          timestamp: b.created_at,
          data: {
            userName: userMap[b.user_id] || 'Unknown',
            direction: b.direction,
            shares: b.shares,
            cost: b.cost,
            outcomeLabel: outcomeMap[b.outcome_id] || null,
            marketTitle: marketMap[b.market_id] || null,
          },
        });
      }
    }

    // Map markets — created and resolved
    const markets = marketsResult.status === 'fulfilled' && !marketsResult.value.error
      ? marketsResult.value.data || []
      : [];

    for (const m of markets) {
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
