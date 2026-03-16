-- Create emission_factors table in Supabase
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS emission_factors (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  section TEXT NOT NULL,
  type TEXT NOT NULL,
  units TEXT NOT NULL,
  co2e NUMERIC NOT NULL,
  co2 NUMERIC,
  ch4 NUMERIC,
  no2 NUMERIC,
  unit TEXT NOT NULL,
  ref TEXT NOT NULL,
  year INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scope ON emission_factors(scope);
CREATE INDEX IF NOT EXISTS idx_section ON emission_factors(section);
CREATE INDEX IF NOT EXISTS idx_type ON emission_factors(type);

-- Enable full-text search (optional)
ALTER TABLE emission_factors ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', 
    COALESCE(scope, '') || ' ' || 
    COALESCE(section, '') || ' ' || 
    COALESCE(type, '') || ' ' ||
    COALESCE(ref, '')
  )
) STORED;

CREATE INDEX IF NOT EXISTS idx_emission_factors_search ON emission_factors USING gin(search_vector);
