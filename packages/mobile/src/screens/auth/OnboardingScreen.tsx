/**
 * OnboardingScreen
 * Welcome screen for new users
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { Button } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const FEATURES = [
  {
    icon: 'computer',
    title: 'Remote Machines',
    description: 'Connect and manage Claude Code instances on any machine',
  },
  {
    icon: 'terminal',
    title: 'Interactive Sessions',
    description: 'Start and control Claude sessions from your mobile device',
  },
  {
    icon: 'folder-shared',
    title: 'Multi-Agent Projects',
    description: 'Collaborate across multiple Claude instances with shared context',
  },
  {
    icon: 'sync',
    title: 'Real-time Sync',
    description: 'Stay in sync with live session output and project updates',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { completeOnboarding } = useAuthStore();

  const handleGetStarted = () => {
    completeOnboarding();
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <LinearGradient
          colors={colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoContainer}
        >
          <Icon name="nest-wifi-router" size={60} color={colors.text.primary} />
        </LinearGradient>

        <Text style={styles.title}>ClaudeNest</Text>
        <Text style={styles.subtitle}>
          Remote Control for Claude Code
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Icon name={feature.icon} size={24} color={colors.primary.purple} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          size="large"
          style={styles.button}
        />
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: typography.size['3xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  featuresContainer: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.purple + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  featureDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.background.dark4,
  },
  button: {
    width: '100%',
  },
  terms: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
