/**
 * In-app notification service (non-blocking banner)
 *
 * Lightweight Zustand-backed state for transient banners, following the same
 * pattern as services/dialog (imperative API + a single host component
 * <NotificationBanner/> mounted at the app root).
 *
 * Primary feed: `.session.notification` realtime events (worker paused after
 * nudges, permission requests…) re-emitted by services/websocket as the
 * internal `session:notification` event on both `sessions.{id}` and
 * `projects.{id}` channels — the throttle below absorbs the double delivery.
 */
import { create } from "zustand";

/** Payload re-emitted by services/websocket for `.session.notification`. */
interface SessionNotificationPayload {
  session_id?: string;
  project_id?: string;
  title?: string;
  message?: string;
  notification_type?: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  /** Tap target — the banner navigates to this session when set. */
  sessionId?: string;
  projectId?: string;
  type?: string;
}

interface InAppNotifyState {
  current: InAppNotification | null;
  show: (notification: Omit<InAppNotification, "id">) => void;
  dismiss: () => void;
}

/** Re-notifying the same session + type within this window is ignored. */
const THROTTLE_WINDOW_MS = 10_000;
/** The banner auto-hides after this delay (non-blocking UX). */
const AUTO_HIDE_MS = 6_000;

let seq = 0;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
const lastShownAt = new Map<string, number>();

export const useInAppNotifyStore = create<InAppNotifyState>((set) => ({
  current: null,

  show: (notification) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ current: { id: `ntf_${++seq}`, ...notification } });
    hideTimer = setTimeout(() => {
      hideTimer = null;
      set({ current: null });
    }, AUTO_HIDE_MS);
  },

  dismiss: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ current: null });
  },
}));

/** Imperative helper (parallel to showAlert in services/dialog). */
export function showNotification(
  notification: Omit<InAppNotification, "id">,
): void {
  useInAppNotifyStore.getState().show(notification);
}

/**
 * Handler for the internal `session:notification` websocket event.
 * Drops duplicates (same session + type) within THROTTLE_WINDOW_MS.
 */
export function handleSessionNotification(raw: unknown): void {
  const payload = (raw ?? {}) as SessionNotificationPayload;
  const title = payload.title?.trim();
  const message = payload.message?.trim();
  if (!title && !message) return;

  const throttleKey = `${payload.session_id ?? "global"}:${payload.notification_type ?? "default"}`;
  const now = Date.now();
  const last = lastShownAt.get(throttleKey);
  if (last !== undefined && now - last < THROTTLE_WINDOW_MS) return;
  lastShownAt.set(throttleKey, now);

  // Keep the throttle map bounded (long-lived app sessions).
  if (lastShownAt.size > 100) {
    for (const [key, shownAt] of lastShownAt) {
      if (now - shownAt >= THROTTLE_WINDOW_MS) lastShownAt.delete(key);
    }
  }

  showNotification({
    title: title ?? "Notification",
    message: message ?? "",
    sessionId: payload.session_id,
    projectId: payload.project_id,
    type: payload.notification_type,
  });
}
