/**
 * AboutScreen
 * App information and credits
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { Card } from '@/components/common';

const LINKS = [
  { icon: 'public', label: 'Website', url: 'https://claudenest.app' },
  { icon: 'code', label: 'GitHub', url: 'https://github.com/claudenest' },
  { icon: 'description', label: 'Documentation', url: 'https://docs.claudenest.app' },
  { icon: 'gavel', label: 'Privacy Policy', url: 'https://claudenest.app/privacy' },
  { icon: 'article', label: 'Terms of Service', url: 'https://claudenest.app/terms' },
];

export const AboutScreen: React.FC = () => {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <LinearGradient
          colors={colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoContainer}
        >
          <Icon name="nest-wifi-router" size={60} color={colors.text.primary} />
        </LinearGradient>
        <Text style={styles.appName}>ClaudeNest</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.tagline}>Remote Control for Claude Code</Text>
      </View>

      {/* Description */}
      <Card style={styles.descriptionCard}>
        <Text style={styles.description}>
          ClaudeNest is a comprehensive platform for remotely orchestrating Claude Code 
          instances across multiple machines. Control your AI coding sessions from anywhere, 
          manage multi-agent projects, and keep your workflow synchronized.
        </Text>
      </Card>

      {/* Links */}
      <Card style={styles.linksCard}>
        {LINKS.map((link, index) => (
          <TouchableOpacity
            key={link.label}
            style={[
              styles.linkItem,
              index < LINKS.length - 1 && styles.linkItemBorder,
            ]}
            onPress={() => handleOpenLink(link.url)}
          >
            <Icon name={link.icon} size={20} color={colors.text.secondary} />
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Icon name="open-in-new" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Credits */}
      <View style={styles.credits}>
        <Text style={styles.creditsText}>
          Made with <Text style={styles.heart}>❤</Text> for the Claude community
        </Text>
        <Text style={styles.copyright}>
          © 2026 ClaudeNest. All rights reserved.
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
  logoSection: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  version: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: typography.size.base,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  descriptionCard: {
    marginHorizontal: spacing.md,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  linksCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  linkItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  linkLabel: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  credits: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  creditsText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
  },
  heart: {
    color: colors.semantic.error,
  },
  copyright: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
});
