import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Sprint } from '../../types';

interface SprintCardProps {
  sprint: Sprint;
  onPress: (sprint: Sprint) => void;
}

export const SprintCard = memo(function SprintCard({ sprint, onPress }: SprintCardProps) {
  const handlePress = useCallback(() => onPress(sprint), [sprint, onPress]);

  const statusColors: Record<string, string> = {
    planning: '#94a3b8',
    active: '#a855f7',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{sprint.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[sprint.status] + '25' }]}>
          <Text style={[styles.statusText, { color: statusColors[sprint.status] }]}>{sprint.status}</Text>
        </View>
      </View>

      {sprint.goal && <Text style={styles.goal} numberOfLines={1}>{sprint.goal}</Text>}

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>
          {sprint.completed_story_points}/{sprint.total_story_points} pts
        </Text>
        <Text style={styles.dates}>
          {formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}
        </Text>
        {sprint.remaining_days !== null && (
          <Text style={[styles.days, sprint.is_overdue && styles.overdue]}>
            {sprint.is_overdue
              ? `${Math.abs(sprint.remaining_days)}d over`
              : `${sprint.remaining_days}d left`}
          </Text>
        )}
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${sprint.progress_percentage}%` }]} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#24283b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', flex: 1 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  goal: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  metric: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontVariant: ['tabular-nums'] },
  dates: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  days: { fontSize: 11, color: '#22d3ee', fontWeight: '500' },
  overdue: { color: '#ef4444' },
  progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: '#a855f7', borderRadius: 2 },
});
