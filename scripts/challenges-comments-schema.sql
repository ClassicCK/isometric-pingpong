-- Challenges & Comments schema
-- Run in Supabase SQL Editor

-- Player challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id TEXT NOT NULL REFERENCES players(id),
  challenger_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id TEXT NOT NULL REFERENCES players(id),
  challenged_user_id UUID REFERENCES auth.users(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed')),
  match_id TEXT REFERENCES matches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_players ON challenges(challenger_id, challenged_id);

-- Comments (on markets, matches, players)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('market', 'match', 'player')),
  target_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Challenge policies
CREATE POLICY "Users read own challenges" ON challenges FOR SELECT
  USING (auth.uid() = challenger_user_id OR auth.uid() = challenged_user_id);
CREATE POLICY "Public read pending challenges" ON challenges FOR SELECT
  USING (status = 'pending');
CREATE POLICY "Users create challenges" ON challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_user_id);
CREATE POLICY "Challenged user can update" ON challenges FOR UPDATE
  USING (auth.uid() = challenged_user_id OR auth.uid() = challenger_user_id);

-- Comment policies
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users create comments" ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON comments FOR DELETE
  USING (auth.uid() = user_id);
