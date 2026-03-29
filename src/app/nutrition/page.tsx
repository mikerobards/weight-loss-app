'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Skeleton, useTheme,
} from '@mui/material';
import {
  ResponsiveContainer, LineChart, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getNutritionLogs, getWeightLogs } from '@/lib/database';
import type { NutritionLog, WeightLog } from '@/types';
import { calcWeeklyNutrition, calcWeeklyChange, estimateTDEE } from '@/lib/analytics/nutrition';
import EmptyState from '@/components/EmptyState';

export default function NutritionPage() {
  const theme = useTheme();
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [n, w] = await Promise.all([getNutritionLogs(), getWeightLogs()]);
        setNutritionLogs(n);
        setWeightLogs(w);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const weeklyData = calcWeeklyNutrition(nutritionLogs);
  const weeklyChange = calcWeeklyChange(weeklyData);
  const tdee = estimateTDEE(nutritionLogs, weightLogs);

  const primaryColor = theme.palette.primary.main;
  const accentColor = theme.palette.warning.main;

  if (!loading && !nutritionLogs.length) {
    return <EmptyState title="No nutrition data" />;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Nutrition Overview</Typography>

      {/* Latest week summary */}
      <Grid container spacing={2} mb={3}>
        {[
          {
            label: 'Avg Calories (this week)',
            value: weeklyChange?.current.avgCalories ? `${weeklyChange.current.avgCalories} kcal` : '—',
          },
          {
            label: 'vs. Last Week',
            value:
              weeklyChange?.calorieChange != null
                ? `${weeklyChange.calorieChange > 0 ? '+' : ''}${weeklyChange.calorieChange} kcal`
                : '—',
          },
          {
            label: 'Est. TDEE',
            value: tdee ? `${tdee.estimatedTDEE} kcal` : '—',
          },
          {
            label: 'Avg Deficit',
            value: tdee ? `${tdee.avgDeficit} kcal/day` : '—',
          },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="overline" color="text.secondary">{stat.label}</Typography>
                <Typography variant="h6" fontWeight={600} color="primary">{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Weekly Calorie Trend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Weekly Average Calories</Typography>
          {loading ? (
            <Skeleton height={260} />
          ) : (
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="weekStart" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} kcal`, 'Avg Calories']} />
                  <Line type="monotone" dataKey="avgCalories" stroke={primaryColor} strokeWidth={2} dot={false} name="Avg Calories" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Macro Bar Chart */}
      {(loading || weeklyData.some((w) => w.avgProtein !== null)) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Weekly Macro Breakdown</Typography>
            {loading ? (
              <Skeleton height={260} />
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="weekStart" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} unit="g" />
                    <Tooltip formatter={(v) => [`${v}g`]} />
                    <Legend />
                    <Bar dataKey="avgProtein" name="Protein" fill={primaryColor} stackId="macros" />
                    <Bar dataKey="avgCarbs" name="Carbs" fill={accentColor} stackId="macros" />
                    <Bar dataKey="avgFat" name="Fat" fill={theme.palette.secondary.main} stackId="macros" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
