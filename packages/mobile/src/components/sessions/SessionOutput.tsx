/**
 * SessionOutput Component
 * Displays terminal-like output for a session
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useSessionsStore } from '@/stores/sessionsStore';

interface SessionOutputProps {
  sessionId: string;
  maxLines?: number;
}

export const SessionOutput: React.FC<SessionOutputProps> = ({
  sessionId,
  maxLines = 1000,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const output = useSessionsStore((state) => state.getSessionOutput(sessionId));

  // Limit output lines
  const lines = output.split('\n').slice(-maxLines);
  const displayOutput = lines.join('\n');

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [output, autoScroll]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    setAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    setAutoScroll(true);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleClear = () => {
    useSessionsStore.getState().clearOutput(sessionId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>Output</Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity onPress={handleClear} style={styles.toolbarButton}>
            <Icon name="delete-outline" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
          {!autoScroll && (
            <TouchableOpacity onPress={scrollToBottom} style={styles.toolbarButton}>
              <Icon name="vertical-align-bottom" size={18} color={colors.primary.purple} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator
      >
        <Text style={styles.output} selectable>
          {displayOutput || 'No output yet...'}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.terminal.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.dark3,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.dark4,
  },
  toolbarText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolbarButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    minHeight: 200,
  },
  output: {
    fontFamily: typography.fontFamily.mono,
    fontSize: 12,
    color: colors.terminal.foreground,
    lineHeight: 18,
  },
});
