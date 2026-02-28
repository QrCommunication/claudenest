/**
 * LoginScreen
 * Magic link authentication screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import { Button, Input, ErrorMessage } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = () => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || isLoading) return;

    try {
      await login(email.trim());
      setEmailSent(true);
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleRetry = () => {
    setEmailSent(false);
    clearError();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in with your email to continue
            </Text>
          </View>

          {error && (
            <ErrorMessage
              message={error}
              onRetry={handleRetry}
              onDismiss={clearError}
            />
          )}

          {emailSent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Icon name="mail" size={48} color={colors.semantic.success} />
              </View>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successMessage}>
                We've sent a magic link to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
              <Button
                title="Use different email"
                onPress={handleRetry}
                variant="ghost"
                style={styles.retryButton}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon={
                  <Icon name="email" size={20} color={colors.text.muted} />
                }
                editable={!isLoading}
              />

              <Button
                title="Send Magic Link"
                onPress={handleLogin}
                loading={isLoading}
                disabled={!email.trim() || isLoading}
                size="large"
                style={styles.button}
              />

              <Text style={styles.hint}>
                We'll send you a secure magic link to sign in instantly
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  formContainer: {
    width: '100%',
  },
  button: {
    marginTop: spacing.md,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.semantic.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.size.xl,
    fontWeight: '600',
    color: colors.text.primary,
  },
  successMessage: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  emailHighlight: {
    color: colors.primary.purple,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: spacing.xl,
  },
});
