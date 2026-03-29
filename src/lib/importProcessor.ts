import {
  getExistingWeightDates,
  getExistingNutritionDates,
  upsertWeightLogs,
  upsertNutritionLogs,
  logImport,
} from './database';
import type { WeightLog, NutritionLog, ImportResult } from '@/types';

export async function processWeightImport(
  records: Omit<WeightLog, 'id' | 'created_at'>[],
  fileName: string
): Promise<ImportResult> {
  const errors: string[] = [];

  try {
    const existingDates = await getExistingWeightDates();
    const newRecords = records.filter((r) => !existingDates.has(r.date));
    const skipped = records.length - newRecords.length;

    let added = 0;
    if (newRecords.length > 0) {
      added = await upsertWeightLogs(newRecords);
    }

    await logImport({
      source: 'weight_gurus',
      file_name: fileName,
      records_added: added,
      records_skipped: skipped,
    });

    return { added, skipped, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error during import';
    errors.push(msg);
    return { added: 0, skipped: 0, errors };
  }
}

export async function processNutritionImport(
  records: Omit<NutritionLog, 'id' | 'created_at'>[],
  fileName: string
): Promise<ImportResult> {
  const errors: string[] = [];

  try {
    const existingDates = await getExistingNutritionDates();
    const newRecords = records.filter((r) => !existingDates.has(r.date));
    const skipped = records.length - newRecords.length;

    let added = 0;
    if (newRecords.length > 0) {
      added = await upsertNutritionLogs(newRecords);
    }

    await logImport({
      source: 'mfp',
      file_name: fileName,
      records_added: added,
      records_skipped: skipped,
    });

    return { added, skipped, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error during import';
    errors.push(msg);
    return { added: 0, skipped: 0, errors };
  }
}
