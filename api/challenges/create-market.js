// api/challenges/create-market.js
// Create a prediction market for a specific challenge/matchup. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { poolsFromProbabilities } from '../_lib/cpmm.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { challengeId } = req.body || {};

  if (!challengeId) {
    return res.status(400).json({ error: 'challengeId is required' });
  }

  const db = supabase();

  try {
    // 1. Fetch the challenge
    const { data: challenge, error: challengeError } = await db
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if a market already exists for this challenge
    if (challenge.market_id) {
      return res.status(400).json({ error: 'A market already exists for this challenge', marketId: challenge.market_id });
    }

    // 2. Get player names
    const { data: players, error: playersError } = await db
      .from('players')
      .select('id, name, elo')
      .in('id', [challenge.challenger_id, challenge.challenged_id]);

    if (playersError || !players || players.length < 2) {
      return res.status(400).json({ error: 'Could not find both players' });
    }

    const challenger = players.find(p => p.id === challenge.challenger_id);
    const challenged = players.find(p => p.id === challenge.challenged_id);

    // 3. Calculate initial probabilities based on ELO
    const eloDiff = challenger.elo - challenged.elo;
    const expectedChallenger = 1 / (1 + Math.pow(10, -eloDiff / 400));
    const expectedChallenged = 1 - expectedChallenger;

    // Clamp to avoid extreme probabilities
    const p1Prob = Math.max(0.05, Math.min(0.95, expectedChallenger));
    const p2Prob = 1 - p1Prob;

    // 4. Create the market
    const title = `${challenger.name} vs ${challenged.name}`;
    const description = challenge.message
      ? `Challenge match: "${challenge.message}"`
      : `Challenge match between ${challenger.name} and ${challenged.name}`;

    const { data: market, error: marketError } = await db
      .from('markets')
      .insert({
        title,
        description,
        category: 'match',
        status: 'open',
        created_by: user.id,
      })
      .select()
      .single();

    if (marketError) throw marketError;

    // 5. Create outcomes with ELO-based probabilities
    const baseLiquidity = 100;
    const probs = [p1Prob, p2Prob];
    const poolShares = poolsFromProbabilities(probs, baseLiquidity);

    const outcomeRows = [
      {
        market_id: market.id,
        label: `${challenger.name} wins`,
        player_id: challenger.id,
        pool_shares: poolShares[0],
      },
      {
        market_id: market.id,
        label: `${challenged.name} wins`,
        player_id: challenged.id,
        pool_shares: poolShares[1],
      },
    ];

    const { data: insertedOutcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .insert(outcomeRows)
      .select();

    if (outcomesError) throw outcomesError;

    // 6. Link market to challenge
    await db
      .from('challenges')
      .update({ market_id: market.id })
      .eq('id', challengeId);

    return res.status(200).json({
      market: {
        id: market.id,
        title: market.title,
        status: market.status,
      },
      outcomes: insertedOutcomes.map(o => ({
        id: o.id,
        label: o.label,
        poolShares: parseFloat(o.pool_shares),
      })),
      probabilities: {
        [challenger.name]: Math.round(p1Prob * 100),
        [challenged.name]: Math.round(p2Prob * 100),
      },
    });
  } catch (err) {
    console.error('Create challenge market error:', err);
    return res.status(500).json({ error: err.message });
  }
}
