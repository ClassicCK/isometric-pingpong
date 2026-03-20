#!/usr/bin/env node
// scripts/seed-markets.js
// One-time script to create initial prediction markets from current player data.
// Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-markets.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

function poolsFromProbabilities(probs, liquidity = 100) {
  return probs.map(p => {
    const clamped = Math.max(0.01, Math.min(0.99, p));
    return Math.round((liquidity / clamped) * 10000) / 10000;
  });
}

async function main() {
  // Fetch qualified players (5+ games)
  const { data: allPlayers } = await db
    .from('players')
    .select('id, name, elo, wins, losses, country_code, office')
    .order('elo', { ascending: false });

  const qualified = allPlayers.filter(p => (p.wins + p.losses) >= 5);
  console.log(`Found ${qualified.length} qualified players`);

  // Use top 20 for most markets (keeps them manageable)
  const top20 = qualified.slice(0, 20);

  // Year-end resolution date
  const yearEnd = '2026-12-31T23:59:59Z';

  const markets = [];

  // --- Market 1: Year-End #1 ---
  {
    const totalElo = top20.reduce((s, p) => s + p.elo, 0);
    const outcomes = top20.map(p => ({
      label: p.name,
      playerId: p.id,
      probability: p.elo / totalElo, // Simple ELO-weighted probability
    }));

    markets.push({
      title: '2026 Year-End #1',
      description: 'Who will be the #1 ranked player by ELO at the end of 2026?',
      category: 'season',
      resolutionDate: yearEnd,
      outcomes,
    });
  }

  // --- Market 2: Year-End Top 5 ---
  {
    const top15 = qualified.slice(0, 15);
    const outcomes = top15.map((p, i) => ({
      label: p.name,
      playerId: p.id,
      // Higher-ranked players have higher probability of being in top 5
      probability: i < 5 ? 0.7 - (i * 0.08) : 0.25 - ((i - 5) * 0.02),
    }));

    markets.push({
      title: '2026 Year-End Top 5',
      description: 'Which players will finish in the top 5 by ELO at year end? Buy shares in who you think makes it.',
      category: 'season',
      resolutionDate: yearEnd,
      outcomes,
    });
  }

  // --- Market 3: Year-End Top 10 ---
  {
    const outcomes = top20.map((p, i) => ({
      label: p.name,
      playerId: p.id,
      probability: i < 10 ? 0.6 - (i * 0.03) : 0.2 - ((i - 10) * 0.015),
    }));

    markets.push({
      title: '2026 Year-End Top 10',
      description: 'Which players will finish in the top 10 by ELO at year end?',
      category: 'season',
      resolutionDate: yearEnd,
      outcomes,
    });
  }

  // --- Market 4: Most Improved Player ---
  {
    // Players ranked 6-20 are candidates for most improved
    const candidates = qualified.slice(5, 20);
    const n = candidates.length;
    const outcomes = candidates.map((p, i) => ({
      label: p.name,
      playerId: p.id,
      probability: 1 / n, // Equal odds — hard to predict
    }));

    markets.push({
      title: '2026 Most Improved Player',
      description: 'Who will have the largest ELO gain from today to end of 2026? Candidates: players currently ranked 6-20.',
      category: 'season',
      resolutionDate: yearEnd,
      outcomes,
    });
  }

  // --- Market 5: Will anyone dethrone #1? ---
  if (qualified.length >= 2) {
    const currentChamp = qualified[0];
    markets.push({
      title: `Will ${currentChamp.name} stay #1 all year?`,
      description: `${currentChamp.name} is currently #1 with ${currentChamp.elo} ELO. Will they hold it through 2026?`,
      category: 'season',
      resolutionDate: yearEnd,
      outcomes: [
        { label: 'Yes — stays #1', probability: 0.35 },
        { label: 'No — gets dethroned', probability: 0.65 },
      ],
    });
  }

  // --- Market 6: NYC vs London ---
  {
    const nycPlayers = qualified.filter(p => p.office === 'NYC');
    const lonPlayers = qualified.filter(p => p.office === 'LON');
    const nycAvgElo = nycPlayers.length > 0 ? nycPlayers.reduce((s, p) => s + p.elo, 0) / nycPlayers.length : 1500;
    const lonAvgElo = lonPlayers.length > 0 ? lonPlayers.reduce((s, p) => s + p.elo, 0) / lonPlayers.length : 1500;
    const totalAvg = nycAvgElo + lonAvgElo;

    markets.push({
      title: 'Higher Average ELO: NYC or London?',
      description: 'Which office will have a higher average ELO among qualified players at year end?',
      category: 'season',
      resolutionDate: yearEnd,
      outcomes: [
        { label: 'NYC', probability: nycAvgElo / totalAvg },
        { label: 'London', probability: lonAvgElo / totalAvg },
      ],
    });
  }

  // Insert all markets
  console.log(`\nCreating ${markets.length} markets...\n`);

  for (const m of markets) {
    // Create market
    const { data: market, error: mErr } = await db
      .from('markets')
      .insert({
        title: m.title,
        description: m.description,
        category: m.category,
        status: 'open',
        resolution_date: m.resolutionDate,
      })
      .select()
      .single();

    if (mErr) {
      console.error(`Failed to create "${m.title}":`, mErr.message);
      continue;
    }

    // Normalize probabilities
    const totalProb = m.outcomes.reduce((s, o) => s + o.probability, 0);
    const normalized = m.outcomes.map(o => ({
      ...o,
      probability: o.probability / totalProb,
    }));

    // Calculate pools
    const pools = poolsFromProbabilities(
      normalized.map(o => o.probability),
      100
    );

    // Insert outcomes
    const outcomeRows = normalized.map((o, i) => ({
      market_id: market.id,
      label: o.label,
      player_id: o.playerId || null,
      pool_shares: pools[i],
    }));

    const { error: oErr } = await db
      .from('market_outcomes')
      .insert(outcomeRows);

    if (oErr) {
      console.error(`Failed to create outcomes for "${m.title}":`, oErr.message);
      continue;
    }

    console.log(`✅ ${m.title} — ${m.outcomes.length} outcomes`);
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
