-- Add market_id column to challenges table to link challenges to prediction markets
-- Run this in Supabase SQL Editor

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES markets(id);

-- Add h2h as a valid target type for comments (for H2H chat)
-- No schema change needed — target_type is already a text column
