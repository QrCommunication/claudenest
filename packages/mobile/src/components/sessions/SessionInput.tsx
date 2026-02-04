/**
 * SessionInput Component
 * Input field for sending commands to a session
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useSessionsStore } from '@/stores/sessionsStore';

interface SessionInputProps {
  sessionId: string;
  disabled?: boolean;
}

export const SessionInput: React.FC<SessionInputProps> = ({
  sessionId,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const sendInput = useSessionsStore((state) => state.sendInput);

  const handleSend = useCallback(() => {
    if (input.trim() && !disabled) {
      sendInput(sessionId, input + '\n');
      setInput('');
    }
  }, [input, sessionId, disabled, sendInput]);

  const handleKeyPress = useCallback(
    ({ nativeEvent }: { nativeEvent: { key: string } }) => {
      if (nativeEvent.key === 'Enter') {
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        onKeyPress={handleKeyPress}
        placeholder="Type command..."
        placeholderTextColor={colors.text.muted}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={false}
      />
      <TouchableOpacity
        style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={disabled || !input.trim()}
      >
        <Icon
          name="send"
          size={20}
          color={disabled ? colors.text.disabled : colors.primary.purple}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.background.dark4,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.mono,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
