/**
 * SessionScreen
 * Interactive terminal view for a session.
 *
 * Input model: keystrokes are captured by a hidden NATIVE TextInput (the
 * WebView is display-only). Two reasons:
 * - Android's predictive IME composes text into xterm's hidden textarea and
 *   re-sends the whole composition prefix on every keystroke ("an", "anal",
 *   "analy", …) → repeated text. `keyboardType="visible-password"` forces a
 *   suggestion-free keyboard with no composition.
 * - Keyboard insets: targetSdk 36 enforces edge-to-edge, which makes
 *   `softwareKeyboardLayoutMode: "resize"` (adjustResize) a no-op — the window
 *   no longer shrinks, so the key bar ended up hidden behind the keyboard.
 *   We track the keyboard height ourselves and pad the layout.
 */

import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
} from "react-native";
import { showAlert } from "@/services/dialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing } from "@/theme";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useAttentionStore } from "@/stores/attentionStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SessionsStackParamList } from "@/navigation/types";

import { LoadingSpinner, Button, ErrorMessage } from "@/components/common";
import { TerminalWebView, TerminalKeyBar } from "@/components/sessions";
import { TerminalSocket } from "@/services/terminalSocket";

type Props = NativeStackScreenProps<SessionsStackParamList, "Session">;

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

  const insets = useSafeAreaInsets();
  // Fast-path I/O socket over /ws/terminal: input, resize AND output. Reverb
  // broadcasts go through the server-side queue, which puts the keystroke
  // echo hundreds of ms behind the direct relay — so while this socket is
  // connected the store mutes the Reverb output listener (setDirectOutput)
  // and the socket feeds the same appendOutput pipeline. When the socket
  // drops, Reverb resumes as the (slower) fallback. Status/ended transitions
  // keep coming through Reverb. Mirrors the web client's gating.
  const socketRef = useRef<TerminalSocket | null>(null);
  const [isTerminating, setIsTerminating] = useState(false);
  const [ctrlActive, setCtrlActive] = useState(false);
  const [altActive, setAltActive] = useState(false);

  // ── Native key capture ──
  const inputRef = useRef<TextInput>(null);
  const inputFocusedRef = useRef(false);
  // Mirror of the TextInput content since the last reset. Each change event is
  // diffed against it, so every keystroke maps to exactly one PTY write
  // (appends → chars, shrink → backspaces) regardless of what the IME does.
  // The input is UNCONTROLLED (no `value` prop): a controlled input lets a
  // stale JS render rewrite the native text mid-typing, dropping characters
  // whose bytes were already relayed — the user retypes them and the PTY
  // receives them twice (multiplied letters on screen). Resets go through
  // the imperative native clear() instead.
  const lastTextRef = useRef("");
  const [kbHeight, setKbHeight] = useState(0);

  const session = getSessionById(sessionId);

  useEffect(() => {
    fetchSession(sessionId);
    // Opening the terminal answers the needs-attention badge.
    useAttentionStore.getState().clearAttention(sessionId);
    // Reverb subscription: status + ended transitions, and output fallback
    // while the direct socket is down.
    const unsubscribe = subscribeToSession(sessionId);

    const store = useSessionsStore.getState();
    const socket = new TerminalSocket(sessionId, {
      onOutput: (data) => store.appendOutput(sessionId, data),
      onConnect: () => store.setDirectOutput(sessionId, true),
      onDisconnect: () => store.setDirectOutput(sessionId, false),
    });
    socket.connect();
    socketRef.current = socket;

    return () => {
      unsubscribe();
      socket.close();
      store.setDirectOutput(sessionId, false);
      socketRef.current = null;
    };
  }, [sessionId]);

  // Track the soft keyboard ourselves: with edge-to-edge (targetSdk 36) the
  // window does NOT resize for the IME, so the layout must add the inset.
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKbHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKbHeight(0);
      // Safe point to trim the capture buffer (no typing mid-flight).
      // Mirror reset FIRST: the clear() below fires onChangeText("") and the
      // diff must see prev="" so no spurious backspaces are relayed.
      lastTextRef.current = "";
      inputRef.current?.clear();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    showAlert(
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
              showAlert("Error", "Failed to terminate session");
              setIsTerminating(false);
            }
          },
        },
      ],
    );
  }, [sessionId, terminateSession, navigation]);

  // Raw sequences from the on-screen key bar.
  const handleInput = useCallback((data: string) => {
    socketRef.current?.sendInput(data);
  }, []);

  // xterm refit → resize the server PTY so output wraps at the real width AND
  // the right number of rows (a rows mismatch is what makes the TUI paint
  // "shifted higher"). Sent over the same fast channel as input.
  const handleResize = useCallback((cols: number, rows: number) => {
    socketRef.current?.sendResize(cols, rows);
  }, []);

  // Diff each TextInput change against the mirror and relay keystrokes:
  // N removed chars → N backspaces, appended suffix → those bytes. An armed
  // Ctrl/Alt modifier transforms a single typed letter then disarms.
  const handleNativeChange = useCallback(
    (text: string) => {
      const prev = lastTextRef.current;
      let common = 0;
      while (
        common < prev.length &&
        common < text.length &&
        prev[common] === text[common]
      ) {
        common++;
      }
      const deletions = prev.length - common;
      const appended = text.slice(common);
      lastTextRef.current = text;

      let payload = "\x7f".repeat(deletions) + appended;
      if (
        (ctrlActive || altActive) &&
        deletions === 0 &&
        appended.length === 1
      ) {
        let ch = appended;
        if (ctrlActive) {
          const code = ch.toUpperCase().charCodeAt(0);
          if (code >= 64 && code <= 95) ch = String.fromCharCode(code - 64);
        }
        if (altActive) ch = "\x1b" + ch;
        payload = ch;
        setCtrlActive(false);
        setAltActive(false);
      }
      if (payload) socketRef.current?.sendInput(payload);
    },
    [ctrlActive, altActive],
  );

  // Enter key (single-line input, submitBehavior keeps focus + keyboard).
  const handleNativeSubmit = useCallback(() => {
    socketRef.current?.sendInput("\r");
    // Mirror reset BEFORE clear(): its onChangeText("") must diff against "".
    lastTextRef.current = "";
    inputRef.current?.clear();
  }, []);

  // Tap on the terminal → summon the keyboard via the native input. If the
  // user closed the keyboard with back (input still focused), re-focus needs
  // a blur first, otherwise focus() is a no-op and the keyboard stays hidden.
  const focusTerminalInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    if (inputFocusedRef.current && kbHeight === 0) {
      input.blur();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      input.focus();
    }
  }, [kbHeight]);

  const toggleModifier = useCallback((mod: "ctrl" | "alt") => {
    if (mod === "ctrl") setCtrlActive((prev) => !prev);
    else setAltActive((prev) => !prev);
  }, []);

  if (!session) {
    return <LoadingSpinner text="Loading session..." fullScreen />;
  }

  const isActive = ["created", "starting", "running", "waiting_input"].includes(
    session.status,
  );

  return (
    // Edge-to-edge: the window never resizes for the keyboard, so we pad the
    // layout by the tracked keyboard height — terminal shrinks (and refits)
    // and the key bar lands flush on top of the keyboard.
    <View
      style={[styles.container, kbHeight > 0 && { paddingBottom: kbHeight }]}
    >
      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <View style={styles.outputContainer}>
        <TerminalWebView
          sessionId={sessionId}
          onResize={handleResize}
          onFocusRequest={isActive ? focusTerminalInput : undefined}
        />
      </View>

      {isActive ? (
        <>
          {/* Invisible native key capture — suggestion-free keyboard. */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            defaultValue=""
            onChangeText={handleNativeChange}
            onSubmitEditing={handleNativeSubmit}
            onFocus={() => {
              inputFocusedRef.current = true;
            }}
            onBlur={() => {
              inputFocusedRef.current = false;
            }}
            keyboardType={
              Platform.OS === "android" ? "visible-password" : "default"
            }
            autoCorrect={false}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            importantForAutofill="no"
            caretHidden
            contextMenuHidden
            disableFullscreenUI
            submitBehavior="submit"
            multiline={false}
            accessible={false}
          />
          <TerminalKeyBar
            onSend={handleInput}
            ctrlActive={ctrlActive}
            altActive={altActive}
            onToggleModifier={toggleModifier}
            keyboardVisible={kbHeight > 0}
          />
        </>
      ) : (
        <View
          style={[
            styles.endedContainer,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <Button
            title="Session Ended"
            variant="secondary"
            disabled
            style={styles.endedButton}
          />
        </View>
      )}
    </View>
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
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: 0,
    opacity: 0,
    color: "transparent",
    backgroundColor: "transparent",
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
