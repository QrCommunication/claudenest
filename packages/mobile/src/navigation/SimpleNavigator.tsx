/**
 * SimpleNavigator — Navigation simplifiée pour ClaudeNest Android
 * Stack: Login → Machines Dashboard → Launch Session
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/authStore';
import { LoginScreen } from '@/screens/LoginScreen';
import { MachinesDashboardScreen } from '@/screens/MachinesDashboardScreen';
import { LaunchSessionScreen } from '@/screens/LaunchSessionScreen';

// Navigation param list — exported for use in screens
export type RootStackParamList = {
  Login: undefined;
  Machines: undefined;
  LaunchSession: {
    machineId: string;
    machineName: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function SimpleNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1b26' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600', color: '#ffffff' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#0f0f1a' },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Machines"
              component={MachinesDashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LaunchSession"
              component={LaunchSessionScreen}
              options={{
                title: 'Launch Session',
                headerBackTitle: 'Back',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
