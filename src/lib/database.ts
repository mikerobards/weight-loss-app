import { getSupabaseClient } from './supabase';
import type { WeightLog, NutritionLog, ImportHistory, UserSettings, Milestone } from '@/types';

// ─── Weight Logs ──────────────────────────────────────────────────────────────

export async function getWeightLogs(from?: string, to?: string): Promise<WeightLog[]> {
  const db = getSupabaseClient();
  let query = db.from('weight_logs').select('*').order('date', { ascending: true });
  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertWeightLogs(logs: Omit<WeightLog, 'id' | 'created_at'>[]): Promise<number> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from('weight_logs')
    .upsert(logs, { onConflict: 'date', ignoreDuplicates: false })
    .select();
  if (error) throw error;
  return data?.length ?? 0;
}

export async function getExistingWeightDates(): Promise<Set<string>> {
  const db = getSupabaseClient();
  const { data, error } = await db.from('weight_logs').select('date');
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.date));
}

// ─── Nutrition Logs ───────────────────────────────────────────────────────────

export async function getNutritionLogs(from?: string, to?: string): Promise<NutritionLog[]> {
  const db = getSupabaseClient();
  let query = db.from('nutrition_logs').select('*').order('date', { ascending: true });
  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertNutritionLogs(logs: Omit<NutritionLog, 'id' | 'created_at'>[]): Promise<number> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from('nutrition_logs')
    .upsert(logs, { onConflict: 'date', ignoreDuplicates: false })
    .select();
  if (error) throw error;
  return data?.length ?? 0;
}

export async function getExistingNutritionDates(): Promise<Set<string>> {
  const db = getSupabaseClient();
  const { data, error } = await db.from('nutrition_logs').select('date');
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.date));
}

// ─── Import History ───────────────────────────────────────────────────────────

export async function logImport(record: Omit<ImportHistory, 'id' | 'imported_at'>): Promise<void> {
  const db = getSupabaseClient();
  const { error } = await db.from('import_history').insert(record);
  if (error) throw error;
}

export async function getImportHistory(): Promise<ImportHistory[]> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from('import_history')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// ─── User Settings ────────────────────────────────────────────────────────────

export async function getUserSettings(): Promise<UserSettings | null> {
  const db = getSupabaseClient();
  const { data, error } = await db.from('user_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveUserSettings(settings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const db = getSupabaseClient();
  const existing = await getUserSettings();
  if (existing?.id) {
    const { error } = await db.from('user_settings').update(settings).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await db.from('user_settings').insert(settings);
    if (error) throw error;
  }
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function getMilestones(): Promise<Milestone[]> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from('milestones')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createMilestone(milestone: Omit<Milestone, 'id' | 'created_at'>): Promise<Milestone> {
  const db = getSupabaseClient();
  const { data, error } = await db.from('milestones').insert(milestone).select().single();
  if (error) throw error;
  return data;
}

export async function updateMilestone(id: string, updates: Partial<Milestone>): Promise<void> {
  const db = getSupabaseClient();
  const { error } = await db.from('milestones').update(updates).eq('id', id);
  if (error) throw error;
}
