/**
 * PairMachineScreen
 * Screen for pairing a new machine via QR code or token
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useMachinesStore } from '@/stores/machinesStore';
import { Button, Input, LoadingSpinner } from '@/components/common';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MachinesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MachinesStackParamList, 'PairMachine'>;

export const PairMachineScreen: React.FC<Props> = ({ navigation }) => {
  const [machineName, setMachineName] = useState('');
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const { createMachine, isLoading } = useMachinesStore();

  const handlePasteToken = useCallback(async () => {
    // In a real app, this would use Clipboard.getString()
    // For now, we'll just show the input
    setShowTokenInput(true);
  }, []);

  const handlePair = useCallback(async () => {
    if (!machineName.trim() || !token.trim()) {
      Alert.alert('Error', 'Please enter both a name and token');
      return;
    }

    try {
      await createMachine({
        name: machineName.trim(),
        token: token.trim(),
      });
      Alert.alert(
        'Success',
        `Machine "${machineName}" has been paired successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to pair machine. Please check your token and try again.'
      );
    }
  }, [machineName, token, createMachine, navigation]);

  const handleScanQR = useCallback(() => {
    Alert.alert('QR Scanner', 'QR Code scanning would be implemented here with react-native-qr-code-scanner');
  }, []);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>
            How to pair your machine
          </Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Install ClaudeNest agent on your machine:{'\n'}
              <Text style={styles.code}>npm install -g @claude-remote/agent</Text>
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Run the agent and note the pairing token
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Enter the token below to complete pairing
            </Text>
          </View>
        </View>

        {/* QR Scan Option */}
        <TouchableOpacity style={styles.qrButton} onPress={handleScanQR}>
          <Icon name="qr-code-scanner" size={28} color={colors.primary.purple} />
          <Text style={styles.qrButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual Entry */}
        <View style={styles.form}>
          <Input
            label="Machine Name"
            placeholder="My MacBook Pro"
            value={machineName}
            onChangeText={setMachineName}
            leftIcon={<Icon name="computer" size={20} color={colors.text.muted} />}
          />

          {showTokenInput ? (
            <Input
              label="Pairing Token"
              placeholder="Paste your token here"
              value={token}
              onChangeText={setToken}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              inputStyle={styles.tokenInput}
            />
          ) : (
            <Button
              title="Paste Token"
              onPress={handlePasteToken}
              variant="secondary"
              leftIcon={<Icon name="content-paste" size={20} color={colors.text.primary} />}
            />
          )}

          <Button
            title="Pair Machine"
            onPress={handlePair}
            loading={isLoading}
            disabled={!machineName.trim() || !token.trim() || isLoading}
            size="large"
            style={styles.pairButton}
          />
        </View>

        <Text style={styles.hint}>
          The pairing token can be found in your agent logs or generated using{'\n'}
          <Text style={styles.codeHint}>claude-remote --pair</Text>
        </Text>
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
  instructions: {
    marginBottom: spacing.xl,
  },
  instructionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '600',
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
    fontWeight: '600',
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
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.purple + '30',
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  qrButtonText: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.primary.purple,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.background.dark4,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  form: {
    gap: spacing.md,
  },
  tokenInput: {
    minHeight: 100,
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.sm,
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
