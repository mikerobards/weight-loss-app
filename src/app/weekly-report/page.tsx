'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, IconButton,
  Skeleton, useTheme,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { getWeightLogs, getNutritionLogs } from '@/lib/database';
import type { WeightLog, NutritionLog } from '@/types';
import { generateWeeklyReport, type WeeklyReport } from '@/lib/analytics/weeklyReport';
import EmptyState from '@/components/EmptyState';

function TrendChip({ change, unit }: { change: number | null; unit: string }) {
  if (change === null) return <Chip label="—" size="small" />;
  const isDown = change < 0;
  const isUp = change > 0;
  return (
    <Chip
      size="small"
      icon={isDown ? <TrendingDownIcon /> : isUp ? <TrendingUpIcon /> : <TrendingFlatIcon />}
      label={`${change > 0 ? '+' : ''}${change} ${unit}`}
      color={isDown ? 'success' : isUp ? 'error' : 'default'}
    />
  );
}

export default function WeeklyReportPage() {
  const theme = useTheme();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeksAgo, setWeeksAgo] = useState(0);
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [w, n] = await Promise.all([getWeightLogs(), getNutritionLogs()]);
        setWeightLogs(w);
        setNutritionLogs(n);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading) {
      setReport(generateWeeklyReport(weightLogs, nutritionLogs, weeksAgo));
    }
  }, [weightLogs, nutritionLogs, weeksAgo, loading]);

  const accentColor = theme.palette.warning.main;

  if (!loading && !weightLogs.length && !nutritionLogs.length) {
    return <EmptyState title="No data for weekly report" />;
  }

  return (
    <Box>
      {/* Header with week selector */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
          Weekly Report
        </Typography>
        <IconButton onClick={() => setWeeksAgo((w) => w + 1)} size="small">
          <NavigateBeforeIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary" minWidth={120} textAlign="center">
          {report ? `${report.weekStart} → ${report.weekEnd}` : '—'}
        </Typography>
        <IconButton onClick={() => setWeeksAgo((w) => Math.max(0, w - 1))} disabled={weeksAgo === 0} size="small">
          <NavigateNextIcon />
        </IconButton>
      </Box>

      {/* Key Insight Card */}
      <Card sx={{ mb: 3, borderLeft: `4px solid ${accentColor}` }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <LightbulbIcon sx={{ color: accentColor }} />
            <Typography variant="overline" color="text.secondary">Key Insight</Typography>
          </Box>
          {loading ? <Skeleton height={32} /> : (
            <Typography variant="body1" fontWeight={500}>
              {report?.keyInsight}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {[
          {
            label: 'Avg Weight',
            value: report?.avgWeight ? `${report.avgWeight} lbs` : '—',
            change: report?.weightChange ?? null,
            unit: 'lbs',
          },
          {
            label: 'Avg Body Fat',
            value: report?.avgBodyFat ? `${report.avgBodyFat}%` : '—',
            change: null,
            unit: '%',
          },
          {
            label: 'Avg Calories',
            value: report?.avgCalories ? `${report.avgCalories} kcal` : '—',
            change: report?.calorieChange ?? null,
            unit: 'kcal',
          },
          {
            label: 'Rate of Loss',
            value: report?.rateOfLoss != null ? `${Math.abs(report.rateOfLoss)} lbs/wk` : '—',
            change: null,
            unit: '',
          },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card>
              <CardContent>
                <Typography variant="overline" color="text.secondary">{stat.label}</Typography>
                {loading ? <Skeleton height={48} /> : (
                  <>
                    <Typography variant="h5" fontWeight={700} color="primary">{stat.value}</Typography>
                    {stat.change !== null && <TrendChip change={stat.change} unit={stat.unit} />}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Macro breakdown */}
        {(loading || report?.avgProtein != null) && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>Macro Averages</Typography>
                {loading ? <Skeleton height={60} /> : (
                  <Grid container spacing={2}>
                    {[
                      { label: 'Protein', value: report?.avgProtein },
                      { label: 'Carbs', value: report?.avgCarbs },
                      { label: 'Fat', value: report?.avgFat },
                    ].map((m) => (
                      <Grid size={{ xs: 4 }} key={m.label}>
                        <Typography variant="body2" color="text.secondary">{m.label}</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {m.value != null ? `${m.value}g` : '—'}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
