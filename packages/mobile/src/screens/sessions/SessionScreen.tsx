/**
 * SessionScreen
 * Interactive terminal view for a session
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '@/theme';
import { useSessionsStore } from '@/stores/sessionsStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SessionsStackParamList } from '@/navigation/types';

import { LoadingSpinner, Button, ErrorMessage } from '@/components/common';
import { SessionOutput, SessionInput } from '@/components/sessions';

type Props = NativeStackScreenProps<SessionsStackParamList, 'Session'>;

export const SessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const {
    getSessionById,
    fetchSession,
    terminateSession,
    subscribeToSession,
    clearError,
    error,
  } = useSessionsStore();

  const [isTerminating, setIsTerminating] = useState(false);

  const session = getSessionById(sessionId);

  useEffect(() => {
    fetchSession(sessionId);
    const unsubscribe = subscribeToSession(sessionId);
    return unsubscribe;
  }, [sessionId]);

  // Update header with actions
  useEffect(() => {
    if (session) {
      navigation.setOptions({
        title: `${session.mode} Session`,
        headerRight: () => (
          <TouchableOpacity
            onPress={handleTerminate}
            disabled={isTerminating || session.status === 'completed'}
            style={styles.headerButton}
          >
            <Icon
              name="close"
              size={24}
              color={
                session.status === 'completed'
                  ? colors.text.disabled
                  : colors.semantic.error
              }
            />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, session, isTerminating]);

  const handleTerminate = useCallback(() => {
    Alert.alert(
      'Terminate Session?',
      'Are you sure you want to end this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            setIsTerminating(true);
            try {
              await terminateSession(sessionId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to terminate session');
              setIsTerminating(false);
            }
          },
        },
      ]
    );
  }, [sessionId, terminateSession, navigation]);

  if (!session) {
    return <LoadingSpinner text="Loading session..." fullScreen />;
  }

  const isActive = ['created', 'starting', 'running', 'waiting_input'].includes(
    session.status
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {error && (
        <ErrorMessage message={error} onDismiss={clearError} />
      )}

      <View style={styles.outputContainer}>
        <SessionOutput sessionId={sessionId} />
      </View>

      {isActive && (
        <View style={styles.inputContainer}>
          <SessionInput sessionId={sessionId} disabled={!isActive} />
        </View>
      )}

      {!isActive && (
        <View style={styles.endedContainer}>
          <Button
            title="Session Ended"
            variant="secondary"
            disabled
            style={styles.endedButton}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  headerButton: {
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  outputContainer: {
    flex: 1,
    padding: spacing.md,
  },
  inputContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.dark4,
  },
  endedContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.background.dark4,
  },
  endedButton: {
    opacity: 0.5,
  },
});
