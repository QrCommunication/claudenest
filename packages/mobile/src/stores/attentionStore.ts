/**
 * Attention Store - Zustand
 * Tracks sessions that need the user's attention (needs-input / paused worker
 * / permission request), fed by realtime `session:notification` events.
 *
 * The flag is set by handleAttentionNotification (wired once at the app root,
 * next to the NotificationBanner feed) and cleared when the user opens the
 * session's terminal screen. Session cards subscribe per-id to render a badge.
 */

import { create } from "zustand";

/** Payload re-emitted by services/websocket for `.session.notification`. */
interface SessionNotificationPayload {
  session_id?: string;
  notification_type?: string;
}

/**
 * Notification types that do NOT require user action. Everything else
 * (warning, error, needs_input, permission…) marks the session — the server
 * accepts free-form types (max 50 chars), so a denylist of informational
 * types is safer than an allowlist of attention types.
 */
const INFORMATIONAL_TYPES = new Set(["info", "success"]);

interface AttentionState {
  /** sessionId → notification_type of the latest attention-worthy event. */
  bySession: Record<string, string>;

  markAttention: (sessionId: string, type: string) => void;
  clearAttention: (sessionId: string) => void;
}

export const useAttentionStore = create<AttentionState>((set) => ({
  bySession: {},

  markAttention: (sessionId, type) =>
    set((state) =>
      state.bySession[sessionId] === type
        ? state
        : { bySession: { ...state.bySession, [sessionId]: type } },
    ),

  clearAttention: (sessionId) =>
    set((state) => {
      if (!(sessionId in state.bySession)) return state;
      const next = { ...state.bySession };
      delete next[sessionId];
      return { bySession: next };
    }),
}));

/**
 * Handler for the internal `session:notification` websocket event.
 * Marks the session as needing attention unless the type is informational.
 */
export function handleAttentionNotification(raw: unknown): void {
  const payload = (raw ?? {}) as SessionNotificationPayload;
  if (!payload.session_id) return;

  const type = payload.notification_type ?? "info";
  if (INFORMATIONAL_TYPES.has(type)) return;

  useAttentionStore.getState().markAttention(payload.session_id, type);
}
