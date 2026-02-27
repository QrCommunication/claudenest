/**
 * ClaudeNest Mobile App
 * Entry point — Expo SDK 52 + Uniwind
 */

import './global.css'; // Tailwind CSS 4 + Uniwind (must be first import)

import React from 'react';
import { LogBox } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  // React Navigation 7 + React 19 + RN 0.76 New Architecture compatibility
  // FrameSizeProvider uses render props with refs — non-blocking, tracked upstream
  // https://github.com/react-navigation/react-navigation/issues
  'Function components cannot be given refs',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
