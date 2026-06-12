import { defineStore } from 'pinia';
import { ref } from 'vue';
import { claudeSessionsApi } from '@/services/api';
import { subscribePrivate } from '@/services/echo';
import type {
  DiscoveredSession,
  TranscriptEvent,
  TranscriptBroadcast,
  DiscoveredBroadcast,
} from '@/types/claudeSessions';

/**
 * Store for the user's own Claude sessions discovered by the agent.
 * Lists them, keeps the list fresh via the machine broadcast, and mirrors one
 * session's redacted transcript live.
 */
export const useClaudeSessionsStore = defineStore('claudeSessions', () => {
  // ==================== STATE ====================
  const sessions = ref<DiscoveredSession[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const openSessionId = ref<string | null>(null);
  const transcript = ref<TranscriptEvent[]>([]);
  const isOpening = ref(false);

  let unsubTranscript: (() => void) | null = null;
  let unsubDiscovered: (() => void) | null = null;

  // ==================== ACTIONS ====================
  async function fetchSessions(machineId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      sessions.value = await claudeSessionsApi.list(machineId);
    } catch (err) {
      error.value = 'Failed to load Claude sessions';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function refresh(machineId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      sessions.value = await claudeSessionsApi.refresh(machineId);
    } catch (err) {
      error.value = 'Failed to refresh Claude sessions';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Keep the list live: the agent re-scans every 30s; the broadcast is a slim
   * signal (machine_id + count — the full list exceeded the Reverb payload
   * limit), so we refetch the normalized list via REST on each signal.
   * Silent refetch: no isLoading toggle, the visible list must not flicker.
   */
  function subscribeDiscovered(machineId: string): void {
    unsubDiscovered?.();
    unsubDiscovered = subscribePrivate<DiscoveredBroadcast>(
      `machines.${machineId}`,
      '.claude_sessions.discovered',
      () => {
        void claudeSessionsApi
          .list(machineId)
          .then((list) => {
            sessions.value = list;
          })
          .catch(() => {
            // Transient fetch failure — keep the current list, the next
            // 30s signal will retry.
          });
      },
    );
  }

  /** Open a session: load redacted history then stream live appends. */
  async function open(machineId: string, sessionId: string): Promise<void> {
    stopTranscript();
    isOpening.value = true;
    transcript.value = [];
    try {
      const history = await claudeSessionsApi.open(machineId, sessionId);
      transcript.value = [...history];
      openSessionId.value = sessionId;

      unsubTranscript = subscribePrivate<TranscriptBroadcast>(
        `claude-sessions.${sessionId}`,
        '.claude_sessions.transcript',
        (payload) => {
          transcript.value = payload.replace
            ? [...payload.events]
            : [...transcript.value, ...payload.events];
        },
      );
    } finally {
      isOpening.value = false;
    }
  }

  async function close(machineId: string): Promise<void> {
    const sessionId = openSessionId.value;
    stopTranscript();
    openSessionId.value = null;
    transcript.value = [];
    if (sessionId) {
      await claudeSessionsApi.close(machineId, sessionId);
    }
  }

  async function adopt(
    machineId: string,
    sessionId: string,
    credentialId?: string | null,
  ): Promise<string | null> {
    const agentSessionId = await claudeSessionsApi.adopt(machineId, sessionId, credentialId);
    const session = sessions.value.find((s) => s.session_id === sessionId);
    if (session) {
      session.adopted = true;
      session.agent_session_id = agentSessionId;
    }
    return agentSessionId;
  }

  function stopTranscript(): void {
    unsubTranscript?.();
    unsubTranscript = null;
  }

  /** Tear down all subscriptions (call on component unmount). */
  function teardown(): void {
    stopTranscript();
    unsubDiscovered?.();
    unsubDiscovered = null;
    openSessionId.value = null;
    transcript.value = [];
  }

  return {
    sessions,
    isLoading,
    error,
    openSessionId,
    transcript,
    isOpening,
    fetchSessions,
    refresh,
    subscribeDiscovered,
    open,
    close,
    adopt,
    teardown,
  };
});
