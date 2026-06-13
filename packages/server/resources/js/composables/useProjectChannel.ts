/**
 * Typed subscription to the private `projects.{id}` Echo channel.
 *
 * Mirrors the server broadcast contracts (app/Events/*) so pages can apply
 * targeted store mutations instead of polling. Channels are reference-counted
 * at module level: several components may subscribe to the same project at
 * once, and the underlying channel is only left when the last consumer
 * unbinds (an unguarded `echo.leave()` would kill sibling listeners).
 */

import { onUnmounted, watch, type Ref } from 'vue';
import type Echo from 'laravel-echo';
import { getEchoClient } from '@/services/echo';
import type { InstanceStatus, TaskPriority, TaskStatus } from '@/types';

type PrivateChannel = ReturnType<Echo<'reverb'>['private']>;

// ── Server broadcast payloads (see app/Events/*::broadcastWith) ──────────────

export interface TaskCreatedPayload {
  task_id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  created_at: string;
}

export interface TaskClaimedPayload {
  task_id: string;
  project_id: string;
  title: string;
  assigned_to: string | null;
  claimed_at: string | null;
}

export interface TaskReleasedPayload {
  task_id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  previous_owner: string | null;
}

export interface TaskCompletedPayload {
  task_id: string;
  project_id: string;
  title: string;
  assigned_to: string | null;
  completion_summary: string | null;
  files_modified: string[] | null;
  completed_at: string | null;
}

export interface FileLockedPayload {
  lock_id: string;
  project_id: string;
  path: string;
  locked_by: string;
  reason: string | null;
  expires_at: string;
}

export interface FileUnlockedPayload {
  project_id: string;
  path: string;
  forced: boolean;
  timestamp: string;
}

export interface InstanceUpdatedPayload {
  id: string;
  status: InstanceStatus;
  current_task_id: string | null;
  session_id: string | null;
}

export interface EpicUpdatedPayload {
  epic_id: string;
  action: string;
  title: string;
  status: string;
  progress_percentage: number;
  timestamp: string;
}

export interface SprintUpdatedPayload {
  sprint_id: string;
  action: string;
  name: string;
  status: string;
  progress_percentage: number;
  remaining_days: number | null;
  timestamp: string;
}

export interface SessionNotificationPayload {
  session_id: string;
  shared_project_id: string | null;
  machine_id: string;
  title: string;
  message: string;
  /** Optional i18n keys + named params (translated client-side). */
  title_key?: string | null;
  message_key?: string | null;
  params?: Record<string, unknown>;
  notification_type: string;
  timestamp: string;
}

export interface ProjectChannelEvents {
  'task.created': TaskCreatedPayload;
  'task.claimed': TaskClaimedPayload;
  'task.released': TaskReleasedPayload;
  'task.completed': TaskCompletedPayload;
  'file.locked': FileLockedPayload;
  'file.unlocked': FileUnlockedPayload;
  'instance.updated': InstanceUpdatedPayload;
  'epic.updated': EpicUpdatedPayload;
  'sprint.updated': SprintUpdatedPayload;
  'session.notification': SessionNotificationPayload;
}

export type ProjectChannelEventName = keyof ProjectChannelEvents;

// ── Reference-counted channel registry (module scope) ────────────────────────

interface ChannelEntry {
  channel: PrivateChannel;
  refs: number;
}

const registry = new Map<string, ChannelEntry>();

function acquireChannel(projectId: string): PrivateChannel | null {
  let entry = registry.get(projectId);

  if (!entry) {
    let client: Echo<'reverb'>;
    try {
      client = getEchoClient();
    } catch {
      // Reverb config missing (tests, degraded boot) — real-time disabled.
      return null;
    }
    entry = { channel: client.private(`projects.${projectId}`), refs: 0 };
    registry.set(projectId, entry);
  }

  entry.refs += 1;
  return entry.channel;
}

function releaseChannel(projectId: string): void {
  const entry = registry.get(projectId);
  if (!entry) return;

  entry.refs -= 1;
  if (entry.refs > 0) return;

  registry.delete(projectId);
  try {
    getEchoClient().leave(`projects.${projectId}`);
  } catch {
    // Echo unavailable — nothing to leave.
  }
}

// ── Composable ────────────────────────────────────────────────────────────────

interface RegisteredListener {
  /** Dot-prefixed event name (`.task.created`) — bypasses Echo namespacing. */
  event: string;
  handler: (payload: unknown) => void;
}

export interface UseProjectChannel {
  /** Register a typed handler for a project broadcast event. */
  on: <K extends ProjectChannelEventName>(
    event: K,
    handler: (payload: ProjectChannelEvents[K]) => void,
  ) => void;
  /** Detach all handlers and leave the channel (also runs on unmount). */
  leave: () => void;
}

export function useProjectChannel(
  projectId: Readonly<Ref<string | null>>,
): UseProjectChannel {
  const listeners: RegisteredListener[] = [];
  let channel: PrivateChannel | null = null;
  let boundProjectId: string | null = null;

  function bind(id: string): void {
    channel = acquireChannel(id);
    if (!channel) return;

    boundProjectId = id;
    for (const { event, handler } of listeners) {
      channel.listen(event, handler);
    }
  }

  function unbind(): void {
    if (!channel || boundProjectId === null) {
      channel = null;
      boundProjectId = null;
      return;
    }

    for (const { event, handler } of listeners) {
      channel.stopListening(event, handler);
    }
    releaseChannel(boundProjectId);
    channel = null;
    boundProjectId = null;
  }

  function on<K extends ProjectChannelEventName>(
    event: K,
    handler: (payload: ProjectChannelEvents[K]) => void,
  ): void {
    const entry: RegisteredListener = {
      event: `.${event}`,
      handler: handler as (payload: unknown) => void,
    };
    listeners.push(entry);

    // Late registration: attach immediately if the channel is already bound.
    if (channel) {
      channel.listen(entry.event, entry.handler);
    }
  }

  watch(
    projectId,
    (next) => {
      if (next === boundProjectId) return;
      unbind();
      if (next) bind(next);
    },
    { immediate: true },
  );

  onUnmounted(unbind);

  return { on, leave: unbind };
}
