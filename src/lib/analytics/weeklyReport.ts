import { subDays, format } from 'date-fns';
import type { WeightLog, NutritionLog } from '@/types';
import { calcRateOfLoss } from './trends';
import { calcWeeklyNutrition } from './nutrition';

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  avgWeight: number | null;
  avgBodyFat: number | null;
  avgCalories: number | null;
  avgProtein: number | null;
  avgCarbs: number | null;
  avgFat: number | null;
  rateOfLoss: number | null;
  prevWeek: {
    avgWeight: number | null;
    avgCalories: number | null;
  };
  weightChange: number | null;
  calorieChange: number | null;
  keyInsight: string;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

export function generateWeeklyReport(
  weightLogs: WeightLog[],
  nutritionLogs: NutritionLog[],
  weeksAgo = 0
): WeeklyReport {
  const today = new Date();
  const weekEnd = subDays(today, weeksAgo * 7);
  const weekStart = subDays(weekEnd, 6);
  const prevWeekEnd = subDays(weekStart, 1);
  const prevWeekStart = subDays(prevWeekEnd, 6);

  const wStart = format(weekStart, 'yyyy-MM-dd');
  const wEnd = format(weekEnd, 'yyyy-MM-dd');
  const pStart = format(prevWeekStart, 'yyyy-MM-dd');
  const pEnd = format(prevWeekEnd, 'yyyy-MM-dd');

  const currWeightLogs = weightLogs.filter((l) => l.date >= wStart && l.date <= wEnd);
  const prevWeightLogs = weightLogs.filter((l) => l.date >= pStart && l.date <= pEnd);
  const currNutritionLogs = nutritionLogs.filter((l) => l.date >= wStart && l.date <= wEnd);
  const prevNutritionLogs = nutritionLogs.filter((l) => l.date >= pStart && l.date <= pEnd);

  const avgWeight = avg(currWeightLogs.map((l) => l.weight));
  const avgBodyFat = avg(currWeightLogs.filter((l) => l.body_fat_pct !== null).map((l) => l.body_fat_pct!));
  const avgCalories = avg(currNutritionLogs.map((l) => l.calories));
  const avgProtein = avg(currNutritionLogs.filter((l) => l.protein_g !== null).map((l) => l.protein_g!));
  const avgCarbs = avg(currNutritionLogs.filter((l) => l.carbs_g !== null).map((l) => l.carbs_g!));
  const avgFat = avg(currNutritionLogs.filter((l) => l.fat_g !== null).map((l) => l.fat_g!));

  const prevAvgWeight = avg(prevWeightLogs.map((l) => l.weight));
  const prevAvgCalories = avg(prevNutritionLogs.map((l) => l.calories));

  const recentLogs = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const rateOfLoss = calcRateOfLoss(recentLogs);

  const weightChange = avgWeight !== null && prevAvgWeight !== null ? Math.round((avgWeight - prevAvgWeight) * 10) / 10 : null;
  const calorieChange = avgCalories !== null && prevAvgCalories !== null ? Math.round(avgCalories - prevAvgCalories) : null;

  // Generate key insight
  let keyInsight = 'Not enough data to generate an insight yet.';
  if (avgWeight !== null && rateOfLoss !== null) {
    const direction = rateOfLoss < 0 ? 'down' : rateOfLoss > 0 ? 'up' : 'flat';
    const rate = Math.abs(rateOfLoss).toFixed(1);
    if (calorieChange !== null && Math.abs(calorieChange) > 50) {
      const calDir = calorieChange < 0 ? 'dropped' : 'increased';
      keyInsight = `Your average intake ${calDir} ${Math.abs(calorieChange)} cal/day and your trend is ${direction} ${rate} lbs/week.`;
    } else {
      keyInsight = `Your weight trend is ${direction} ${rate} lbs/week. Average weight this week: ${avgWeight} lbs.`;
    }
  }

  return {
    weekStart: wStart,
    weekEnd: wEnd,
    avgWeight,
    avgBodyFat,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    rateOfLoss,
    prevWeek: { avgWeight: prevAvgWeight, avgCalories: prevAvgCalories },
    weightChange,
    calorieChange,
    keyInsight,
  };
}
