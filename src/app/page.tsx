'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Skeleton, useTheme,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { format, subDays } from 'date-fns';
import { getWeightLogs, getNutritionLogs, getUserSettings } from '@/lib/database';
import type { WeightLog, NutritionLog, UserSettings } from '@/types';
import { calcRateOfLoss } from '@/lib/analytics/trends';
import EmptyState from '@/components/EmptyState';

export default function DashboardPage() {
  const theme = useTheme();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cutoff = format(subDays(new Date(), 60), 'yyyy-MM-dd');
        const [w, n, s] = await Promise.all([
          getWeightLogs(cutoff),
          getNutritionLogs(cutoff),
          getUserSettings(),
        ]);
        setWeightLogs(w);
        setNutritionLogs(n);
        setSettings(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const latest = weightLogs[weightLogs.length - 1] ?? null;
  const latestNutrition = nutritionLogs[nutritionLogs.length - 1] ?? null;
  const rateOfLoss = calcRateOfLoss(weightLogs);
  const sparkData = weightLogs.slice(-14).map((l) => ({ date: l.date, weight: l.weight }));

  const goalPct =
    latest && settings?.target_weight && weightLogs[0]
      ? Math.min(
          100,
          Math.round(
            ((weightLogs[0].weight - latest.weight) /
              (weightLogs[0].weight - settings.target_weight)) *
              100
          )
        )
      : null;

  const trendIcon =
    rateOfLoss === null ? null : rateOfLoss < -0.1 ? (
      <TrendingDownIcon sx={{ color: theme.palette.primary.main }} />
    ) : rateOfLoss > 0.1 ? (
      <TrendingUpIcon color="error" />
    ) : (
      <TrendingFlatIcon color="warning" />
    );

  const primaryColor = theme.palette.primary.main;

  if (!loading && !weightLogs.length && !nutritionLogs.length) {
    return <EmptyState title="Welcome to WeightIQ" description="Import your first data file to see your dashboard." />;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Daily Snapshot */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Latest Weight
              </Typography>
              {loading ? (
                <Skeleton height={56} />
              ) : latest ? (
                <>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    {latest.weight} lbs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {latest.date}
                  </Typography>
                  {latest.body_fat_pct !== null && (
                    <Chip
                      label={`${latest.body_fat_pct}% body fat`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </>
              ) : (
                <Typography color="text.disabled" mt={1}>No weight data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Direction */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Trend Direction
              </Typography>
              {loading ? (
                <Skeleton height={56} />
              ) : rateOfLoss !== null ? (
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  {trendIcon}
                  <Typography variant="h5" fontWeight={600}>
                    {rateOfLoss < 0
                      ? `${Math.abs(rateOfLoss)} lbs/wk loss`
                      : rateOfLoss > 0
                      ? `${rateOfLoss} lbs/wk gain`
                      : 'Stable'}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.disabled" mt={1}>Need more data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Calories */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Latest Calories
              </Typography>
              {loading ? (
                <Skeleton height={56} />
              ) : latestNutrition ? (
                <>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    {latestNutrition.calories.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {latestNutrition.date}
                  </Typography>
                </>
              ) : (
                <Typography color="text.disabled" mt={1}>No nutrition data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Goal Progress */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Goal Progress
              </Typography>
              {loading ? (
                <Skeleton height={56} />
              ) : goalPct !== null && settings?.target_weight ? (
                <>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    {goalPct}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Target: {settings.target_weight} lbs
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${Math.max(0, goalPct)}%`,
                        bgcolor: primaryColor,
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Typography color="text.disabled" mt={1}>Set a target in Settings</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 14-day Sparkline */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                14-Day Weight Trend
              </Typography>
              {loading ? (
                <Skeleton height={120} />
              ) : sparkData.length > 1 ? (
                <Box sx={{ height: 120, mt: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <Tooltip
                        formatter={(v) => [`${v} lbs`, 'Weight']}
                        labelFormatter={(l) => l}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke={primaryColor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography color="text.disabled" mt={1}>Not enough data for trend chart</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
