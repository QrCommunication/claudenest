/**
 * Sessions Navigator
 * Handles session management screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SessionsStackParamList } from './types';
import { colors } from '@/theme';

// Screens
import { SessionsListScreen } from '@/screens/sessions/SessionsListScreen';
import { SessionScreen } from '@/screens/sessions/SessionScreen';
import { NewSessionScreen } from '@/screens/sessions/NewSessionScreen';

const Stack = createNativeStackNavigator<SessionsStackParamList>();

export const SessionsNavigator: React.FC = () => {
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
        name="SessionsList"
        component={SessionsListScreen}
        options={{ title: 'Sessions' }}
      />
      <Stack.Screen
        name="Session"
        component={SessionScreen}
        options={{ title: 'Terminal' }}
      />
      <Stack.Screen
        name="NewSession"
        component={NewSessionScreen}
        options={{ title: 'New Session' }}
      />
    </Stack.Navigator>
  );
};
