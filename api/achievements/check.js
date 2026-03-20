// api/achievements/check.js
// POST endpoint — checks and awards any new achievements for the authenticated user

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { ACHIEVEMENTS } from './definitions.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const db = supabase();

  try {
    // 1. Get user row to find linked player_id
    const { data: userRow } = await db
      .from('users')
      .select('id, player_id')
      .eq('id', user.id)
      .single();

    if (!userRow) return res.status(404).json({ error: 'User not found' });

    const playerId = userRow.player_id;

    // 2. Fetch existing achievements so we only check un-awarded ones
    const { data: existing } = await db
      .from('user_achievements')
      .select('achievement_key')
      .eq('user_id', user.id);

    const earnedKeys = new Set((existing || []).map(a => a.achievement_key));

    // 3. Fetch data needed for checks (in parallel)
    const [
      matchesRes,
      playerRes,
      betsRes,
      positionsRes,
      transactionsRes,
      usersCountRes,
    ] = await Promise.all([
      // Matches involving this player (need player_id)
      playerId
        ? db.from('matches')
            .select('*')
            .or(`winner_id.eq.${playerId},loser_id.eq.${playerId}`)
            .order('recorded_at', { ascending: false })
        : Promise.resolve({ data: [] }),

      // Player stats
      playerId
        ? db.from('players').select('*').eq('id', playerId).single()
        : Promise.resolve({ data: null }),

      // User's bets
      db.from('bets').select('*').eq('user_id', user.id),

      // User's positions
      db.from('user_positions').select('*').eq('user_id', user.id),

      // Point transactions
      db.from('point_transactions').select('*').eq('user_id', user.id),

      // Total user count (for early_adopter)
      db.from('users').select('id, created_at').order('created_at', { ascending: true }).limit(10),
    ]);

    const matches = matchesRes.data || [];
    const player = playerRes.data;
    const bets = betsRes.data || [];
    const positions = positionsRes.data || [];
    const transactions = transactionsRes.data || [];
    const earliestUsers = usersCountRes.data || [];

    // Derived stats
    const totalMatches = matches.length;
    const wins = matches.filter(m => m.winner_id === playerId);
    const totalWins = wins.length;

    // Streak detection: sort by recorded_at desc, count consecutive wins
    const winStreak = computeWinStreak(matches, playerId);

    // 4. Check each un-awarded achievement
    const newlyEarned = [];

    for (const achievement of ACHIEVEMENTS) {
      if (earnedKeys.has(achievement.key)) continue;

      const met = checkCondition(achievement.key, {
        playerId,
        userId: user.id,
        totalMatches,
        totalWins,
        winStreak,
        matches,
        wins,
        player,
        bets,
        positions,
        transactions,
        earliestUsers,
      });

      if (met) {
        newlyEarned.push(achievement.key);
      }
    }

    // 5. Insert newly earned achievements
    if (newlyEarned.length > 0) {
      const rows = newlyEarned.map(key => ({
        user_id: user.id,
        achievement_key: key,
        awarded_at: new Date().toISOString(),
      }));

      const { error: insertError } = await db
        .from('user_achievements')
        .insert(rows);

      if (insertError) throw new Error(`Failed to insert achievements: ${insertError.message}`);
    }

    // 6. Build response
    const allKeys = [...earnedKeys, ...newlyEarned];
    const allAchievements = allKeys.map(key => {
      const def = ACHIEVEMENTS.find(a => a.key === key);
      return def ? { ...def } : { key };
    });

    const newAchievements = newlyEarned.map(key => {
      const def = ACHIEVEMENTS.find(a => a.key === key);
      return def ? { ...def } : { key };
    });

    return res.status(200).json({ newAchievements, allAchievements });
  } catch (err) {
    console.error('Achievement check error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeWinStreak(matches, playerId) {
  if (!playerId || matches.length === 0) return 0;
  // matches are already sorted desc by recorded_at
  let streak = 0;
  for (const m of matches) {
    if (m.winner_id === playerId) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function checkCondition(key, ctx) {
  const {
    playerId, userId, totalMatches, totalWins, winStreak,
    matches, wins, player, bets, positions, transactions, earliestUsers,
  } = ctx;

  switch (key) {
    // --- Matches ---
    case 'first_blood':
      return totalWins >= 1;

    case 'getting_started':
      return totalMatches >= 5;

    case 'regular':
      return totalMatches >= 25;

    case 'veteran':
      return totalMatches >= 50;

    case 'streak_3':
      return winStreak >= 3;

    case 'streak_5':
      return winStreak >= 5;

    case 'streak_10':
      return winStreak >= 10;

    case 'giant_killer':
      // A large positive ELO change for the winner suggests an upset
      return wins.some(m => m.winner_elo_change >= 30);

    case 'comeback_king':
      // User won but the loser had a high score (close game with loser >= 15)
      return wins.some(m =>
        m.winner_score != null &&
        m.loser_score != null &&
        m.loser_score >= 15 &&
        (m.winner_score - m.loser_score) <= 5
      );

    case 'iron_wall':
      // Last 3 wins all have loser_score < 15
      if (wins.length < 3) return false;
      // wins are a subset of matches (already desc sorted)
      return wins.slice(0, 3).every(m =>
        m.loser_score != null && m.loser_score < 15
      );

    // --- Betting ---
    case 'first_bet':
      return bets.length >= 1;

    case 'whale':
      return bets.some(b => parseFloat(b.cost) >= 100);

    case 'diversified': {
      const distinctMarkets = new Set(
        positions.filter(p => parseFloat(p.shares) > 0).map(p => p.market_id)
      );
      return distinctMarkets.size >= 5;
    }

    case 'oracle': {
      // Count resolved markets where user had winning payouts
      const payoutTx = transactions.filter(t => t.type === 'market_payout');
      const distinctPayoutMarkets = new Set(payoutTx.map(t => t.reference_id));
      return distinctPayoutMarkets.size >= 3;
    }

    case 'sharp': {
      // ROI = (total payouts - total wagered) / total wagered
      const totalWagered = transactions
        .filter(t => t.type === 'bet_purchase')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
      const totalPayouts = transactions
        .filter(t => t.type === 'market_payout')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      if (totalWagered === 0) return false;
      const roi = (totalPayouts - totalWagered) / totalWagered;
      return roi >= 0.25;
    }

    // --- Social ---
    case 'early_adopter': {
      const earlyIds = earliestUsers.map(u => u.id);
      return earlyIds.includes(userId);
    }

    case 'market_maker': {
      // Approximate: any single bet cost > 10% of the outcome pool at time of bet
      // We check if any bet cost >= 10 (a rough proxy for moving a pool by 10%+)
      // A more precise check would compare pre/post prices, but we approximate
      // by checking if the bet's cost was >= 10% of the pool shares
      return bets.some(b => {
        const cost = parseFloat(b.cost);
        // If the average price was low but cost was high relative to shares,
        // that likely moved the market. Use cost >= 10 as a simple heuristic.
        return cost >= 10;
      });
    }

    default:
      return false;
  }
}
