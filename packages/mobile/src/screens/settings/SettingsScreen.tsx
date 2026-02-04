/**
 * SettingsScreen
 * Main settings screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useMachinesStore } from '@/stores/machinesStore';
import { Card, Button } from '@/components/common';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsMain'>;

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View
      style={[
        styles.itemIcon,
        danger && { backgroundColor: colors.semantic.error + '15' },
      ]}
    >
      <Icon
        name={icon}
        size={22}
        color={danger ? colors.semantic.error : colors.primary.purple}
      />
    </View>
    <View style={styles.itemText}>
      <Text style={[styles.itemTitle, danger && { color: colors.semantic.error }]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
    </View>
    <Icon name="chevron-right" size={22} color={colors.text.muted} />
  </TouchableOpacity>
);

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { machines } = useMachinesStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleHelp = () => {
    Linking.openURL('https://docs.claudenest.app');
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:support@claudenest.app');
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Card */}
      <Card style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="person" size={32} color={colors.primary.purple} />
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName}>{user?.name || user?.email}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Machines Section */}
      {machines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Machines</Text>
          <Card>
            {machines.slice(0, 3).map((machine, index) => (
              <TouchableOpacity
                key={machine.id}
                style={[
                  styles.machineItem,
                  index < machines.length - 1 && styles.machineItemBorder,
                ]}
                onPress={() =>
                  navigation.navigate('Skills', { machineId: machine.id })
                }
              >
                <Icon name="computer" size={20} color={colors.text.secondary} />
                <Text style={styles.machineName}>{machine.name}</Text>
                <Icon name="chevron-right" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      )}

      {/* App Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <Card>
          <SettingsItem
            icon="help-outline"
            title="Help & Documentation"
            onPress={handleHelp}
          />
          <SettingsItem
            icon="feedback"
            title="Send Feedback"
            onPress={handleFeedback}
          />
          <SettingsItem
            icon="info"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => navigation.navigate('About')}
          />
        </Card>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Card>
          <SettingsItem
            icon="logout"
            title="Sign Out"
            onPress={handleLogout}
            danger
          />
        </Card>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ClaudeNest v1.0.0</Text>
        <Text style={styles.footerSubtext}>
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
  userCard: {
    margin: spacing.md,
    marginTop: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background.dark2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userText: {
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.base,
    backgroundColor: colors.background.dark2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemTitle: {
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  itemSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: 2,
  },
  machineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  machineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 66, 97, 0.3)',
  },
  machineName: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  footerSubtext: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
});
