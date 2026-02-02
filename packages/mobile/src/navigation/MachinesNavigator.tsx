/**
 * Machines Navigator
 * Handles machine management screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MachinesStackParamList } from './types';
import { colors } from '@/theme';

// Screens
import { MachinesListScreen } from '@/screens/machines/MachinesListScreen';
import { MachineDetailScreen } from '@/screens/machines/MachineDetailScreen';
import { PairMachineScreen } from '@/screens/machines/PairMachineScreen';

const Stack = createNativeStackNavigator<MachinesStackParamList>();

export const MachinesNavigator: React.FC = () => {
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
        name="MachinesList"
        component={MachinesListScreen}
        options={{ title: 'Machines' }}
      />
      <Stack.Screen
        name="MachineDetail"
        component={MachineDetailScreen}
        options={{ title: 'Machine Details' }}
      />
      <Stack.Screen
        name="PairMachine"
        component={PairMachineScreen}
        options={{ title: 'Pair New Machine' }}
      />
    </Stack.Navigator>
  );
};
