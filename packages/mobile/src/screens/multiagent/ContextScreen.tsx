/**
 * ContextScreen
 * View and edit project context
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useProjectsStore } from '@/stores/projectsStore';
import { Card, CardHeader, CardContent, LoadingSpinner, Button } from '@/components/common';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProjectsStackParamList, 'Context'>;

export const ContextScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;
  const { getProjectById, fetchContext, updateContext } = useProjectsStore();

  const project = getProjectById(projectId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContext, setEditedContext] = useState({
    summary: '',
    architecture: '',
    conventions: '',
    currentFocus: '',
    recentChanges: '',
  });

  useEffect(() => {
    fetchContext(projectId);
  }, [projectId]);

  useEffect(() => {
    if (project) {
      setEditedContext({
        summary: project.summary || '',
        architecture: project.architecture || '',
        conventions: project.conventions || '',
        currentFocus: project.currentFocus || '',
        recentChanges: project.recentChanges || '',
      });
    }
  }, [project]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateContext(projectId, editedContext);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save context');
    } finally {
      setIsSaving(false);
    }
  }, [projectId, editedContext, updateContext]);

  const handleCancel = useCallback(() => {
    if (project) {
      setEditedContext({
        summary: project.summary || '',
        architecture: project.architecture || '',
        conventions: project.conventions || '',
        currentFocus: project.currentFocus || '',
        recentChanges: project.recentChanges || '',
      });
    }
    setIsEditing(false);
  }, [project]);

  if (!project) {
    return <LoadingSpinner text="Loading context..." fullScreen />;
  }

  const ContextSection: React.FC<{
    title: string;
    value: string;
    field: keyof typeof editedContext;
  }> = ({ title, value, field }) => (
    <Card style={styles.section}>
      <CardHeader title={title} />
      <CardContent>
        {isEditing ? (
          <TextInput
            style={styles.textInput}
            value={editedContext[field]}
            onChangeText={(text) =>
              setEditedContext((prev) => ({ ...prev, [field]: text }))
            }
            multiline
            textAlignVertical="top"
            placeholder={`Enter ${title.toLowerCase()}...`}
            placeholderTextColor={colors.text.muted}
          />
        ) : (
          <Text style={value ? styles.contentText : styles.emptyText}>
            {value || `No ${title.toLowerCase()} set`}
          </Text>
        )}
      </CardContent>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Edit Toggle */}
      <View style={styles.header}>
        {isEditing ? (
          <View style={styles.editActions}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="ghost"
              size="small"
            />
            <Button
              title="Save"
              onPress={handleSave}
              loading={isSaving}
              size="small"
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Icon name="edit" size={20} color={colors.primary.purple} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <ContextSection title="Summary" value={project.summary} field="summary" />
        <ContextSection title="Architecture" value={project.architecture} field="architecture" />
        <ContextSection title="Conventions" value={project.conventions} field="conventions" />
        <ContextSection title="Current Focus" value={project.currentFocus} field="currentFocus" />
        <ContextSection title="Recent Changes" value={project.recentChanges} field="recentChanges" />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.dark4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButtonText: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.primary.purple,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  textInput: {
    minHeight: 100,
    fontSize: typography.size.base,
    color: colors.text.primary,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  contentText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
});
