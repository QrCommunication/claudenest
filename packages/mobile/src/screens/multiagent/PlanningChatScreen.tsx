/**
 * PlanningChatScreen
 * Chat interface with the planning agent for a given project.
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { planningApi } from '@/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProjectsStackParamList } from '@/navigation/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = NativeStackScreenProps<ProjectsStackParamList, 'PlanningChat'>;

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  /** Proposed actions emitted by the assistant */
  actions?: ActionPreview[];
  actionsApplied?: boolean;
}

interface ActionPreview {
  type: string;
  description: string;
  payload?: Record<string, unknown>;
}

interface Suggestion {
  label: string;
  prompt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUICK_SUGGESTIONS: Suggestion[] = [
  { label: 'Summarize project', prompt: 'Give me a summary of the current project status.' },
  { label: 'Next tasks',        prompt: 'What are the most important tasks to work on next?' },
  { label: 'Blockers',          prompt: 'What is currently blocking progress?' },
  { label: 'Sprint plan',       prompt: 'Help me plan the next sprint.' },
  { label: 'Review tasks',      prompt: 'Which tasks are ready for review?' },
];

// ---------------------------------------------------------------------------
// TypingIndicator — 3 pulsing dots
// ---------------------------------------------------------------------------

const TypingIndicator = memo(function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(500 - i * 160),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={typingStyles.container}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            typingStyles.dot,
            {
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// ActionPreviewCard — shows proposed actions with Apply/Dismiss
// ---------------------------------------------------------------------------

interface ActionPreviewCardProps {
  actions: ActionPreview[];
  onApply: () => void;
  onDismiss: () => void;
  applied: boolean;
}

const ActionPreviewCard = memo(function ActionPreviewCard({
  actions,
  onApply,
  onDismiss,
  applied,
}: ActionPreviewCardProps) {
  return (
    <View style={actionStyles.card}>
      <View style={actionStyles.header}>
        <Icon name="auto-fix-high" size={16} color={colors.primary.purple} />
        <Text style={actionStyles.headerText}>Proposed Actions</Text>
      </View>
      {actions.map((action, i) => (
        <View key={i} style={actionStyles.actionRow}>
          <View style={actionStyles.typeBadge}>
            <Text style={actionStyles.typeText}>{action.type}</Text>
          </View>
          <Text style={actionStyles.actionDesc}>{action.description}</Text>
        </View>
      ))}
      {!applied ? (
        <View style={actionStyles.buttons}>
          <TouchableOpacity style={actionStyles.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={actionStyles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity style={actionStyles.applyBtn} onPress={onApply} activeOpacity={0.7}>
            <Icon name="check" size={14} color="#fff" />
            <Text style={actionStyles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={actionStyles.applied}>
          <Icon name="check-circle" size={14} color={colors.semantic.success} />
          <Text style={actionStyles.appliedText}>Applied</Text>
        </View>
      )}
    </View>
  );
});

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ChatMessage;
  onApplyActions: (messageId: string) => void;
  onDismissActions: (messageId: string) => void;
}

const MessageBubble = memo(function MessageBubble({
  message,
  onApplyActions,
  onDismissActions,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const fadeOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        bubbleStyles.wrapper,
        isUser ? bubbleStyles.wrapperUser : bubbleStyles.wrapperAssistant,
        { opacity: fadeOpacity, transform: [{ translateY: slideY }] },
      ]}
    >
      {!isUser && (
        <View style={bubbleStyles.avatar}>
          <Icon name="smart-toy" size={14} color={colors.primary.purple} />
        </View>
      )}
      <View style={bubbleStyles.messageColumn}>
        <View style={[bubbleStyles.bubble, isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAssistant]}>
          <Text style={[bubbleStyles.content, isUser ? bubbleStyles.contentUser : bubbleStyles.contentAssistant]}>
            {message.content}
          </Text>
        </View>
        {message.actions && message.actions.length > 0 && (
          <ActionPreviewCard
            actions={message.actions}
            applied={message.actionsApplied ?? false}
            onApply={() => onApplyActions(message.id)}
            onDismiss={() => onDismissActions(message.id)}
          />
        )}
        <Text style={[bubbleStyles.time, isUser && bubbleStyles.timeUser]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {isUser && (
        <View style={bubbleStyles.avatar}>
          <Icon name="person" size={14} color={colors.primary.cyan} />
        </View>
      )}
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// PlanningChatScreen
// ---------------------------------------------------------------------------

export const PlanningChatScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(QUICK_SUGGESTIONS);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);

  // Load initial context / suggestions from the API
  useEffect(() => {
    let cancelled = false;
    planningApi.getContext(projectId).then((res) => {
      if (cancelled) return;
      if (res.data?.suggestions && res.data.suggestions.length > 0) {
        setSuggestions(
          res.data.suggestions.map((s, i) => ({ label: s.slice(0, 30), prompt: s, key: String(i) } as unknown as Suggestion))
        );
      }
    }).catch(() => {
      // fallback to static suggestions — already set
    });
    return () => { cancelled = true; };
  }, [projectId]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setError(null);
    setInputText('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    scrollToBottom();

    try {
      const res = await planningApi.execute(projectId, { prompt: trimmed });
      const result = res.data?.result ?? '';

      // Naive action detection: look for JSON-fenced blocks
      let content = result;
      let actions: ActionPreview[] | undefined;
      const actionMatch = result.match(/```actions\n([\s\S]*?)```/);
      if (actionMatch) {
        try {
          actions = JSON.parse(actionMatch[1]) as ActionPreview[];
          content = result.replace(actionMatch[0], '').trim();
        } catch {
          // not valid JSON, treat as plain text
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content || 'Done.',
        timestamp: new Date().toISOString(),
        actions,
        actionsApplied: false,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to contact planning agent';
      setError(msg);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }, [isTyping, projectId, scrollToBottom]);

  const handleSend = useCallback(() => {
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const handleSuggestion = useCallback((suggestion: Suggestion) => {
    sendMessage(suggestion.prompt);
  }, [sendMessage]);

  const handleApplyActions = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, actionsApplied: true } : m)
    );
  }, []);

  const handleDismissActions = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, actions: undefined } : m)
    );
  }, []);

  const renderMessage = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => (
      <MessageBubble
        message={item}
        onApplyActions={handleApplyActions}
        onDismissActions={handleDismissActions}
      />
    ),
    [handleApplyActions, handleDismissActions]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="smart-toy" size={48} color={colors.primary.purple + '60'} />
              <Text style={styles.emptyTitle}>Planning Agent</Text>
              <Text style={styles.emptySubtitle}>
                Ask the agent to plan tasks, analyze blockers, or draft a sprint.
              </Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingWrapper}>
                <View style={styles.typingAvatar}>
                  <Icon name="smart-toy" size={14} color={colors.primary.purple} />
                </View>
                <TypingIndicator />
              </View>
            ) : null
          }
        />

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Icon name="error-outline" size={16} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Icon name="close" size={16} color={colors.semantic.error} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick suggestions */}
        {messages.length === 0 && !isTyping && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestions}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => handleSuggestion(s)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Message the planning agent..."
            placeholderTextColor={colors.text.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            returnKeyType="default"
            blurOnSubmit={false}
            editable={!isTyping}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Icon
              name="send"
              size={18}
              color={!inputText.trim() || isTyping ? colors.text.muted : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  root: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },
  typingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.dark3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary.purple + '40',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.error + '20',
    borderTopWidth: 1,
    borderTopColor: colors.semantic.error + '40',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.semantic.error,
  },
  suggestions: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  suggestionChip: {
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary.purple + '40',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  suggestionText: {
    fontSize: typography.size.sm,
    color: colors.primary.purple,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background.dark1,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.size.base,
    maxHeight: 120,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.dark3,
  },
});

const bubbleStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperAssistant: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.dark3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    flexShrink: 0,
  },
  messageColumn: {
    maxWidth: '75%',
    gap: spacing.xs,
  },
  bubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary.cyan + '25',
    borderWidth: 1,
    borderColor: colors.primary.cyan + '50',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.primary.purple + '20',
    borderWidth: 1,
    borderColor: colors.primary.purple + '40',
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  contentUser: {
    color: colors.text.primary,
  },
  contentAssistant: {
    color: colors.text.primary,
  },
  time: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    alignSelf: 'flex-start',
  },
  timeUser: {
    alignSelf: 'flex-end',
  },
});

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.purple + '20',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary.purple,
  },
});

const actionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary.purple + '40',
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.primary.purple,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  typeBadge: {
    backgroundColor: colors.background.dark2,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
  },
  actionDesc: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    justifyContent: 'flex-end',
  },
  dismissBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  dismissText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary.purple,
  },
  applyText: {
    fontSize: typography.size.sm,
    color: '#fff',
    fontWeight: '600',
  },
  applied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  appliedText: {
    fontSize: typography.size.sm,
    color: colors.semantic.success,
    fontWeight: '600',
  },
});
