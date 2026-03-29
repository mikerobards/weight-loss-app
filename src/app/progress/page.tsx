'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  List, ListItem, ListItemIcon, ListItemText, Divider, Skeleton,
  useTheme,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AddIcon from '@mui/icons-material/Add';
import { getWeightLogs, getNutritionLogs, getMilestones, createMilestone, updateMilestone } from '@/lib/database';
import type { WeightLog, NutritionLog, Milestone } from '@/types';
import {
  detectWeightMilestones, detectBodyFatMilestones, calcStreak,
  getPersonalRecords, STREAK_MILESTONES,
} from '@/lib/analytics/milestones';
import EmptyState from '@/components/EmptyState';

export default function ProgressPage() {
  const theme = useTheme();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [w, n, m] = await Promise.all([getWeightLogs(), getNutritionLogs(), getMilestones()]);
        setWeightLogs(w);
        setNutritionLogs(n);
        setMilestones(m);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const streak = calcStreak(weightLogs, nutritionLogs);
  const records = getPersonalRecords(weightLogs);
  const startWeight = weightLogs[0]?.weight ?? 0;
  const weightMilestones = detectWeightMilestones(weightLogs, startWeight);
  const bfMilestones = detectBodyFatMilestones(weightLogs);

  const accentColor = theme.palette.warning.main;
  const primaryColor = theme.palette.primary.main;

  async function handleAddMilestone() {
    if (!newTitle.trim()) return;
    const m = await createMilestone({ title: newTitle.trim(), type: 'custom', achieved: false, achieved_at: null });
    setMilestones((prev) => [...prev, m]);
    setNewTitle('');
    setDialogOpen(false);
  }

  async function handleToggleMilestone(m: Milestone) {
    if (!m.id) return;
    const updates = {
      achieved: !m.achieved,
      achieved_at: !m.achieved ? new Date().toISOString().split('T')[0] : null,
    };
    await updateMilestone(m.id, updates);
    setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...updates } : x)));
  }

  if (!loading && !weightLogs.length) {
    return <EmptyState title="No progress data yet" />;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Progress & Milestones</Typography>

      <Grid container spacing={3}>
        {/* Streak Counter */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderColor: accentColor }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocalFireDepartmentIcon sx={{ color: accentColor }} />
                <Typography variant="overline" color="text.secondary">Current Streak</Typography>
              </Box>
              {loading ? <Skeleton height={48} /> : (
                <>
                  <Typography variant="h3" fontWeight={700} sx={{ color: accentColor }}>
                    {streak.current}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">days</Typography>
                  <Typography variant="caption" color="text.disabled">
                    Longest: {streak.longest} days
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Records */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmojiEventsIcon sx={{ color: accentColor }} />
                <Typography variant="overline" color="text.secondary">Personal Records</Typography>
              </Box>
              {loading ? <Skeleton height={80} /> : (
                <Box>
                  {records.lowestWeight && (
                    <Box mb={1}>
                      <Typography variant="body2" color="text.secondary">Lowest Weight</Typography>
                      <Typography variant="h6" fontWeight={600} color="primary">
                        {records.lowestWeight.weight} lbs
                      </Typography>
                      <Typography variant="caption" color="text.disabled">{records.lowestWeight.date}</Typography>
                    </Box>
                  )}
                  {records.lowestBodyFat && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Lowest Body Fat</Typography>
                      <Typography variant="h6" fontWeight={600} color="primary">
                        {records.lowestBodyFat.body_fat_pct}%
                      </Typography>
                      <Typography variant="caption" color="text.disabled">{records.lowestBodyFat.date}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Streak milestone badges */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Streak Milestones</Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                {STREAK_MILESTONES.map((days) => (
                  <Chip
                    key={days}
                    label={`${days} days`}
                    icon={<LocalFireDepartmentIcon />}
                    color={streak.longest >= days ? 'warning' : 'default'}
                    variant={streak.longest >= days ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Weight Milestones */}
        {weightMilestones.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Weight Loss Milestones</Typography>
                <List dense>
                  {weightMilestones.map((m) => (
                    <ListItem key={m.title} disablePadding>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {m.achieved ? (
                          <CheckCircleIcon sx={{ color: primaryColor }} />
                        ) : (
                          <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={m.title}
                        secondary={m.achieved_at ?? undefined}
                        primaryTypographyProps={{ color: m.achieved ? 'text.primary' : 'text.disabled' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Custom Milestones */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>Custom Milestones</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
                  Add
                </Button>
              </Box>
              {loading ? (
                <Skeleton height={80} />
              ) : milestones.filter((m) => m.type === 'custom').length === 0 ? (
                <Typography color="text.disabled" variant="body2">No custom milestones yet.</Typography>
              ) : (
                <List dense>
                  {milestones.filter((m) => m.type === 'custom').map((m) => (
                    <ListItem
                      key={m.id}
                      disablePadding
                      secondaryAction={
                        <Button size="small" onClick={() => handleToggleMilestone(m)}>
                          {m.achieved ? 'Undo' : 'Mark done'}
                        </Button>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {m.achieved ? (
                          <CheckCircleIcon sx={{ color: accentColor }} />
                        ) : (
                          <RadioButtonUncheckedIcon color="disabled" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary={m.title} secondary={m.achieved_at ?? undefined} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add milestone dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Custom Milestone</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Milestone title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMilestone} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
