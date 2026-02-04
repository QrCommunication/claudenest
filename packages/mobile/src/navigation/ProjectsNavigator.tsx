/**
 * Projects Navigator
 * Handles multi-agent project screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from './types';
import { colors } from '@/theme';

// Screens
import { ProjectsListScreen } from '@/screens/multiagent/ProjectsListScreen';
import { ProjectScreen } from '@/screens/multiagent/ProjectScreen';
import { TasksScreen } from '@/screens/multiagent/TasksScreen';
import { ContextScreen } from '@/screens/multiagent/ContextScreen';
import { LocksScreen } from '@/screens/multiagent/LocksScreen';

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

export const ProjectsNavigator: React.FC = () => {
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
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{ title: 'Projects' }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectScreen}
        options={{ title: 'Project' }}
      />
      <Stack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'Tasks' }}
      />
      <Stack.Screen
        name="Context"
        component={ContextScreen}
        options={{ title: 'Context' }}
      />
      <Stack.Screen
        name="Locks"
        component={LocksScreen}
        options={{ title: 'File Locks' }}
      />
    </Stack.Navigator>
  );
};
