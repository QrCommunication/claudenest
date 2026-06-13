/**
 * Global real-time sync for project deletions originating from another client
 * or browser tab.
 *
 * Subscribes to every owned machine's private `machines.{id}` channel and reacts
 * to the `.project.deleted` broadcast (App\Events\ProjectDeleted, broadcastAs
 * `project.deleted`) by purging the project from local state — list entry,
 * current selection and its derived data, plus the pinned sidebar link via
 * projectsStore.removeProjectLocal — and closing any tab open on it (redirecting
 * away if one was the active tab) via useTabs().closeProjectTabs.
 *
 * Mounted once in AppLayout: the purge then happens regardless of the route the
 * receiving tab currently shows (projects list, sidebar, or the deleted
 * project's own workspace). The machine channel — not `projects.{id}` — is used
 * deliberately: one channel per machine reaches a tab even when it never opened
 * the deleted project, which is exactly what list/sidebar removal needs.
 *
 * Teardown uses stopListening (never leave): the `machines.{id}` channel is
 * shared with the Claude-sessions discovery listener, and an unguarded leave()
 * would drop that sibling subscription too.
 */

import { onUnmounted, watch } from 'vue';
import type Echo from 'laravel-echo';
import { getEchoClient } from '@/services/echo';
import { useMachinesStore } from '@/stores/machines';
import { useProjectsStore } from '@/stores/projects';
import { useTabs } from '@/composables/useTabs';

/** Scalar payload of App\Events\ProjectDeleted::broadcastWith. */
export interface ProjectDeletedPayload {
  project_id: string;
  machine_id: string;
  name: string;
  deleted_at: string;
}

const EVENT = '.project.deleted';

export function useProjectDeletionSync(): void {
  const machinesStore = useMachinesStore();
  const projectsStore = useProjectsStore();
  const { closeProjectTabs } = useTabs();

  const handler = (payload: unknown): void => {
    const { project_id: projectId } = (payload ?? {}) as ProjectDeletedPayload;
    if (!projectId) return;
    // Pure client-side purge (no API call) — the row is already gone server-side.
    projectsStore.removeProjectLocal(projectId);
    closeProjectTabs(projectId);
  };

  // Active subscriptions keyed by machine id.
  const subscribed = new Set<string>();

  function reconcile(ids: string[]): void {
    let client: Echo<'reverb'>;
    try {
      client = getEchoClient();
    } catch {
      // Reverb config missing (tests, degraded boot) — real-time disabled.
      return;
    }

    const wanted = new Set(ids);

    for (const id of wanted) {
      if (subscribed.has(id)) continue;
      client.private(`machines.${id}`).listen(EVENT, handler);
      subscribed.add(id);
    }

    for (const id of [...subscribed]) {
      if (wanted.has(id)) continue;
      try {
        client.private(`machines.${id}`).stopListening(EVENT, handler);
      } catch {
        // Channel already gone — nothing to detach.
      }
      subscribed.delete(id);
    }
  }

  // Re-subscribe only when the set of machine ids actually changes (a sorted,
  // joined key avoids spurious churn on unrelated machine field mutations).
  watch(
    () => machinesStore.machines.map((m) => m.id).sort().join(','),
    (key) => reconcile(key ? key.split(',') : []),
    { immediate: true },
  );

  // Ensure we have machine channels to listen on even if no page loaded them yet.
  if (machinesStore.machines.length === 0) {
    void machinesStore.fetchMachines(1, 100).catch(() => {
      // Transient failure — the watch re-runs once machines arrive.
    });
  }

  onUnmounted(() => {
    let client: Echo<'reverb'>;
    try {
      client = getEchoClient();
    } catch {
      subscribed.clear();
      return;
    }
    for (const id of subscribed) {
      try {
        client.private(`machines.${id}`).stopListening(EVENT, handler);
      } catch {
        // Channel already gone.
      }
    }
    subscribed.clear();
  });
}
