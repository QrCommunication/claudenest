/**
 * SessionScreen
 * Interactive terminal view for a session
 */

import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing } from "@/theme";
import { useSessionsStore } from "@/stores/sessionsStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionsStackParamList } from "@/navigation/types";

import { LoadingSpinner, Button, ErrorMessage } from "@/components/common";
import {
  TerminalWebView,
  TerminalKeyBar,
  type TerminalHandle,
} from "@/components/sessions";

type Props = NativeStackScreenProps<SessionsStackParamList, "Session">;

export const SessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const {
    getSessionById,
    fetchSession,
    terminateSession,
    subscribeToSession,
    sendInput,
    resizeSession,
    clearError,
    error,
  } = useSessionsStore();

  const insets = useSafeAreaInsets();
  const terminalRef = useRef<TerminalHandle>(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);

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
            disabled={isTerminating || session.status === "completed"}
            style={styles.headerButton}
          >
            <Icon
              name="close"
              size={24}
              color={
                session.status === "completed"
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
      "Terminate Session?",
      "Are you sure you want to end this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Terminate",
          style: "destructive",
          onPress: async () => {
            setIsTerminating(true);
            try {
              await terminateSession(sessionId);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to terminate session");
              setIsTerminating(false);
            }
          },
        },
      ],
    );
  }, [sessionId, terminateSession, navigation]);

  const handleInput = useCallback(
    (data: string) => {
      sendInput(sessionId, data);
    },
    [sessionId, sendInput],
  );

  // xterm refit → resize the server PTY so output wraps at the real width.
  const handleResize = useCallback(
    (cols: number, rows: number) => {
      resizeSession(sessionId, cols, rows);
    },
    [sessionId, resizeSession],
  );

  // Toggle a sticky modifier and mirror it into the WebView so the next
  // soft-keyboard key is Ctrl/Alt-modified.
  const toggleModifier = useCallback((mod: "ctrl" | "alt") => {
    if (mod === "ctrl") {
      setCtrlActive((prev) => {
        const next = !prev;
        terminalRef.current?.setModifier("ctrl", next);
        return next;
      });
    } else {
      setAltActive((prev) => {
        const next = !prev;
        terminalRef.current?.setModifier("alt", next);
        return next;
      });
    }
  }, []);

  // The WebView consumed an armed modifier (a letter was typed) → reset both.
  const handleModifierConsumed = useCallback(() => {
    setCtrlActive(false);
    setAltActive(false);
  }, []);

  if (!session) {
    return <LoadingSpinner text="Loading session..." fullScreen />;
  }

  const isActive = ["created", "starting", "running", "waiting_input"].includes(
    session.status,
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 44 : 0}
    >
      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <View style={styles.outputContainer}>
        <TerminalWebView
          ref={terminalRef}
          sessionId={sessionId}
          onInput={isActive ? handleInput : undefined}
          onResize={handleResize}
          onModifierConsumed={handleModifierConsumed}
        />
      </View>

      {isActive ? (
        <TerminalKeyBar
          onSend={handleInput}
          ctrlActive={ctrlActive}
          altActive={altActive}
          onToggleModifier={toggleModifier}
        />
      ) : (
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
