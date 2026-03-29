import { startOfWeek, endOfWeek, format, parseISO, addWeeks } from 'date-fns';
import type { NutritionLog, WeightLog } from '@/types';

export interface WeeklyNutrition {
  weekStart: string;
  avgCalories: number;
  avgProtein: number | null;
  avgCarbs: number | null;
  avgFat: number | null;
  count: number;
}

export interface WeeklyNutritionChange {
  current: WeeklyNutrition;
  previous: WeeklyNutrition | null;
  calorieChange: number | null;
}

function groupByWeek(logs: NutritionLog[]): Map<string, NutritionLog[]> {
  const map = new Map<string, NutritionLog[]>();
  for (const log of logs) {
    const weekStart = format(startOfWeek(parseISO(log.date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const arr = map.get(weekStart) ?? [];
    arr.push(log);
    map.set(weekStart, arr);
  }
  return map;
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null);
  if (!valid.length) return null;
  return Math.round((valid.reduce((s, n) => s + n, 0) / valid.length) * 10) / 10;
}

export function calcWeeklyNutrition(logs: NutritionLog[]): WeeklyNutrition[] {
  const byWeek = groupByWeek(logs);
  const weeks: WeeklyNutrition[] = [];

  for (const [weekStart, entries] of byWeek) {
    weeks.push({
      weekStart,
      avgCalories: Math.round(entries.reduce((s, e) => s + e.calories, 0) / entries.length),
      avgProtein: avg(entries.map((e) => e.protein_g)),
      avgCarbs: avg(entries.map((e) => e.carbs_g)),
      avgFat: avg(entries.map((e) => e.fat_g)),
      count: entries.length,
    });
  }

  return weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function calcWeeklyChange(weeks: WeeklyNutrition[]): WeeklyNutritionChange | null {
  if (!weeks.length) return null;
  const current = weeks[weeks.length - 1];
  const previous = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  return {
    current,
    previous,
    calorieChange: previous ? current.avgCalories - previous.avgCalories : null,
  };
}

export interface DeficitEstimate {
  estimatedTDEE: number;
  avgDeficit: number;
}

// 3500 cal ≈ 1 lb of fat
export function estimateTDEE(
  nutritionLogs: NutritionLog[],
  weightLogs: WeightLog[],
  weeksBack = 4
): DeficitEstimate | null {
  if (!nutritionLogs.length || weightLogs.length < 2) return null;

  const sortedWeight = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const sortedNutrition = [...nutritionLogs].sort((a, b) => a.date.localeCompare(b.date));

  const cutoff = format(addWeeks(parseISO(sortedWeight[sortedWeight.length - 1].date), -weeksBack), 'yyyy-MM-dd');

  const recentNutrition = sortedNutrition.filter((l) => l.date >= cutoff);
  const recentWeight = sortedWeight.filter((l) => l.date >= cutoff);

  if (recentNutrition.length < 7 || recentWeight.length < 2) return null;

  const avgCalories = recentNutrition.reduce((s, l) => s + l.calories, 0) / recentNutrition.length;
  const weightChangeLbs = recentWeight[recentWeight.length - 1].weight - recentWeight[0].weight;
  const days = recentNutrition.length;
  const dailyWeightChange = weightChangeLbs / days;
  const dailyCalorieChangeFromWeight = dailyWeightChange * 3500;

  const estimatedTDEE = Math.round(avgCalories - dailyCalorieChangeFromWeight);
  const avgDeficit = Math.round(estimatedTDEE - avgCalories);

  return { estimatedTDEE, avgDeficit };
}
