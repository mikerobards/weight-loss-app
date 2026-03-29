import { differenceInDays, parseISO, format } from 'date-fns';
import type { WeightLog, NutritionLog, Milestone } from '@/types';

export interface MilestoneCheck {
  title: string;
  achieved: boolean;
  achieved_at: string | null;
}

export function detectWeightMilestones(
  logs: WeightLog[],
  startWeight: number
): MilestoneCheck[] {
  if (!logs.length) return [];
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const current = sorted[sorted.length - 1];
  const totalLost = startWeight - current.weight;
  const milestones: MilestoneCheck[] = [];

  for (let threshold = 5; threshold <= 100; threshold += 5) {
    const achieved = totalLost >= threshold;
    milestones.push({
      title: `Lost ${threshold} lbs`,
      achieved,
      achieved_at: achieved
        ? (sorted.find((l) => startWeight - l.weight >= threshold)?.date ?? null)
        : null,
    });
    if (threshold > totalLost + 20) break;
  }

  return milestones;
}

export function detectBodyFatMilestones(logs: WeightLog[]): MilestoneCheck[] {
  const withBf = logs.filter((l) => l.body_fat_pct !== null).sort((a, b) => a.date.localeCompare(b.date));
  if (!withBf.length) return [];

  const startBf = withBf[0].body_fat_pct!;
  const milestones: MilestoneCheck[] = [];

  for (let threshold = 1; threshold <= 20; threshold++) {
    const targetBf = startBf - threshold;
    if (targetBf < 2) break;
    const achievedLog = withBf.find((l) => l.body_fat_pct! <= targetBf);
    milestones.push({
      title: `Body fat below ${Math.round(targetBf)}%`,
      achieved: !!achievedLog,
      achieved_at: achievedLog?.date ?? null,
    });
    if (threshold > 5 && !achievedLog) break;
  }

  return milestones;
}

export function calcStreak(weightLogs: WeightLog[], nutritionLogs: NutritionLog[]): { current: number; longest: number } {
  const weightDates = new Set(weightLogs.map((l) => l.date));
  const nutritionDates = new Set(nutritionLogs.map((l) => l.date));

  // Get all dates that have both weight and nutrition data
  const allDates = [...new Set([...weightDates, ...nutritionDates])].sort();
  if (!allDates.length) return { current: 0, longest: 0 };

  let longest = 0;
  let current = 0;
  let streak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];
    const hasData = weightDates.has(date) || nutritionDates.has(date);

    if (hasData) {
      if (i === 0) {
        streak = 1;
      } else {
        const prev = allDates[i - 1];
        const gap = differenceInDays(parseISO(date), parseISO(prev));
        streak = gap <= 1 ? streak + 1 : 1;
      }
      longest = Math.max(longest, streak);
    }
  }

  // Current streak: count backwards from today
  current = 0;
  let checkDate = today;
  while (weightDates.has(checkDate) || nutritionDates.has(checkDate)) {
    current++;
    const prev = format(
      new Date(new Date(checkDate).getTime() - 86400000),
      'yyyy-MM-dd'
    );
    checkDate = prev;
  }

  return { current, longest };
}

export function getPersonalRecords(logs: WeightLog[]): {
  lowestWeight: WeightLog | null;
  lowestBodyFat: WeightLog | null;
} {
  if (!logs.length) return { lowestWeight: null, lowestBodyFat: null };

  const lowestWeight = logs.reduce((min, l) => (l.weight < min.weight ? l : min));
  const withBf = logs.filter((l) => l.body_fat_pct !== null);
  const lowestBodyFat = withBf.length
    ? withBf.reduce((min, l) => (l.body_fat_pct! < min.body_fat_pct! ? l : min))
    : null;

  return { lowestWeight, lowestBodyFat };
}

export const STREAK_MILESTONES = [7, 14, 30, 60, 90] as const;
