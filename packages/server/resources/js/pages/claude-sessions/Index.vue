<template>
  <div class="claude-sessions-page p-4 md:p-6">
    <!-- Header -->
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
      <div>
        <h1 class="text-xl font-semibold" style="color: var(--text-primary, #e5e7eb)">
          {{ t('claudeSessions.title') }}
        </h1>
        <p class="text-sm" style="color: var(--text-secondary, #9ca3af)">
          {{ t('claudeSessions.subtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedMachineId"
          class="rounded-md px-3 py-2 text-sm"
          style="background: var(--bg-card, #24283b); color: var(--text-primary, #e5e7eb); border: 1px solid var(--border, #374151)"
        >
          <option v-if="machines.length === 0" :value="''">
            {{ t('claudeSessions.noMachine') }}
          </option>
          <option v-for="m in machines" :key="m.id" :value="m.id">
            {{ m.status === 'online' ? '🟢' : '⚪' }} {{ m.name }}
          </option>
        </select>

        <label class="flex items-center gap-1 text-sm" style="color: var(--text-secondary, #9ca3af)">
          <input type="checkbox" v-model="liveOnly" />
          {{ t('claudeSessions.liveOnly') }}
        </label>

        <button
          class="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
          style="background: var(--accent-purple, #a855f7); color: white"
          :disabled="!selectedMachineId || store.isLoading || !selectedMachineOnline"
          :title="!selectedMachineOnline ? t('claudeSessions.offlineHint') : ''"
          @click="handleRefresh"
        >
          {{ store.isLoading ? t('claudeSessions.scanning') : t('claudeSessions.refresh') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-4">
      <!-- Session list -->
      <div class="space-y-2">
        <p v-if="!selectedMachineId" class="text-sm" style="color: var(--text-secondary, #9ca3af)">
          {{ t('claudeSessions.selectMachine') }}
        </p>
        <p v-else-if="displayedSessions.length === 0 && !store.isLoading" class="text-sm" style="color: var(--text-secondary, #9ca3af)">
          {{ t('claudeSessions.empty') }}
        </p>

        <article
          v-for="s in displayedSessions"
          :key="s.id"
          class="rounded-lg p-3 transition"
          :style="cardStyle(s)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium truncate" style="color: var(--text-primary, #e5e7eb)">
                  {{ s.project_name }}
                </span>
                <span
                  v-if="s.is_live"
                  class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                  style="background: var(--success, #22c55e); color: #052e13"
                >{{ t('claudeSessions.live') }}</span>
                <span
                  v-if="s.adopted"
                  class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                  style="background: var(--accent-cyan, #22d3ee); color: #052e3a"
                >{{ t('claudeSessions.adopted') }}</span>
              </div>
              <p class="text-xs truncate" style="color: var(--text-secondary, #9ca3af)" :title="s.cwd">
                {{ s.cwd }}
              </p>
              <p class="text-[11px] mt-0.5" style="color: var(--text-tertiary, #6b7280)">
                {{ s.is_live ? `pid ${s.pid} · ${s.tty ?? ''}` : '' }}
                {{ s.last_activity_human ? '· ' + s.last_activity_human : '' }}
              </p>
              <p v-if="s.last_preview" class="text-xs mt-1 line-clamp-2" style="color: var(--text-secondary, #9ca3af)">
                {{ s.last_preview }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-2">
            <button
              class="text-xs font-medium px-2 py-1 rounded"
              style="background: var(--surface-2, #374151); color: var(--text-primary, #e5e7eb)"
              @click="handleOpen(s)"
            >
              {{ store.openSessionId === s.session_id ? t('claudeSessions.viewing') : t('claudeSessions.view') }}
            </button>
            <button
              v-if="s.is_live && !s.adopted"
              class="text-xs font-medium px-2 py-1 rounded disabled:opacity-50"
              style="background: var(--accent-cyan, #22d3ee); color: #052e3a"
              :disabled="adopting === s.session_id || !selectedMachineOnline"
              :title="!selectedMachineOnline ? t('claudeSessions.offlineHint') : ''"
              @click="handleAdopt(s)"
            >
              {{ adopting === s.session_id ? t('claudeSessions.adopting') : t('claudeSessions.adopt') }}
            </button>
          </div>
        </article>
      </div>

      <!-- Transcript viewer -->
      <div
        class="rounded-lg flex flex-col min-h-[60vh]"
        style="background: var(--bg-card, #1a1b26); border: 1px solid var(--border, #374151)"
      >
        <div
          class="flex items-center justify-between px-4 py-2 border-b"
          style="border-color: var(--border, #374151)"
        >
          <span class="text-sm font-medium" style="color: var(--text-primary, #e5e7eb)">
            {{ store.openSessionId ? t('claudeSessions.transcript') : t('claudeSessions.noTranscript') }}
          </span>
          <button
            v-if="store.openSessionId"
            class="text-xs px-2 py-1 rounded"
            style="background: var(--surface-2, #374151); color: var(--text-primary, #e5e7eb)"
            @click="handleClose"
          >
            {{ t('claudeSessions.close') }}
          </button>
        </div>

        <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-3 space-y-3 font-mono text-sm">
          <p v-if="store.isOpening" style="color: var(--text-secondary, #9ca3af)">
            {{ t('claudeSessions.loading') }}
          </p>
          <p v-else-if="!store.openSessionId" style="color: var(--text-tertiary, #6b7280)">
            {{ t('claudeSessions.openHint') }}
          </p>

          <div
            v-for="ev in store.transcript"
            :key="ev.seq"
            v-show="ev.text"
            class="whitespace-pre-wrap break-words"
          >
            <span class="text-[11px] uppercase font-bold mr-2" :style="{ color: roleColor(ev.role) }">
              {{ ev.role }}
            </span>
            <span style="color: var(--text-primary, #d1d5db)">{{ ev.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Adopt — credential picker -->
    <Modal
      v-model="showAdoptModal"
      :title="t('claudeSessions.adoptModal.title')"
      :description="t('claudeSessions.adoptModal.description')"
      size="sm"
      @close="adoptTarget = null"
    >
      <label
        class="block text-sm mb-1"
        for="adopt-credential-select"
        style="color: var(--text-secondary, #9ca3af)"
      >
        {{ t('claudeSessions.adoptModal.credentialLabel') }}
      </label>
      <select
        id="adopt-credential-select"
        v-model="selectedCredentialId"
        class="w-full rounded-md px-3 py-2 text-sm"
        style="background: var(--bg-card, #24283b); color: var(--text-primary, #e5e7eb); border: 1px solid var(--border, #374151)"
      >
        <option :value="''">{{ t('claudeSessions.adoptModal.noCredential') }}</option>
        <option v-for="c in credentials" :key="c.id" :value="c.id">
          {{ c.name }}{{ c.is_default ? ` ${t('claudeSessions.adoptModal.defaultSuffix')}` : '' }}
        </option>
      </select>

      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            class="text-sm font-medium px-3 py-2 rounded-md"
            style="background: var(--surface-2, #374151); color: var(--text-primary, #e5e7eb)"
            @click="showAdoptModal = false; adoptTarget = null"
          >
            {{ t('claudeSessions.adoptModal.cancel') }}
          </button>
          <button
            class="text-sm font-medium px-3 py-2 rounded-md disabled:opacity-50"
            style="background: var(--accent-cyan, #22d3ee); color: #052e3a"
            :disabled="adopting !== null"
            @click="confirmAdopt"
          >
            {{ t('claudeSessions.adoptModal.confirm') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useMachinesStore } from '@/stores/machines';
import { useClaudeSessionsStore } from '@/stores/claudeSessions';
import { useCredentialsStore } from '@/stores/credentials';
import { useToast } from '@/composables/useToast';
import Modal from '@/components/common/Modal.vue';
import type { DiscoveredSession } from '@/types/claudeSessions';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const machinesStore = useMachinesStore();
const { machines } = storeToRefs(machinesStore);
const store = useClaudeSessionsStore();
const credentialsStore = useCredentialsStore();
const { credentials } = storeToRefs(credentialsStore);

const selectedMachineId = ref<string>('');
// Live by default: stale /tmp sessions are pure noise.
const liveOnly = ref(true);
const adopting = ref<string | null>(null);
const scrollEl = ref<HTMLElement | null>(null);

// Adopt modal: pick which credential the resumed session should run with.
const showAdoptModal = ref(false);
const adoptTarget = ref<DiscoveredSession | null>(null);
const selectedCredentialId = ref<string>('');

const displayedSessions = computed(() =>
  liveOnly.value ? store.sessions.filter((s) => s.is_live) : store.sessions,
);

// Persisted sessions are viewable even when the machine is offline (DB-backed);
// only live actions (rescan/adopt) require an online agent.
const selectedMachineOnline = computed(
  () => machines.value.find((m) => m.id === selectedMachineId.value)?.status === 'online',
);

function cardStyle(s: DiscoveredSession): Record<string, string> {
  return {
    background: 'var(--bg-card, #24283b)',
    border:
      store.openSessionId === s.session_id
        ? '1px solid var(--accent-purple, #a855f7)'
        : '1px solid var(--border, #374151)',
  };
}

function roleColor(role?: string): string {
  switch (role) {
    case 'user':
      return 'var(--accent-cyan, #22d3ee)';
    case 'assistant':
      return 'var(--accent-purple, #a855f7)';
    case 'tool':
      return 'var(--warning, #fbbf24)';
    default:
      return 'var(--text-tertiary, #6b7280)';
  }
}

async function loadMachine(machineId: string): Promise<void> {
  if (!machineId) return;
  store.subscribeDiscovered(machineId);
  try {
    await store.fetchSessions(machineId);
  } catch {
    toast.error(t('claudeSessions.toasts.loadFailed'));
  }
}

async function handleRefresh(): Promise<void> {
  if (!selectedMachineId.value) return;
  try {
    await store.refresh(selectedMachineId.value);
    toast.success(t('claudeSessions.toasts.refreshed'));
  } catch {
    toast.error(t('claudeSessions.toasts.refreshFailed'));
  }
}

async function handleOpen(s: DiscoveredSession): Promise<void> {
  try {
    await store.open(selectedMachineId.value, s.session_id);
  } catch {
    toast.error(t('claudeSessions.toasts.openFailed'));
  }
}

async function handleClose(): Promise<void> {
  try {
    await store.close(selectedMachineId.value);
  } catch {
    /* best-effort */
  }
}

async function handleAdopt(s: DiscoveredSession): Promise<void> {
  // Load the user's credentials (best-effort) before showing the picker.
  if (credentials.value.length === 0) {
    try {
      await credentialsStore.fetchCredentials();
    } catch {
      /* no credentials reachable — adopt without one */
    }
  }
  if (credentials.value.length === 0) {
    await performAdopt(s, null);
    return;
  }
  adoptTarget.value = s;
  selectedCredentialId.value = credentialsStore.defaultCredential?.id ?? '';
  showAdoptModal.value = true;
}

async function confirmAdopt(): Promise<void> {
  const target = adoptTarget.value;
  if (!target) return;
  showAdoptModal.value = false;
  adoptTarget.value = null;
  await performAdopt(target, selectedCredentialId.value || null);
}

async function performAdopt(s: DiscoveredSession, credentialId: string | null): Promise<void> {
  adopting.value = s.session_id;
  try {
    const agentSessionId = await store.adopt(selectedMachineId.value, s.session_id, credentialId);
    toast.success(t('claudeSessions.toasts.adopted'));
    if (agentSessionId) {
      // The resumed session is now a live terminal — open it.
      router.push({ name: 'session.terminal', params: { id: agentSessionId } });
    }
  } catch {
    toast.error(t('claudeSessions.toasts.adoptFailed'));
  } finally {
    adopting.value = null;
  }
}

// Auto-scroll the transcript to the bottom on new events.
watch(
  () => store.transcript.length,
  async () => {
    await nextTick();
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight;
  },
);

watch(selectedMachineId, (id) => loadMachine(id));

onMounted(async () => {
  if (machinesStore.machines.length === 0) {
    await machinesStore.fetchMachines();
  }
  // Prefer an online machine, but fall back to any machine so persisted
  // sessions are shown even when the agent is currently offline.
  if (!selectedMachineId.value && machines.value.length > 0) {
    const online = machines.value.find((m) => m.status === 'online');
    selectedMachineId.value = (online ?? machines.value[0]).id;
  }
});

onUnmounted(() => store.teardown());
</script>
