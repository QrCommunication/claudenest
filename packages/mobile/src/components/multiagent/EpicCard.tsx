import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Epic } from '../../types';

interface EpicCardProps {
  epic: Epic;
  onPress: (epic: Epic) => void;
}

const EPIC_STATUS_COLORS: Record<string, string> = {
  open: '#94a3b8',
  in_progress: '#a855f7',
  done: '#22c55e',
};

export const EpicCard = memo(function EpicCard({ epic, onPress }: EpicCardProps) {
  const handlePress = useCallback(() => onPress(epic), [epic, onPress]);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: epic.color }]} />
        <Text style={styles.title} numberOfLines={1}>{epic.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: EPIC_STATUS_COLORS[epic.status] + '25' }]}>
          <Text style={[styles.statusText, { color: EPIC_STATUS_COLORS[epic.status] }]}>
            {epic.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {epic.description && (
        <Text style={styles.description} numberOfLines={2}>{epic.description}</Text>
      )}

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${epic.progress_percentage}%`,
            backgroundColor: epic.color,
          }]} />
        </View>
        <Text style={styles.progressText}>
          {epic.completed_tasks_count}/{epic.tasks_count}
        </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 2 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  description: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontVariant: ['tabular-nums'] },
});
