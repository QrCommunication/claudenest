/**
 * PairMachineScreen
 * Screen for pairing a new machine via a 6-character pairing code (XXX-XXX)
 *
 * Flow:
 * 1. User runs `claudenest-agent pair` on their machine
 * 2. Agent generates a code like ABC-123 and displays it
 * 3. User enters the code here to complete pairing
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useMachinesStore } from '@/stores/machinesStore';
import { api } from '@/services/api';
import { Button, Input } from '@/components/common';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MachinesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MachinesStackParamList, 'PairMachine'>;

/**
 * Format a raw alphanumeric string into XXX-XXX pairing code format.
 * Strips non-alphanumeric characters, uppercases, and inserts dash after 3 chars.
 */
function formatPairingCode(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
}

/**
 * Extract the raw 6-character code from a formatted pairing code (strip dashes).
 */
function extractRawCode(formatted: string): string {
  return formatted.replace(/-/g, '');
}

export const PairMachineScreen: React.FC<Props> = ({ navigation }) => {
  const [pairingCode, setPairingCode] = useState('');
  const [machineName, setMachineName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  const rawCode = extractRawCode(pairingCode);
  const isCodeComplete = rawCode.length === 6;

  const handleCodeChange = useCallback((text: string) => {
    setPairingCode(formatPairingCode(text));
  }, []);

  const handlePasteCode = useCallback(async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        const cleaned = clipboardContent.trim();
        const formatted = formatPairingCode(cleaned);
        setPairingCode(formatted);
      }
    } catch {
      Alert.alert('Error', 'Unable to read clipboard content.');
    }
  }, []);

  const handlePair = useCallback(async () => {
    if (!isCodeComplete) {
      Alert.alert('Invalid Code', 'Please enter a complete 6-character pairing code (e.g. ABC-123).');
      return;
    }

    setIsLoading(true);

    try {
      const body: Record<string, string> = {};
      if (machineName.trim()) {
        body.name = machineName.trim();
      }

      await api.post(`/pairing/${rawCode}/complete`, body);

      useMachinesStore.getState().fetchMachines();

      Alert.alert(
        'Machine Paired',
        machineName.trim()
          ? `"${machineName.trim()}" has been paired successfully. The agent will connect automatically.`
          : 'Your machine has been paired successfully. The agent will connect automatically.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: unknown) {
      const apiError = error as { status?: number; message?: string };

      if (apiError.status === 410) {
        Alert.alert(
          'Code Expired',
          'This pairing code has expired. Please run `claudenest-agent pair` again on your machine to generate a new code.'
        );
      } else if (apiError.status === 404) {
        Alert.alert(
          'Code Not Found',
          'This pairing code was not found or has already been used. Please check the code and try again.'
        );
      } else {
        Alert.alert(
          'Pairing Failed',
          apiError.message || 'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [isCodeComplete, rawCode, machineName, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>
            Pair your machine
          </Text>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Install the ClaudeNest agent:{'\n'}
              <Text style={styles.code}>npm install -g @claudenest/agent</Text>
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Run the pairing command:{'\n'}
              <Text style={styles.code}>claudenest-agent pair</Text>
            </Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Enter the 6-character code displayed in your terminal
            </Text>
          </View>
        </View>

        {/* Pairing Code Format Visual */}
        <View style={styles.codeFormatCard}>
          <Icon name="terminal" size={20} color={colors.text.muted} />
          <Text style={styles.codeFormatLabel}>Code format</Text>
          <Text style={styles.codeFormatExample}>ABC-123</Text>
        </View>

        {/* Pairing Code Input */}
        <View style={styles.codeInputSection}>
          <Text style={styles.codeInputLabel}>Pairing Code</Text>
          <View style={styles.codeInputRow}>
            <View
              style={[
                styles.codeInputContainer,
                isCodeComplete && styles.codeInputContainerValid,
              ]}
            >
              <TextInput
                ref={codeInputRef}
                style={styles.codeInput}
                value={pairingCode}
                onChangeText={handleCodeChange}
                placeholder="ABC-123"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
                autoFocus
              />
              {isCodeComplete && (
                <Icon
                  name="check-circle"
                  size={22}
                  color={colors.semantic.success}
                  style={styles.codeCheckIcon}
                />
              )}
            </View>
            <Button
              title="Paste"
              variant="secondary"
              size="medium"
              onPress={handlePasteCode}
              leftIcon={
                <Icon name="content-paste" size={18} color={colors.text.primary} />
              }
              style={styles.pasteButton}
            />
          </View>
        </View>

        {/* Machine Name (optional) */}
        <View style={styles.nameSection}>
          <Input
            label="Machine Name (optional)"
            placeholder="My MacBook Pro"
            value={machineName}
            onChangeText={setMachineName}
            leftIcon={
              <Icon name="computer" size={20} color={colors.text.muted} />
            }
            helper="Leave empty to use the hostname detected by the agent"
          />
        </View>

        {/* Pair Button */}
        <Button
          title="Complete Pairing"
          onPress={handlePair}
          loading={isLoading}
          disabled={!isCodeComplete || isLoading}
          size="large"
          style={styles.pairButton}
        />

        {/* Hint */}
        <Text style={styles.hint}>
          The pairing code expires after 10 minutes.{'\n'}
          If it has expired, run{' '}
          <Text style={styles.codeHint}>claudenest-agent pair</Text>
          {' '}again.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  instructions: {
    marginBottom: spacing.xl,
  },
  instructionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
  },
  stepText: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  code: {
    fontFamily: typography.fontFamily.mono,
    color: colors.primary.purple,
    fontSize: typography.size.sm,
  },
  codeFormatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  codeFormatLabel: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  codeFormatExample: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  codeInputSection: {
    marginBottom: spacing.lg,
  },
  codeInputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
  },
  codeInputContainerValid: {
    borderColor: colors.semantic.success,
  },
  codeInput: {
    flex: 1,
    fontSize: typography.size['2xl'],
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: 4,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  codeCheckIcon: {
    marginLeft: spacing.xs,
  },
  pasteButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  nameSection: {
    marginBottom: spacing.sm,
  },
  pairButton: {
    marginTop: spacing.md,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 20,
  },
  codeHint: {
    fontFamily: typography.fontFamily.mono,
    color: colors.primary.purple,
  },
});
