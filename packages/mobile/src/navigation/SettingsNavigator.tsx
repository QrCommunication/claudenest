/**
 * Settings Navigator
 * Handles settings and configuration screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from './types';
import { colors } from '@/theme';

// Screens
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { SkillsScreen } from '@/screens/config/SkillsScreen';
import { MCPServersScreen } from '@/screens/config/MCPServersScreen';
import { CommandsScreen } from '@/screens/config/CommandsScreen';
import { AboutScreen } from '@/screens/settings/AboutScreen';
import { CredentialsScreen } from '@/screens/settings/CredentialsScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.dark2,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background.dark2,
        },
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Skills"
        component={SkillsScreen}
        options={{ title: 'Skills' }}
      />
      <Stack.Screen
        name="MCPServers"
        component={MCPServersScreen}
        options={{ title: 'MCP Servers' }}
      />
      <Stack.Screen
        name="Commands"
        component={CommandsScreen}
        options={{ title: 'Commands' }}
      />
      <Stack.Screen
        name="Credentials"
        component={CredentialsScreen}
        options={{ title: 'Credentials' }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About' }}
      />
    </Stack.Navigator>
  );
};
