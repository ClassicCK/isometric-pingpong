-- New feature tables: Achievements, Limit Orders, Portfolio Snapshots
-- Run in Supabase SQL Editor

-- User achievements (awarded badges)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id),
  achievement_key TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_player ON user_achievements(player_id);

-- Limit orders for prediction markets
CREATE TABLE IF NOT EXISTS limit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES market_outcomes(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'buy' CHECK (direction IN ('buy', 'sell')),
  target_price NUMERIC(8,4) NOT NULL CHECK (target_price > 0 AND target_price < 1),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  filled_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'partial', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_limit_orders_user ON limit_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_limit_orders_market ON limit_orders(market_id, outcome_id, status);
CREATE INDEX IF NOT EXISTS idx_limit_orders_active ON limit_orders(status, target_price) WHERE status = 'open';

-- Portfolio value snapshots (for portfolio performance chart)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  positions_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user ON portfolio_snapshots(user_id, snapshot_at DESC);

-- RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE limit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Users insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own orders" ON limit_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own orders" ON limit_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own orders" ON limit_orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own snapshots" ON portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service insert snapshots" ON portfolio_snapshots FOR INSERT WITH CHECK (true);
