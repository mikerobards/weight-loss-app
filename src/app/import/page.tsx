'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Grid, useTheme,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { parseWeightGurusCSV } from '@/lib/parsers/weightGurus';
import { parseMyFitnessPalCSV } from '@/lib/parsers/myFitnessPal';
import { processWeightImport, processNutritionImport } from '@/lib/importProcessor';
import { getImportHistory } from '@/lib/database';
import type { WeightLog, NutritionLog, ImportHistory, ImportResult } from '@/types';

type ParsedSource = 'weight_gurus' | 'mfp' | null;

function detectSource(text: string): ParsedSource {
  const lower = text.toLowerCase();
  if (lower.includes('weight gurus') || (lower.includes('body_fat') && lower.includes('weight'))) {
    return 'weight_gurus';
  }
  if (lower.includes('myfitnesspal') || lower.includes('protein') || lower.includes('carbohydrates')) {
    return 'mfp';
  }
  return null;
}

export default function ImportPage() {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [history, setHistory] = useState<ImportHistory[]>([]);

  const [fileName, setFileName] = useState('');
  const [source, setSource] = useState<ParsedSource>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [weightPreview, setWeightPreview] = useState<Omit<WeightLog, 'id' | 'created_at'>[] | null>(null);
  const [nutritionPreview, setNutritionPreview] = useState<Omit<NutritionLog, 'id' | 'created_at'>[] | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    getImportHistory().then(setHistory).catch(console.error);
  }, []);

  function reset() {
    setFileName('');
    setSource(null);
    setParseErrors([]);
    setWeightPreview(null);
    setNutritionPreview(null);
    setImportResult(null);
    setImportError('');
  }

  async function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setParseErrors(['Only .csv files are supported.']);
      return;
    }
    reset();
    setProcessing(true);
    setFileName(file.name);

    const text = await file.text();
    const detected = detectSource(text);
    setSource(detected);

    if (detected === 'weight_gurus') {
      const { records, errors } = parseWeightGurusCSV(text);
      setWeightPreview(records);
      setParseErrors(errors);
    } else if (detected === 'mfp') {
      const { records, errors } = parseMyFitnessPalCSV(text);
      setNutritionPreview(records);
      setParseErrors(errors);
    } else {
      setParseErrors(['Could not detect file source. Ensure it is a Weight Gurus or MyFitnessPal CSV.']);
    }
    setProcessing(false);
  }

  async function handleImport() {
    if (!fileName) return;
    setImporting(true);
    setImportError('');
    try {
      let result: ImportResult;
      if (source === 'weight_gurus' && weightPreview) {
        result = await processWeightImport(weightPreview, fileName);
      } else if (source === 'mfp' && nutritionPreview) {
        result = await processNutritionImport(nutritionPreview, fileName);
      } else {
        throw new Error('No parsed data to import');
      }
      setImportResult(result);
      const updated = await getImportHistory();
      setHistory(updated);
      setWeightPreview(null);
      setNutritionPreview(null);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const preview = weightPreview ?? nutritionPreview;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Data Import</Typography>

      {/* Drop Zone */}
      <Card
        sx={{
          mb: 3,
          border: `2px dashed ${dragging ? theme.palette.primary.main : theme.palette.divider}`,
          bgcolor: dragging ? theme.palette.primary.main + '10' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            Drag & drop a CSV file here
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Weight Gurus or MyFitnessPal export — or click to browse
          </Typography>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </CardContent>
      </Card>

      {processing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <Box mb={2}>
          {parseErrors.map((err, i) => (
            <Alert key={i} severity="warning" sx={{ mb: 1 }}>{err}</Alert>
          ))}
        </Box>
      )}

      {/* Detected source */}
      {source && (
        <Box display="flex" gap={1} alignItems="center" mb={2}>
          <Typography variant="body2">Detected:</Typography>
          <Chip
            label={source === 'weight_gurus' ? 'Weight Gurus' : 'MyFitnessPal'}
            color="primary"
            size="small"
          />
          {preview && (
            <Typography variant="body2" color="text.secondary">
              {preview.length} records parsed
            </Typography>
          )}
        </Box>
      )}

      {/* Preview table */}
      {preview && preview.length > 0 && !importResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Preview (first 10 rows)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {weightPreview ? (
                      <>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Weight</TableCell>
                        <TableCell align="right">Body Fat %</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Calories</TableCell>
                        <TableCell align="right">Protein (g)</TableCell>
                        <TableCell align="right">Carbs (g)</TableCell>
                        <TableCell align="right">Fat (g)</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.date}</TableCell>
                      {weightPreview ? (
                        <>
                          <TableCell align="right">{(row as WeightLog).weight}</TableCell>
                          <TableCell align="right">{(row as WeightLog).body_fat_pct ?? '—'}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell align="right">{(row as NutritionLog).calories}</TableCell>
                          <TableCell align="right">{(row as NutritionLog).protein_g ?? '—'}</TableCell>
                          <TableCell align="right">{(row as NutritionLog).carbs_g ?? '—'}</TableCell>
                          <TableCell align="right">{(row as NutritionLog).fat_g ?? '—'}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={importing}
                startIcon={<CheckCircleIcon />}
              >
                {importing ? 'Importing…' : `Import ${preview.length} records`}
              </Button>
              <Button variant="outlined" onClick={reset}>Cancel</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Import result */}
      {importResult && (
        <Alert
          severity={importResult.errors.length ? 'warning' : 'success'}
          sx={{ mb: 3 }}
          action={<Button size="small" onClick={reset}>Import another</Button>}
        >
          Added {importResult.added} records, skipped {importResult.skipped} duplicates.
          {importResult.errors.length > 0 && ` ${importResult.errors.length} error(s).`}
        </Alert>
      )}

      {importError && <Alert severity="error" sx={{ mb: 3 }}>{importError}</Alert>}

      {/* Import History */}
      <Typography variant="h6" fontWeight={600} mb={2}>Import History</Typography>
      {history.length === 0 ? (
        <Typography color="text.disabled">No imports yet.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>File</TableCell>
                <TableCell align="right">Added</TableCell>
                <TableCell align="right">Skipped</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.imported_at?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Chip
                      label={h.source === 'weight_gurus' ? 'Weight Gurus' : 'MyFitnessPal'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.file_name}
                  </TableCell>
                  <TableCell align="right">{h.records_added}</TableCell>
                  <TableCell align="right">{h.records_skipped}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
