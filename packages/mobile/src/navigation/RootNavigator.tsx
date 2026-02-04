/**
 * Root Navigator
 * Main entry point for navigation - handles auth state
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { colors } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { websocket } from '@/services/websocket';

// Navigators
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Navigation theme
const navigationTheme = {
  dark: true,
  colors: {
    primary: colors.primary.purple,
    background: colors.background.dark2,
    card: colors.background.dark2,
    text: colors.text.primary,
    border: colors.background.dark4,
    notification: colors.semantic.error,
  },
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, accessToken, fetchUser } = useAuthStore();

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      websocket.connect(accessToken);
      fetchUser();
    } else {
      websocket.disconnect();
    }

    return () => {
      websocket.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
