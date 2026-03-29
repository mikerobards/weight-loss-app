export interface WeightLog {
  id?: string;
  date: string; // ISO date string YYYY-MM-DD
  weight: number;
  body_fat_pct: number | null;
  created_at?: string;
}

export interface NutritionLog {
  id?: string;
  date: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at?: string;
}

export interface ImportHistory {
  id?: string;
  source: 'weight_gurus' | 'mfp';
  file_name: string;
  records_added: number;
  records_skipped: number;
  imported_at?: string;
}

export interface UserSettings {
  id?: string;
  target_weight: number | null;
  target_body_fat: number | null;
  weekly_loss_rate: number;
  unit_system: 'imperial' | 'metric';
  created_at?: string;
  updated_at?: string;
}

export interface Milestone {
  id?: string;
  title: string;
  type: 'auto' | 'custom';
  achieved: boolean;
  achieved_at: string | null;
  created_at?: string;
}

export interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
}

export type TimeRange = '7d' | '30d' | '90d' | 'all';
export type MovingAverageWindow = 7 | 14 | 21;
