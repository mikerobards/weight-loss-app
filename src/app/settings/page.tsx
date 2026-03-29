'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  ToggleButton, ToggleButtonGroup, Alert, Skeleton,
} from '@mui/material';
import { getUserSettings, saveUserSettings } from '@/lib/database';
import type { UserSettings } from '@/types';

const LOSS_RATES = [0.5, 1.0, 1.5, 2.0];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [targetWeight, setTargetWeight] = useState('');
  const [targetBodyFat, setTargetBodyFat] = useState('');
  const [weeklyRate, setWeeklyRate] = useState(1.0);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');

  useEffect(() => {
    async function load() {
      try {
        const s = await getUserSettings();
        if (s) {
          setTargetWeight(s.target_weight?.toString() ?? '');
          setTargetBodyFat(s.target_body_fat?.toString() ?? '');
          setWeeklyRate(s.weekly_loss_rate);
          setUnitSystem(s.unit_system);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const settings: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'> = {
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        target_body_fat: targetBodyFat ? parseFloat(targetBodyFat) : null,
        weekly_loss_rate: weeklyRate,
        unit_system: unitSystem,
      };
      await saveUserSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box maxWidth={520}>
      <Typography variant="h5" fontWeight={700} mb={3}>Settings & Goals</Typography>

      {loading ? (
        <Skeleton height={400} />
      ) : (
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label={`Target Weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`}
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              inputProps={{ min: 0, step: 0.1 }}
              fullWidth
            />

            <TextField
              label="Target Body Fat %"
              type="number"
              value={targetBodyFat}
              onChange={(e) => setTargetBodyFat(e.target.value)}
              inputProps={{ min: 2, max: 60, step: 0.1 }}
              fullWidth
              helperText="Optional"
            />

            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Weekly Loss Rate
              </Typography>
              <ToggleButtonGroup
                value={weeklyRate}
                exclusive
                onChange={(_, v) => v && setWeeklyRate(v)}
                fullWidth
              >
                {LOSS_RATES.map((r) => (
                  <ToggleButton key={r} value={r}>
                    {r} lbs/wk
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Unit System
              </Typography>
              <ToggleButtonGroup
                value={unitSystem}
                exclusive
                onChange={(_, v) => v && setUnitSystem(v)}
              >
                <ToggleButton value="imperial">Imperial (lbs)</ToggleButton>
                <ToggleButton value="metric">Metric (kg)</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">Settings saved!</Alert>}

            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
