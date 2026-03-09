/**
 * NewSessionScreen
 * Screen for creating a new session
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useSessionsStore } from '@/stores/sessionsStore';
import { useMachinesStore } from '@/stores/machinesStore';
import { Button, Input, LoadingSpinner } from '@/components/common';
import type { SessionMode } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SessionsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<SessionsStackParamList, 'NewSession'>;

const MODES: { value: SessionMode; label: string; icon: string; description: string }[] = [
  {
    value: 'interactive',
    label: 'Interactive',
    icon: 'chat',
    description: 'Full interactive Claude session with terminal',
  },
  {
    value: 'headless',
    label: 'Headless',
    icon: 'headset',
    description: 'Background session without terminal input',
  },
  {
    value: 'oneshot',
    label: 'One-shot',
    icon: 'flash-on',
    description: 'Execute a single prompt and exit',
  },
];

export const NewSessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { machineId } = route.params;
  const [selectedMode, setSelectedMode] = useState<SessionMode>('interactive');
  const [projectPath, setProjectPath] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const { createSession, isLoading } = useSessionsStore();
  const { getMachineById } = useMachinesStore();

  const machine = getMachineById(machineId);

  const handleCreate = useCallback(async () => {
    if (!machine) {
      Alert.alert('Error', 'Machine not found');
      return;
    }

    if (machine.status !== 'online') {
      Alert.alert('Error', 'Machine is offline. Please wake it first.');
      return;
    }

    try {
      const session = await createSession(machineId, {
        mode: selectedMode,
        projectPath: projectPath.trim() || undefined,
        initialPrompt: initialPrompt.trim() || undefined,
      });

      // Navigate to the new session
      navigation.replace('Session', { sessionId: session.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create session. Please try again.');
    }
  }, [
    machine,
    machineId,
    selectedMode,
    projectPath,
    initialPrompt,
    createSession,
    navigation,
  ]);

  if (!machine) {
    return <LoadingSpinner text="Loading machine..." fullScreen />;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Machine Info */}
        <View style={styles.machineInfo}>
          <Icon name="computer" size={20} color={colors.primary.purple} />
          <Text style={styles.machineName}>{machine.name}</Text>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  machine.status === 'online'
                    ? colors.semantic.success
                    : colors.semantic.error,
              },
            ]}
          />
        </View>

        {/* Mode Selection */}
        <Text style={styles.sectionTitle}>Session Mode</Text>
        <View style={styles.modesContainer}>
          {MODES.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.modeCard,
                selectedMode === mode.value && styles.modeCardSelected,
              ]}
              onPress={() => setSelectedMode(mode.value)}
            >
              <Icon
                name={mode.icon}
                size={28}
                color={
                  selectedMode === mode.value
                    ? colors.primary.purple
                    : colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.modeLabel,
                  selectedMode === mode.value && styles.modeLabelSelected,
                ]}
              >
                {mode.label}
              </Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Input
            label="Project Path (optional)"
            placeholder="/path/to/project"
            value={projectPath}
            onChangeText={setProjectPath}
            leftIcon={<Icon name="folder" size={20} color={colors.text.muted} />}
          />

          <Input
            label="Initial Prompt (optional)"
            placeholder="Enter initial instructions for Claude..."
            value={initialPrompt}
            onChangeText={setInitialPrompt}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            inputStyle={styles.promptInput}
          />
        </View>

        {/* Create Button */}
        <Button
          title="Create Session"
          onPress={handleCreate}
          loading={isLoading}
          disabled={machine.status !== 'online' || isLoading}
          size="large"
          style={styles.createButton}
        />

        {machine.status !== 'online' && (
          <Text style={styles.offlineWarning}>
            Machine is offline. Wake it before creating a session.
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  content: {
    padding: spacing.xl,
  },
  machineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  machineName: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  modesContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  modeCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeCardSelected: {
    borderColor: colors.primary.purple,
  },
  modeLabel: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  modeLabelSelected: {
    color: colors.primary.purple,
  },
  modeDescription: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  promptInput: {
    minHeight: 100,
  },
  createButton: {
    marginTop: spacing.md,
  },
  offlineWarning: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
