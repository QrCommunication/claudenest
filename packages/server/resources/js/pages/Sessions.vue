<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Sessions</h1>
        <p class="text-dark-4 mt-1">Manage your active and past Claude Code sessions</p>
      </div>
      <Button @click="showNewSessionModal = true">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Session
      </Button>
    </div>

    <!-- Session Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Card
        v-for="session in sessions"
        :key="session.id"
        hoverable
        class="relative group"
      >
        <div class="absolute top-4 right-4">
          <Badge
            :variant="session.status === 'running' ? 'success' : 'default'"
            size="sm"
            dot
          >
            {{ session.status }}
          </Badge>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-lg bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white truncate">Session #{{ session.id }}</h3>
            <p class="text-sm text-dark-4 mt-0.5">{{ getMachineName(session.machine_id ?? '') }}</p>
            
            <div class="flex items-center gap-4 mt-3 text-xs text-dark-4">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatDuration(session) }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                {{ session.command_count }} commands
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-dark-4">
          <Button
            v-if="session.status === 'running'"
            variant="primary"
            size="sm"
            class="flex-1"
            @click="openSession(session)"
          >
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="viewDetails(session)"
          >
            Details
          </Button>
          <Button
            v-if="session.status === 'running'"
            variant="ghost"
            size="sm"
            class="text-red-400 hover:text-red-300"
            @click="endSession(session)"
          >
            End
          </Button>
        </div>
      </Card>
    </div>

    <!-- Empty State -->
    <Card v-if="sessions.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-dark-4 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="text-lg font-medium text-white mb-1">No Active Sessions</h3>
      <p class="text-dark-4 mb-4">Start a new session to begin using Claude Code remotely</p>
      <Button @click="showNewSessionModal = true">
        Start New Session
      </Button>
    </Card>

    <!-- New Session Modal -->
    <Modal
      v-model="showNewSessionModal"
      title="Start New Session"
    >
      <div class="space-y-4">
        <Select
          v-model="newSession.machine_id"
          label="Select Machine"
          :options="machineOptions"
          placeholder="Choose a machine..."
        />
        <div class="p-4 bg-dark-3 rounded-lg">
          <p class="text-sm text-dark-4">
            This will start a new Claude Code session on the selected machine.
            Make sure the machine is online and has the ClaudeNest agent running.
          </p>
        </div>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showNewSessionModal = false">
            Cancel
          </Button>
          <Button
            :disabled="!newSession.machine_id"
            :loading="isStarting"
            @click="startSession"
          >
            Start Session
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Select from '@/components/common/Select.vue';
import Modal from '@/components/common/Modal.vue';
import type { Session, Machine } from '@/types';

const toast = useToast();

const showNewSessionModal = ref(false);
const isStarting = ref(false);

const machines = ref<Partial<Machine>[]>([
  { id: 'm1', name: 'MacBook Pro', display_name: 'MacBook Pro', status: 'online', platform: 'darwin', hostname: 'macbook.local', last_seen_at: new Date().toISOString() },
  { id: 'm2', name: 'Ubuntu Server', display_name: 'Ubuntu Server', status: 'online', platform: 'linux', hostname: 'ubuntu.local', last_seen_at: new Date().toISOString() },
  { id: 'm3', name: 'Windows PC', display_name: 'Windows PC', status: 'offline', platform: 'win32', hostname: 'windows.local', last_seen_at: new Date().toISOString() },
]);

// Mock sessions for demo — using Partial to avoid requiring all Session fields
const sessions = ref<Partial<Session>[]>([
  {
    id: 's1',
    machine_id: 'm1',
    status: 'running',
    started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    command_count: 24,
  },
  {
    id: 's2',
    machine_id: 'm2',
    status: 'running',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    command_count: 156,
  },
  {
    id: 's3',
    machine_id: 'm1',
    status: 'terminated',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    command_count: 42,
  },
]);

const newSession = ref({
  machine_id: '',
});

const machineOptions = computed(() =>
  machines.value
    .filter(m => m.status === 'online')
    .map(m => ({ value: m.id ?? '', label: m.name ?? '' }))
);

const getMachineName = (machineId: string) => {
  return machines.value.find(m => m.id === machineId)?.name || 'Unknown Machine';
};

const formatDuration = (session: Partial<Session>) => {
  const start = new Date(session.started_at ?? '');
  const end = session.ended_at ? new Date(session.ended_at) : new Date();
  const diff = end.getTime() - start.getTime();
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const openSession = (session: Partial<Session>) => {
  toast.success('Opening Session', `Connecting to session #${session.id}...`);
};

const viewDetails = (session: Partial<Session>) => {
  toast.info('Session Details', `Viewing details for session #${session.id}`);
};

const endSession = (session: Partial<Session>) => {
  if (confirm('Are you sure you want to end this session?')) {
    session.status = 'terminated';
    session.ended_at = new Date().toISOString();
    toast.success('Session Ended', `Session #${session.id} has been ended`);
  }
};

const startSession = () => {
  isStarting.value = true;

  setTimeout(() => {
    const session: Partial<Session> = {
      id: `s${Date.now()}`,
      machine_id: newSession.value.machine_id,
      status: 'running',
      started_at: new Date().toISOString(),
      command_count: 0,
    };
    
    sessions.value.unshift(session);
    showNewSessionModal.value = false;
    newSession.value.machine_id = '';
    toast.success('Session Started', 'New session has been started successfully');
    isStarting.value = false;
  }, 1000);
};
</script>
