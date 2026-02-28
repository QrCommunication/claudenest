/**
 * SkillsScreen
 * Displays available skills for a machine
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { machinesApi } from '@/services/api';
import type { Skill } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/navigation/types';

import { LoadingSpinner, EmptyState, Card, CardHeader, CardContent } from '@/components/common';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Skills'>;

const SkillCard: React.FC<{ skill: Skill }> = ({ skill }) => (
  <Card style={styles.skillCard}>
    <View style={styles.skillHeader}>
      <Icon name="auto-awesome" size={24} color={colors.primary.purple} />
      <View style={styles.skillInfo}>
        <Text style={styles.skillName} numberOfLines={1}>
          {skill.name}
        </Text>
        <Text style={styles.skillPath} numberOfLines={1}>
          {skill.path}
        </Text>
      </View>
    </View>
    {skill.description && (
      <Text style={styles.skillDescription}>{skill.description}</Text>
    )}
    <View style={styles.skillMeta}>
      {skill.version && (
        <View style={styles.metaTag}>
          <Text style={styles.metaText}>v{skill.version}</Text>
        </View>
      )}
      {skill.author && (
        <View style={styles.metaTag}>
          <Text style={styles.metaText}>@{skill.author}</Text>
        </View>
      )}
    </View>
    {skill.tags.length > 0 && (
      <View style={styles.tags}>
        {skill.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    )}
  </Card>
);

export const SkillsScreen: React.FC<Props> = ({ route }) => {
  const { machineId } = route.params;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, [machineId]);

  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await machinesApi.getSkills(machineId);
      setSkills(response.data || []);
    } catch (err) {
      setError('Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  const renderItem = useCallback(
    ({ item }: { item: Skill }) => <SkillCard skill={item} />,
    []
  );

  const keyExtractor = useCallback((item: Skill) => item.path, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading skills..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={skills}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="auto-awesome"
            title="No skills found"
            description="No Claude Code skills discovered on this machine"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  skillCard: {
    marginBottom: spacing.md,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skillInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  skillName: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  skillPath: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
  },
  skillDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  skillMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaTag: {
    backgroundColor: colors.background.dark2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary.purple + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: typography.size.xs,
    color: colors.primary.purple,
  },
});
