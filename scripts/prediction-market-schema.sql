-- Prediction Market Schema for Isometric Ping Pong
-- Run this in Supabase SQL Editor

-- Point balances (one row per user)
CREATE TABLE point_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_wagered NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Point transaction ledger (immutable)
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('initial_grant', 'bet_purchase', 'bet_sale', 'market_payout', 'market_refund')),
  description TEXT,
  reference_id TEXT,
  balance_after NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id, created_at DESC);

-- Prediction markets
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'season' CHECK (category IN ('season', 'match', 'custom')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved', 'voided')),
  resolution_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_markets_status ON markets(status);

-- Market outcomes (each possible result within a market)
CREATE TABLE market_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  player_id TEXT REFERENCES players(id),
  pool_shares NUMERIC(16,4) NOT NULL DEFAULT 100,
  is_winner BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_market_outcomes_market ON market_outcomes(market_id);

-- Individual bet transactions
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id),
  outcome_id UUID NOT NULL REFERENCES market_outcomes(id),
  direction TEXT NOT NULL DEFAULT 'buy' CHECK (direction IN ('buy', 'sell')),
  shares NUMERIC(12,4) NOT NULL,
  cost NUMERIC(12,2) NOT NULL,
  avg_price NUMERIC(8,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bets_user_market ON bets(user_id, market_id);
CREATE INDEX idx_bets_market ON bets(market_id, created_at DESC);

-- User positions (denormalized aggregate per user per outcome)
CREATE TABLE user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id),
  outcome_id UUID NOT NULL REFERENCES market_outcomes(id),
  shares NUMERIC(12,4) NOT NULL DEFAULT 0,
  avg_cost_basis NUMERIC(8,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outcome_id)
);
CREATE INDEX idx_user_positions_user ON user_positions(user_id);
CREATE INDEX idx_user_positions_market ON user_positions(market_id, outcome_id);

-- Row Level Security
ALTER TABLE point_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Users read own balance" ON point_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own transactions" ON point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public read markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Public read outcomes" ON market_outcomes FOR SELECT USING (true);
CREATE POLICY "Users read own bets" ON bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own positions" ON user_positions FOR SELECT USING (auth.uid() = user_id);
