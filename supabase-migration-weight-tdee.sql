-- Weight tracking & dynamic TDEE migration
-- Execute this in the Supabase SQL Editor

-- Weight entries table
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

CREATE INDEX idx_weight_entries_profile_date ON weight_entries(profile_id, date);

-- RLS
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on weight_entries" ON weight_entries FOR ALL USING (true) WITH CHECK (true);

-- Add TDEE calculation fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex TEXT DEFAULT 'male';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 175;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level REAL DEFAULT 1.375;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deficit_target INTEGER DEFAULT 500;
