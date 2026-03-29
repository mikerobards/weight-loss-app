import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import type { WeightLog } from '@/types';

export function movingAverage(data: { date: string; value: number }[], window: number): { date: string; value: number }[] {
  return data.map((point, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, p) => s + p.value, 0) / slice.length;
    return { date: point.date, value: Math.round(avg * 100) / 100 };
  });
}

export function calcRateOfLoss(logs: WeightLog[], windowDays = 14): number | null {
  if (logs.length < 2) return null;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-windowDays);
  if (recent.length < 2) return null;

  const days = differenceInDays(parseISO(recent[recent.length - 1].date), parseISO(recent[0].date));
  if (days === 0) return null;
  const weightChange = recent[recent.length - 1].weight - recent[0].weight;
  const weeksElapsed = days / 7;
  return Math.round((weightChange / weeksElapsed) * 100) / 100; // lbs/week (negative = loss)
}

export function projectGoalDate(
  currentWeight: number,
  targetWeight: number,
  ratePerWeek: number // negative for loss
): Date | null {
  if (ratePerWeek >= 0 || currentWeight <= targetWeight) return null;
  const weeksNeeded = (currentWeight - targetWeight) / Math.abs(ratePerWeek);
  return addDays(new Date(), Math.round(weeksNeeded * 7));
}

export function interpolateGaps(logs: WeightLog[]): WeightLog[] {
  if (logs.length < 2) return logs;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const result: WeightLog[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    result.push(sorted[i]);
    const curr = sorted[i];
    const next = sorted[i + 1];
    const gap = differenceInDays(parseISO(next.date), parseISO(curr.date));

    for (let d = 1; d < gap; d++) {
      const fraction = d / gap;
      const interpWeight = curr.weight + (next.weight - curr.weight) * fraction;
      result.push({
        date: format(addDays(parseISO(curr.date), d), 'yyyy-MM-dd'),
        weight: Math.round(interpWeight * 10) / 10,
        body_fat_pct:
          curr.body_fat_pct !== null && next.body_fat_pct !== null
            ? Math.round((curr.body_fat_pct + (next.body_fat_pct - curr.body_fat_pct) * fraction) * 10) / 10
            : null,
      });
    }
  }
  result.push(sorted[sorted.length - 1]);
  return result;
}

export function filterByTimeRange(
  logs: WeightLog[],
  range: '7d' | '30d' | '90d' | 'all'
): WeightLog[] {
  if (range === 'all') return logs;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = format(addDays(new Date(), -days), 'yyyy-MM-dd');
  return logs.filter((l) => l.date >= cutoff);
}
