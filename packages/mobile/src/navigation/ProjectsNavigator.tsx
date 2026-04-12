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
import { NewProjectScreen } from '@/screens/multiagent/NewProjectScreen';
import { ProjectScreen } from '@/screens/multiagent/ProjectScreen';
import { TasksScreen } from '@/screens/multiagent/TasksScreen';
import { ContextScreen } from '@/screens/multiagent/ContextScreen';
import { LocksScreen } from '@/screens/multiagent/LocksScreen';
import { EpicsScreen } from '@/screens/multiagent/EpicsScreen';
import { SprintsScreen } from '@/screens/multiagent/SprintsScreen';
import { PlanningChatScreen } from '@/screens/multiagent/PlanningChatScreen';
import { OrchestrationScreen } from '@/screens/multiagent/OrchestrationScreen';

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
        name="NewProject"
        component={NewProjectScreen}
        options={{ title: 'New Project' }}
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
      <Stack.Screen
        name="Epics"
        component={EpicsScreen}
        options={{ title: 'Epics' }}
      />
      <Stack.Screen
        name="Sprints"
        component={SprintsScreen}
        options={{ title: 'Sprints' }}
      />
      <Stack.Screen
        name="PlanningChat"
        component={PlanningChatScreen}
        options={{ title: 'Planning Assistant' }}
      />
      <Stack.Screen
        name="Orchestration"
        component={OrchestrationScreen}
        options={{ title: 'Orchestration' }}
      />
    </Stack.Navigator>
  );
};
