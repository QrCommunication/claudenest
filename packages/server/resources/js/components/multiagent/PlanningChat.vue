<template>
  <div class="planning-chat" :class="{ collapsed: !isOpen }">
    <!-- Toggle button -->
    <button class="chat-toggle" @click="isOpen = !isOpen">
      <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
      <span v-if="!isOpen">{{ t('multiagentPlanningchat.planning') }}</span>
    </button>

    <!-- Chat panel -->
    <div v-if="isOpen" class="chat-panel">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="agent-indicator" />
          <span class="chat-title">{{ t('multiagentPlanningchat.planningAgent') }}</span>
        </div>
        <button class="chat-close" @click="isOpen = false">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-3.5 h-3.5">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div class="chat-messages" ref="messagesContainer">
        <!-- Welcome message -->
        <div v-if="messages.length === 0" class="chat-welcome">
          <p class="text-skin-muted text-sm">{{ t('multiagentPlanningchat.askToPlan') }}</p>
          <div class="suggestions">
            <button v-for="s in suggestions" :key="s" class="suggestion-chip" @click="sendMessage(s)">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Messages list -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="chat-message"
          :class="msg.role"
        >
          <div class="message-header">
            <span class="message-author">{{ msg.role === 'user' ? t('multiagentPlanningchat.you') : t('multiagentPlanningchat.planningAgent') }}</span>
            <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-content">{{ msg.content }}</div>

          <!-- Actions preview (si l'agent propose des modifications) -->
          <div v-if="msg.actions && msg.actions.length > 0" class="message-actions">
            <div v-for="action in msg.actions" :key="action.id" class="action-item">
              <span class="action-type">{{ action.type }}</span>
              <span class="action-desc">{{ action.description }}</span>
            </div>
            <div class="action-buttons">
              <button class="btn-approve" @click="$emit('approve-actions', msg.actions)">
                {{ t('multiagentPlanningchat.apply') }}
              </button>
              <button class="btn-reject" @click="$emit('reject-actions', msg.id)">
                {{ t('multiagentPlanningchat.dismiss') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="typing-indicator">
          <span /><span /><span />
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input">
        <textarea
          ref="inputRef"
          v-model="inputText"
          :placeholder="t('multiagentPlanningchat.inputPlaceholder')"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        />
        <button
          class="send-btn"
          :disabled="!inputText.trim() || isTyping"
          @click="handleSend"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: PlanningAction[];
}

interface PlanningAction {
  id: string;
  type: 'create_epic' | 'create_task' | 'create_sprint' | 'move_task' | 'update_task' | 'decompose';
  description: string;
  data: Record<string, unknown>;
}

interface Props {
  projectId: string;
  isLoading?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<{
  'send-message': [message: string];
  'approve-actions': [actions: PlanningAction[]];
  'reject-actions': [messageId: string];
}>();

const { t } = useI18n();

const isOpen = ref(false);
const inputText = ref('');
const messages = ref<ChatMessage[]>([]);
const isTyping = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// computed so suggestions re-translate on locale change (plain const freezes t()).
const suggestions = computed(() => [
  t('multiagentPlanningchat.suggestionCreateEpic'),
  t('multiagentPlanningchat.suggestionPlanSprint'),
  t('multiagentPlanningchat.suggestionDecomposeTask'),
  t('multiagentPlanningchat.suggestionShowProgress'),
]);

function handleSend() {
  if (!inputText.value.trim() || isTyping.value) return;

  const text = inputText.value.trim();
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    timestamp: Date.now(),
  });

  inputText.value = '';
  isTyping.value = true;
  emit('send-message', text);
  scrollToBottom();
}

function sendMessage(text: string) {
  inputText.value = text;
  handleSend();
}

function receiveMessage(content: string, actions?: PlanningAction[]) {
  isTyping.value = false;
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: Date.now(),
    actions,
  });
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function autoResize() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px';
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

defineExpose({ receiveMessage });
</script>

<style scoped>
.planning-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-left: 1px solid var(--border-color, rgba(255,255,255,0.06));
  background: var(--bg-secondary, #1a1b26);
  width: 360px;
  transition: width 0.2s ease;
}

.planning-chat.collapsed {
  width: 48px;
}

.chat-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  color: var(--text-secondary, rgba(255,255,255,0.5));
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
  width: 100%;
  justify-content: center;
}
.chat-toggle:hover { color: var(--accent-purple, #a855f7); }
.collapsed .chat-toggle { writing-mode: vertical-rl; padding: 1rem 0.75rem; }

.chat-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
}
.chat-header-info { display: flex; align-items: center; gap: 0.5rem; }
.agent-indicator {
  width: 0.5rem; height: 0.5rem;
  border-radius: 50%;
  background: var(--status-success, #22c55e);
  box-shadow: 0 0 6px color-mix(in srgb, var(--status-success, #22c55e) 40%, transparent);
}
.chat-title { font-size: 0.8125rem; color: var(--text-primary, rgba(255,255,255,0.8)); font-weight: 500; }
.chat-close { color: var(--text-muted, rgba(255,255,255,0.3)); padding: 0.25rem; border-radius: 0.25rem; }
.chat-close:hover { color: var(--text-primary, rgba(255,255,255,0.7)); background: var(--bg-hover, rgba(255,255,255,0.05)); }

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
}
.suggestions { display: flex; flex-direction: column; gap: 0.375rem; width: 100%; }
.suggestion-chip {
  text-align: left;
  font-size: 0.75rem;
  color: var(--text-secondary, rgba(255,255,255,0.6));
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, rgba(255,255,255,0.08));
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;
}
.suggestion-chip:hover {
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 6%, transparent);
}

.chat-message { display: flex; flex-direction: column; gap: 0.25rem; }
.message-header { display: flex; justify-content: space-between; align-items: center; }
.message-author { font-size: 0.6875rem; font-weight: 600; }
.message-time { font-size: 0.625rem; color: var(--text-muted, rgba(255,255,255,0.25)); }
.chat-message.user .message-author { color: var(--accent-cyan, #22d3ee); }
.chat-message.assistant .message-author { color: var(--accent-purple, #a855f7); }
.message-content {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text-primary, rgba(255,255,255,0.75));
}

.message-actions {
  margin-top: 0.375rem;
  padding: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 6%, transparent);
}
.action-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.75rem;
}
.action-type {
  font-size: 0.625rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  padding: 0.0625rem 0.375rem;
  border-radius: 0.125rem;
  text-transform: uppercase;
  font-weight: 600;
}
.action-desc { color: var(--text-secondary, rgba(255,255,255,0.6)); }
.action-buttons { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.btn-approve {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  background: var(--accent-purple, #a855f7);
  color: #fff;
  font-weight: 500;
}
.btn-approve:hover { background: color-mix(in srgb, var(--accent-purple, #a855f7) 85%, #000); }
.btn-reject {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  color: var(--text-muted, rgba(255,255,255,0.4));
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
}
.btn-reject:hover { color: var(--text-primary, rgba(255,255,255,0.7)); }

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
}
.typing-indicator span {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--accent-purple, #a855f7);
  animation: typing 1.4s infinite ease-in-out;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.625rem;
  border-top: 1px solid var(--border-color, rgba(255,255,255,0.06));
}
.chat-input textarea {
  flex: 1;
  background: var(--bg-input, rgba(255,255,255,0.04));
  border: 1px solid var(--border-color, rgba(255,255,255,0.08));
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--text-primary, rgba(255,255,255,0.9));
  resize: none;
  min-height: 2.25rem;
  max-height: 7.5rem;
  line-height: 1.4;
}
.chat-input textarea:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 40%, transparent);
}
.chat-input textarea::placeholder {
  color: var(--text-muted, rgba(255,255,255,0.25));
}
.send-btn {
  padding: 0.5rem;
  border-radius: 0.375rem;
  color: var(--accent-purple, #a855f7);
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent); }
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
