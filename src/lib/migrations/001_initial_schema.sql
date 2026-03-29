-- Weight Loss App: Initial Schema
-- Run this in your Supabase SQL editor

-- Weight logs from Weight Gurus
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  weight decimal(6,2) NOT NULL,
  body_fat_pct decimal(5,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weight_logs_date_idx ON weight_logs(date);

-- Nutrition logs from MyFitnessPal
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  calories integer NOT NULL,
  protein_g decimal(6,2),
  carbs_g decimal(6,2),
  fat_g decimal(6,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_logs_date_idx ON nutrition_logs(date);

-- Import history
CREATE TABLE IF NOT EXISTS import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('weight_gurus', 'mfp')),
  file_name text NOT NULL,
  records_added integer NOT NULL DEFAULT 0,
  records_skipped integer NOT NULL DEFAULT 0,
  imported_at timestamptz DEFAULT now()
);

-- User settings (single row)
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_weight decimal(6,2),
  target_body_fat decimal(5,2),
  weekly_loss_rate decimal(3,1) NOT NULL DEFAULT 1.0,
  unit_system text NOT NULL DEFAULT 'imperial' CHECK (unit_system IN ('imperial', 'metric')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'auto' CHECK (type IN ('auto', 'custom')),
  achieved boolean NOT NULL DEFAULT false,
  achieved_at date,
  created_at timestamptz DEFAULT now()
);

-- Auto-update updated_at for user_settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
