import Papa from 'papaparse';
import { format, parse, isValid } from 'date-fns';
import type { NutritionLog } from '@/types';

export interface MFPParseResult {
  records: Omit<NutritionLog, 'id' | 'created_at'>[];
  errors: string[];
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, '_');
}

function parseDate(raw: string): string | null {
  const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'M/d/yyyy'];
  for (const fmt of formats) {
    try {
      const d = parse(raw.trim(), fmt, new Date());
      if (isValid(d)) return format(d, 'yyyy-MM-dd');
    } catch {
      // try next
    }
  }
  return null;
}

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === '' || val.trim() === '-') return null;
  const n = parseFloat(val.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

export function parseMyFitnessPalCSV(csvText: string): MFPParseResult {
  // MFP exports sometimes have metadata rows at the top; find the header row
  const lines = csvText.split('\n');
  let headerLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('date') && (lower.includes('calories') || lower.includes('calorie'))) {
      headerLineIdx = i;
      break;
    }
  }

  const csvToParse = headerLineIdx > 0 ? lines.slice(headerLineIdx).join('\n') : csvText;

  const result = Papa.parse<Record<string, string>>(csvToParse, {
    header: true,
    skipEmptyLines: true,
  });

  const records: Omit<NutritionLog, 'id' | 'created_at'>[] = [];
  const errors: string[] = [];

  if (!result.data.length) {
    errors.push('No data rows found in file.');
    return { records, errors };
  }

  const rawHeaders = result.meta.fields ?? [];
  const headerMap: Record<string, string> = {};
  for (const h of rawHeaders) {
    headerMap[normalizeHeader(h)] = h;
  }

  const dateCol = headerMap['date'];
  const calCol =
    headerMap['calories'] ??
    headerMap['calorie'] ??
    headerMap['energy_(kcal)'] ??
    headerMap['energy'];
  const proteinCol = headerMap['protein_(g)'] ?? headerMap['protein'];
  const carbsCol = headerMap['carbohydrates_(g)'] ?? headerMap['carbohydrates'] ?? headerMap['carbs'];
  const fatCol = headerMap['fat_(g)'] ?? headerMap['fat'];

  if (!dateCol) {
    errors.push('Could not find a Date column.');
    return { records, errors };
  }
  if (!calCol) {
    errors.push('Could not find a Calories column.');
    return { records, errors };
  }

  // MFP sometimes has summary rows per day — aggregate if multiple rows per date
  const byDate = new Map<string, Omit<NutritionLog, 'id' | 'created_at'>>();

  result.data.forEach((row, i) => {
    const rowNum = i + 2;
    const rawDate = row[dateCol]?.trim();
    const rawCal = row[calCol]?.trim();

    if (!rawDate || !rawCal) return;

    const date = parseDate(rawDate);
    if (!date) {
      errors.push(`Row ${rowNum}: Unrecognized date format "${rawDate}" — skipped.`);
      return;
    }

    const calories = parseNum(rawCal);
    if (calories === null) {
      errors.push(`Row ${rowNum}: Invalid calories value "${rawCal}" — skipped.`);
      return;
    }

    const existing = byDate.get(date);
    if (existing) {
      // Aggregate multiple meal rows for same day
      existing.calories += calories;
      if (proteinCol) existing.protein_g = (existing.protein_g ?? 0) + (parseNum(row[proteinCol]) ?? 0);
      if (carbsCol) existing.carbs_g = (existing.carbs_g ?? 0) + (parseNum(row[carbsCol]) ?? 0);
      if (fatCol) existing.fat_g = (existing.fat_g ?? 0) + (parseNum(row[fatCol]) ?? 0);
    } else {
      byDate.set(date, {
        date,
        calories,
        protein_g: proteinCol ? parseNum(row[proteinCol]) : null,
        carbs_g: carbsCol ? parseNum(row[carbsCol]) : null,
        fat_g: fatCol ? parseNum(row[fatCol]) : null,
      });
    }
  });

  records.push(...byDate.values());
  records.sort((a, b) => a.date.localeCompare(b.date));

  return { records, errors };
}
