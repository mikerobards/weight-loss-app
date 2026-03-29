'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, ToggleButton, ToggleButtonGroup,
  Skeleton, Grid, useTheme,
} from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { getWeightLogs, getUserSettings } from '@/lib/database';
import type { WeightLog, TimeRange, MovingAverageWindow, UserSettings } from '@/types';
import {
  movingAverage, calcRateOfLoss, projectGoalDate,
  filterByTimeRange, interpolateGaps,
} from '@/lib/analytics/trends';
import EmptyState from '@/components/EmptyState';

export default function TrendsPage() {
  const theme = useTheme();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [maWindow, setMaWindow] = useState<MovingAverageWindow>(7);

  useEffect(() => {
    async function load() {
      try {
        const [w, s] = await Promise.all([getWeightLogs(), getUserSettings()]);
        setLogs(w);
        setSettings(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filterByTimeRange(logs, timeRange);
  const interpolated = interpolateGaps(filtered);

  const weightMA = movingAverage(
    interpolated.map((l) => ({ date: l.date, value: l.weight })),
    maWindow
  );
  const bfMA = movingAverage(
    interpolated.filter((l) => l.body_fat_pct !== null).map((l) => ({ date: l.date, value: l.body_fat_pct! })),
    maWindow
  );

  const chartData = interpolated.map((l, i) => ({
    date: l.date,
    weight: l.weight,
    weightMA: weightMA[i]?.value,
    bodyFat: l.body_fat_pct,
    bodyFatMA: bfMA.find((b) => b.date === l.date)?.value,
  }));

  const rateOfLoss = calcRateOfLoss(logs);
  const projectedDate =
    rateOfLoss && settings?.target_weight && logs.length
      ? projectGoalDate(logs[logs.length - 1].weight, settings.target_weight, rateOfLoss)
      : null;

  const totalLost =
    logs.length > 1 ? Math.round((logs[0].weight - logs[logs.length - 1].weight) * 10) / 10 : null;

  const primaryColor = theme.palette.primary.main;
  const accentColor = theme.palette.warning.main;
  const secondaryColor = theme.palette.secondary.main;

  if (!loading && !logs.length) {
    return <EmptyState title="No body composition data" />;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Body Composition Trends</Typography>

      {/* Summary Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Rate of Loss', value: rateOfLoss ? `${Math.abs(rateOfLoss)} lbs/wk` : '—' },
          { label: 'Total Lost', value: totalLost ? `${totalLost > 0 ? totalLost : 0} lbs` : '—' },
          {
            label: 'Projected Goal',
            value: projectedDate ? format(projectedDate, 'MMM d, yyyy') : '—',
          },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="overline" color="text.secondary">{stat.label}</Typography>
                <Typography variant="h6" fontWeight={600} color="primary">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={2} alignItems="center">
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(_, v) => v && setTimeRange(v)}
          size="small"
        >
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((r) => (
            <ToggleButton key={r} value={r}>{r}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">Moving avg:</Typography>
          <ToggleButtonGroup
            value={maWindow}
            exclusive
            onChange={(_, v) => v && setMaWindow(v)}
            size="small"
          >
            {([7, 14, 21] as MovingAverageWindow[]).map((w) => (
              <ToggleButton key={w} value={w}>{w}d</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Weight Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Weight</Typography>
          {loading ? (
            <Skeleton height={280} />
          ) : (
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} unit=" lbs" />
                  <Tooltip formatter={(v) => [`${v} lbs`]} />
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke={primaryColor} strokeWidth={1.5} dot={false} name="Weight" />
                  <Line type="monotone" dataKey="weightMA" stroke={accentColor} strokeWidth={2.5} dot={false} name={`${maWindow}d avg`} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Body Fat Chart */}
      {(loading || chartData.some((d) => d.bodyFat !== null)) && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Body Fat %</Typography>
            {loading ? (
              <Skeleton height={280} />
            ) : (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`]} />
                    <Legend />
                    <Line type="monotone" dataKey="bodyFat" stroke={secondaryColor} strokeWidth={1.5} dot={false} name="Body Fat %" />
                    <Line type="monotone" dataKey="bodyFatMA" stroke={accentColor} strokeWidth={2.5} dot={false} name={`${maWindow}d avg`} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
