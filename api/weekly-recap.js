// api/weekly-recap.js
// POST endpoint (admin-only or cron) — generates a weekly recap and posts to Slack

import { supabase, setCorsHeaders, getAuthUser } from './_lib/supabase.js';
import { getPrices } from './_lib/cpmm.js';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check: Vercel cron sends GET with Authorization header, or accept POST from admin
  const isVercelCron = req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`;
  const isCronHeader = req.headers['x-cron-secret'] && req.headers['x-cron-secret'] === process.env.CRON_SECRET;
  if (isVercelCron || isCronHeader) {
    // Cron call — authorized
  } else {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const db = supabase();
    const { data: userRow } = await db
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userRow?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
  }

  try {
    const db = supabase();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();
    const nowISO = now.toISOString();

    // Date range for display
    const dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // ── Matches Section ──

    // Fetch matches from this week
    const { data: weekMatches, error: matchesError } = await db
      .from('matches')
      .select('*')
      .gte('recorded_at', weekAgoISO)
      .lte('recorded_at', nowISO)
      .order('recorded_at', { ascending: false });
    if (matchesError) throw matchesError;

    const totalMatches = weekMatches.length;

    // Most active player (most matches)
    const playerMatchCounts = {};
    for (const m of weekMatches) {
      playerMatchCounts[m.winner_name] = (playerMatchCounts[m.winner_name] || 0) + 1;
      playerMatchCounts[m.loser_name] = (playerMatchCounts[m.loser_name] || 0) + 1;
    }
    const mostActivePlayer = Object.entries(playerMatchCounts)
      .sort((a, b) => b[1] - a[1])[0];

    // Biggest upset: highest ELO diff where lower-ranked won
    // winner_elo_change is positive when winner gains; a big gain means they were the underdog
    let biggestUpset = null;
    for (const m of weekMatches) {
      const eloChange = Math.abs(m.winner_elo_change || 0);
      if (!biggestUpset || eloChange > Math.abs(biggestUpset.winner_elo_change || 0)) {
        biggestUpset = m;
      }
    }

    // Biggest ELO mover: compare current ELO with ELO from 7 days ago
    const { data: players, error: playersError } = await db
      .from('players')
      .select('id, name, elo');
    if (playersError) throw playersError;

    const { data: eloHistory, error: histError } = await db
      .from('elo_history')
      .select('player_id, elo, recorded_at')
      .lte('recorded_at', weekAgoISO)
      .order('recorded_at', { ascending: false });
    if (histError) throw histError;

    // Get each player's ELO as of 7 days ago (most recent entry before cutoff)
    const eloWeekAgo = {};
    for (const h of eloHistory) {
      if (!eloWeekAgo[h.player_id]) {
        eloWeekAgo[h.player_id] = h.elo;
      }
    }

    let biggestMover = null;
    let biggestMoverChange = 0;
    for (const p of players) {
      const oldElo = eloWeekAgo[p.id] || 1500;
      const change = p.elo - oldElo;
      if (Math.abs(change) > Math.abs(biggestMoverChange)) {
        biggestMoverChange = change;
        biggestMover = p;
      }
    }

    // Current #1 ranked player
    const rankedPlayers = [...players].sort((a, b) => b.elo - a.elo);
    const top5 = rankedPlayers.slice(0, 5);

    // ── Markets Section ──

    // Total volume traded this week (sum of bet costs)
    const { data: weekBets, error: betsError } = await db
      .from('bets')
      .select('cost, market_id, outcome_id')
      .gte('created_at', weekAgoISO)
      .lte('created_at', nowISO);
    if (betsError) throw betsError;

    const totalVolume = weekBets.reduce((sum, b) => sum + parseFloat(b.cost || 0), 0);

    // Most active market (by volume)
    const marketVolume = {};
    for (const b of weekBets) {
      marketVolume[b.market_id] = (marketVolume[b.market_id] || 0) + parseFloat(b.cost || 0);
    }
    const hottestMarketId = Object.entries(marketVolume)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    let hottestMarketTitle = null;
    if (hottestMarketId) {
      const { data: market } = await db
        .from('markets')
        .select('title')
        .eq('id', hottestMarketId)
        .single();
      hottestMarketTitle = market?.title || 'Unknown';
    }

    // Number of distinct markets traded
    const distinctMarkets = new Set(weekBets.map(b => b.market_id));

    // New markets created this week
    const { data: newMarkets, error: newMarketsError } = await db
      .from('markets')
      .select('id')
      .gte('created_at', weekAgoISO)
      .lte('created_at', nowISO);
    if (newMarketsError) throw newMarketsError;

    const newMarketsCount = newMarkets.length;

    // ── Top Traders Section ──
    // Simplified: get traders by weekly profit using point_transactions

    const { data: users, error: usersError } = await db
      .from('users')
      .select('id, display_name');
    if (usersError) throw usersError;

    const { data: weekTransactions, error: txError } = await db
      .from('point_transactions')
      .select('user_id, amount, type')
      .gte('created_at', weekAgoISO)
      .lte('created_at', nowISO);
    if (txError) throw txError;

    // Calculate net profit per user from market-related transactions
    const userProfit = {};
    for (const tx of weekTransactions) {
      if (['bet_purchase', 'bet_sale', 'market_payout'].includes(tx.type)) {
        userProfit[tx.user_id] = (userProfit[tx.user_id] || 0) + parseFloat(tx.amount);
      }
    }

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = u.display_name || 'Unknown';
    }

    const topTraders = Object.entries(userProfit)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([userId, profit]) => ({
        name: userMap[userId] || 'Unknown',
        profit: Math.round(profit * 100) / 100,
      }));

    // ── Format Slack Message ──

    let message = `:ping_pong: *Isometric Ping Pong — Weekly Recap*\n_${dateRange}_\n\n`;

    message += `*:bar_chart: This Week's Action*\n`;
    message += `• ${totalMatches} matches played\n`;
    if (mostActivePlayer) {
      message += `• Most active: *${mostActivePlayer[0]}* (${mostActivePlayer[1]} matches)\n`;
    }
    if (biggestUpset) {
      message += `• Biggest upset: *${biggestUpset.winner_name}* beat *${biggestUpset.loser_name}* (ELO diff: ${Math.abs(biggestUpset.winner_elo_change || 0)})\n`;
    }
    if (biggestMover) {
      const sign = biggestMoverChange >= 0 ? '+' : '';
      message += `• Biggest mover: *${biggestMover.name}* (${sign}${biggestMoverChange} ELO)\n`;
    }

    message += `\n*:trophy: Current Rankings*\n`;
    top5.forEach((p, i) => {
      message += `${i + 1}. ${p.name} — ${p.elo} ELO\n`;
    });

    message += `\n*:moneybag: Markets*\n`;
    message += `• ${Math.round(totalVolume * 100) / 100} pts traded across ${distinctMarkets.size} markets\n`;
    if (hottestMarketTitle) {
      message += `• Hottest market: _${hottestMarketTitle}_\n`;
    }
    message += `• ${newMarketsCount} new markets created\n`;

    if (topTraders.length > 0) {
      message += `\n*:chart_with_upwards_trend: Top Traders*\n`;
      topTraders.forEach((t, i) => {
        const sign = t.profit >= 0 ? '+' : '';
        message += `${i + 1}. ${t.name} — ${sign}${t.profit} pts\n`;
      });
    }

    // ── Post to Slack ──

    if (SLACK_WEBHOOK_URL) {
      const slackRes = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      if (!slackRes.ok) {
        console.error('Slack webhook failed:', slackRes.status, await slackRes.text());
        return res.status(500).json({ error: 'Failed to post to Slack', recap: message });
      }
    }

    return res.status(200).json({ success: true, recap: message });
  } catch (err) {
    console.error('Weekly recap error:', err);
    return res.status(500).json({ error: err.message });
  }
}
