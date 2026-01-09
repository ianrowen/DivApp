-- Migration: Add theme_names column if missing
-- Date: 2026-01-09
-- Description: Ensures theme_names column exists in theme_interpretations table

BEGIN;

-- Add theme_names column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'theme_interpretations' 
    AND column_name = 'theme_names'
  ) THEN
    ALTER TABLE public.theme_interpretations
    ADD COLUMN theme_names TEXT;
    
    RAISE NOTICE 'Added theme_names column to theme_interpretations table';
  ELSE
    RAISE NOTICE 'theme_names column already exists in theme_interpretations table';
  END IF;
END $$;

COMMIT;
