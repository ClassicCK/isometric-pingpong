// api/markets/create.js
// Admin-only: create a new prediction market with outcomes.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';
import { poolsFromProbabilities } from '../_lib/cpmm.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const db = supabase();

  // Check admin
  const { data: userRow } = await db
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userRow?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, description, category, outcomes, liquidity, resolutionDate } = req.body || {};

  if (!title || !outcomes || !Array.isArray(outcomes) || outcomes.length < 2) {
    return res.status(400).json({ error: 'Title and at least 2 outcomes required' });
  }

  try {
    // Create market
    const { data: market, error: marketError } = await db
      .from('markets')
      .insert({
        title,
        description: description || null,
        category: category || 'season',
        status: 'open',
        resolution_date: resolutionDate || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (marketError) throw marketError;

    // Calculate initial pool shares
    const baseLiquidity = liquidity || 100;
    let poolShares;

    // If outcomes have probabilities, use them; otherwise equal split
    const hasProbs = outcomes.every(o => o.probability != null);
    if (hasProbs) {
      const probs = outcomes.map(o => o.probability);
      poolShares = poolsFromProbabilities(probs, baseLiquidity);
    } else {
      // Equal probability for all outcomes
      const equalProb = 1 / outcomes.length;
      poolShares = outcomes.map(() => baseLiquidity / equalProb);
    }

    // Insert outcomes
    const outcomeRows = outcomes.map((o, i) => ({
      market_id: market.id,
      label: o.label,
      player_id: o.playerId || null,
      pool_shares: poolShares[i],
    }));

    const { data: insertedOutcomes, error: outcomesError } = await db
      .from('market_outcomes')
      .insert(outcomeRows)
      .select();

    if (outcomesError) throw outcomesError;

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
    });
  } catch (err) {
    console.error('Create market error:', err);
    return res.status(500).json({ error: err.message });
  }
}
