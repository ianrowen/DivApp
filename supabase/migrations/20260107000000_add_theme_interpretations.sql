-- Migration: Add theme_interpretations table
-- Date: 2026-01-07
-- Description: Stores AI-generated interpretations for recurring card themes, regenerated every 8 days

BEGIN;

-- Create theme_interpretations table
CREATE TABLE IF NOT EXISTS public.theme_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_type TEXT NOT NULL CHECK (theme_type IN ('recurring_theme', 'anomaly', 'trend')),
  theme_key TEXT NOT NULL, -- Unique identifier for the theme (e.g., card names joined, suit name, etc.)
  cards TEXT[], -- Array of card names involved in this theme
  interpretation_en TEXT NOT NULL, -- English interpretation (120 words)
  interpretation_zh TEXT, -- Chinese interpretation (optional)
  interpretation_ja TEXT, -- Japanese interpretation (optional)
  summary_en TEXT, -- English summary (50 words)
  summary_zh TEXT, -- Chinese summary (optional)
  summary_ja TEXT, -- Japanese summary (optional)
  theme_names TEXT, -- 1-3 word theme summary
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- When to regenerate (8 days from generation)
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (severity, stats, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique constraint for user_id + theme_key combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_theme_interpretations_user_theme_unique 
  ON public.theme_interpretations(user_id, theme_key);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_theme_interpretations_user_id ON public.theme_interpretations(user_id);
CREATE INDEX IF NOT EXISTS idx_theme_interpretations_expires_at ON public.theme_interpretations(expires_at);
CREATE INDEX IF NOT EXISTS idx_theme_interpretations_user_theme ON public.theme_interpretations(user_id, theme_key);

-- Enable RLS
ALTER TABLE public.theme_interpretations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own theme interpretations
CREATE POLICY "Users can view own theme interpretations"
  ON public.theme_interpretations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own theme interpretations
CREATE POLICY "Users can insert own theme interpretations"
  ON public.theme_interpretations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own theme interpretations
CREATE POLICY "Users can update own theme interpretations"
  ON public.theme_interpretations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_theme_interpretations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_theme_interpretations_updated_at
  BEFORE UPDATE ON public.theme_interpretations
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_interpretations_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.theme_interpretations TO authenticated;

COMMIT;
