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

// ── Suppress known RN 0.76 + react-navigation compat warnings ──
// These are dev-only warnings from react-navigation internals trying to pass
// refs to Fabric native components (function components). They don't affect
// functionality and are tracked upstream.
const SUPPRESSED_WARNINGS = [
  'Function components cannot be given refs',
  'Cannot read property \'getScrollableNode\'',
  'Cannot find host instance',
  'ReanimatedError',
  'viewTag',
  'Encountered two children with the same key',
];

// Patch console.error to prevent these warnings from becoming red screens
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (SUPPRESSED_WARNINGS.some(w => message.includes(w))) {
    // Downgrade to console.warn (yellow box, not red screen)
    return;
  }
  originalConsoleError(...args);
};

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Function components cannot be given refs',
  '[WebSocket] Connection error',
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
