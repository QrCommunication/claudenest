/**
 * Main Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { MainTabParamList } from './types';
import { colors } from '@/theme';

// Navigators
import { MachinesNavigator } from './MachinesNavigator';
import { SessionsNavigator } from './SessionsNavigator';
import { ProjectsNavigator } from './ProjectsNavigator';
import { SettingsNavigator } from './SettingsNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.dark3,
          borderTopColor: colors.background.dark4,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary.purple,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="MachinesTab"
        component={MachinesNavigator}
        options={{
          tabBarLabel: 'Machines',
          tabBarIcon: ({ color, size }) => (
            <Icon name="computer" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SessionsTab"
        component={SessionsNavigator}
        options={{
          tabBarLabel: 'Sessions',
          tabBarIcon: ({ color, size }) => (
            <Icon name="terminal" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsNavigator}
        options={{
          tabBarLabel: 'Projects',
          tabBarIcon: ({ color, size }) => (
            <Icon name="folder-shared" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
