#!/usr/bin/env node
// One-time migration script: reads data/pingpong.json and inserts into Supabase
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=yyy node scripts/migrate-to-supabase.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-to-supabase.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  // Read source data
  const dataPath = join(__dirname, '..', 'data', 'pingpong.json');
  const raw = readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  const players = data.players || [];
  const matches = data.matches || [];

  console.log(`Source data: ${players.length} players, ${matches.length} matches`);

  // 1. Insert players
  const playerRows = players.map(p => ({
    id: p.id,
    name: p.name,
    country_code: p.countryCode,
    office: p.office,
    elo: p.elo,
    wins: p.wins,
    losses: p.losses,
    joined_at: p.joinedAt,
    last_week_rank: p.lastWeekRank || null,
  }));

  const { error: playersError } = await supabase
    .from('players')
    .upsert(playerRows, { onConflict: 'id' });
  if (playersError) {
    console.error('Failed to insert players:', playersError);
    process.exit(1);
  }
  console.log(`Inserted ${playerRows.length} players`);

  // 2. Insert elo_history (flattened from each player's eloHistory array)
  const historyRows = [];
  for (const player of players) {
    if (!player.eloHistory) continue;
    for (const h of player.eloHistory) {
      historyRows.push({
        player_id: player.id,
        elo: h.elo,
        recorded_at: h.timestamp,
        match_id: null, // historical data doesn't have match linkage
      });
    }
  }

  // Supabase has a batch limit, insert in chunks of 500
  for (let i = 0; i < historyRows.length; i += 500) {
    const chunk = historyRows.slice(i, i + 500);
    const { error } = await supabase.from('elo_history').insert(chunk);
    if (error) {
      console.error(`Failed to insert elo_history chunk at offset ${i}:`, error);
      process.exit(1);
    }
  }
  console.log(`Inserted ${historyRows.length} elo_history rows`);

  // 3. Insert matches
  const matchRows = matches.map(m => ({
    id: m.id,
    winner_id: m.winnerId,
    loser_id: m.loserId,
    winner_name: m.winner,
    loser_name: m.loser,
    winner_score: m.winnerScore ?? null,
    loser_score: m.loserScore ?? null,
    winner_elo_change: m.winnerEloChange,
    loser_elo_change: m.loserEloChange,
    expected_win_probability: m.expectedWinProbability,
    recorded_at: m.timestamp,
    recorded_by: null, // no auth user for historical data
  }));

  for (let i = 0; i < matchRows.length; i += 500) {
    const chunk = matchRows.slice(i, i + 500);
    const { error } = await supabase.from('matches').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Failed to insert matches chunk at offset ${i}:`, error);
      process.exit(1);
    }
  }
  console.log(`Inserted ${matchRows.length} matches`);

  // 4. Verify counts
  const { count: playerCount } = await supabase.from('players').select('*', { count: 'exact', head: true });
  const { count: matchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true });
  const { count: historyCount } = await supabase.from('elo_history').select('*', { count: 'exact', head: true });

  console.log('\n=== Verification ===');
  console.log(`Players:     ${playerCount} (expected ${players.length})`);
  console.log(`Matches:     ${matchCount} (expected ${matches.length})`);
  console.log(`ELO History: ${historyCount} (expected ${historyRows.length})`);

  if (playerCount === players.length && matchCount === matches.length && historyCount === historyRows.length) {
    console.log('\nMigration successful!');
  } else {
    console.error('\nWARNING: Count mismatch detected. Please investigate.');
    process.exit(1);
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
