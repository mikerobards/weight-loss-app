import Papa from 'papaparse';
import { format, parse, isValid } from 'date-fns';
import type { WeightLog } from '@/types';

export interface ParseResult {
  records: Omit<WeightLog, 'id' | 'created_at'>[];
  errors: string[];
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, '_');
}

function parseDate(raw: string): string | null {
  const formats = ['MM/dd/yyyy', 'yyyy-MM-dd', 'M/d/yyyy', 'MM-dd-yyyy'];
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

export function parseWeightGurusCSV(csvText: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const records: Omit<WeightLog, 'id' | 'created_at'>[] = [];
  const errors: string[] = [];

  if (!result.data.length) {
    errors.push('No data rows found in file.');
    return { records, errors };
  }

  // Normalize headers
  const rawHeaders = result.meta.fields ?? [];
  const headerMap: Record<string, string> = {};
  for (const h of rawHeaders) {
    headerMap[normalizeHeader(h)] = h;
  }

  // Detect columns
  const dateCol = headerMap['date'] ?? headerMap['measurement_date'];
  const weightCol =
    headerMap['weight'] ??
    headerMap['weight_(lbs)'] ??
    headerMap['weight_(kg)'] ??
    headerMap['weight_lbs'] ??
    headerMap['weight_kg'];
  const bfCol =
    headerMap['body_fat_%'] ??
    headerMap['body_fat_percentage'] ??
    headerMap['body_fat'] ??
    headerMap['fat_%'] ??
    headerMap['fat_percentage'];

  if (!dateCol) {
    errors.push('Could not find a Date column. Expected "Date" or "Measurement Date".');
    return { records, errors };
  }
  if (!weightCol) {
    errors.push('Could not find a Weight column. Expected "Weight (lbs)" or "Weight (kg)".');
    return { records, errors };
  }

  result.data.forEach((row, i) => {
    const rowNum = i + 2; // 1-indexed with header
    const rawDate = row[dateCol]?.trim();
    const rawWeight = row[weightCol]?.trim();
    const rawBf = bfCol ? row[bfCol]?.trim() : undefined;

    if (!rawDate || !rawWeight) {
      errors.push(`Row ${rowNum}: Missing date or weight — skipped.`);
      return;
    }

    const date = parseDate(rawDate);
    if (!date) {
      errors.push(`Row ${rowNum}: Unrecognized date format "${rawDate}" — skipped.`);
      return;
    }

    const weight = parseFloat(rawWeight);
    if (isNaN(weight) || weight <= 0 || weight > 1000) {
      errors.push(`Row ${rowNum}: Invalid weight value "${rawWeight}" — skipped.`);
      return;
    }

    let body_fat_pct: number | null = null;
    if (rawBf && rawBf !== '' && rawBf !== '-' && rawBf !== 'N/A') {
      const bf = parseFloat(rawBf.replace('%', ''));
      if (!isNaN(bf) && bf >= 0 && bf <= 100) {
        body_fat_pct = bf;
      }
    }

    records.push({ date, weight, body_fat_pct });
  });

  return { records, errors };
}
