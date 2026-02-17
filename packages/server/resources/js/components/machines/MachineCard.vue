<template>
  <div 
    class="machine-card"
    :class="{ 
      'machine-online': machine.status === 'online',
      'machine-offline': machine.status === 'offline',
      'machine-connecting': machine.status === 'connecting',
    }"
  >
    <div class="machine-header">
      <div class="machine-status-platform">
        <StatusDot :status="machine.status" />
        <PlatformIcon :platform="machine.platform" />
      </div>
      
      <div class="machine-actions">
        <button 
          v-if="machine.status === 'offline' && machineHasWakeOnLan"
          class="action-btn wake-btn"
          @click="$emit('wake', machine.id)"
          title="Wake on LAN"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
          </svg>
        </button>
        <button 
          class="action-btn connect-btn"
          :disabled="machine.status !== 'online'"
          @click="$emit('connect', machine)"
          title="Connect"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
        <button 
          class="action-btn edit-btn"
          @click="$emit('edit', machine)"
          title="Edit"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
        <button 
          class="action-btn delete-btn"
          @click="$emit('delete', machine)"
          title="Delete"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="machine-info" @click="$emit('click', machine)">
      <h3 class="machine-name">{{ machine.display_name }}</h3>
      <p v-if="machine.hostname" class="machine-hostname">{{ machine.hostname }}</p>
      
      <div class="machine-meta">
        <span class="meta-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
          </svg>
          {{ machine.last_seen_human || 'Never' }}
        </span>
        <span class="meta-item sessions" :class="{ 'sessions-active': machine.active_sessions_count > 0 }">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          {{ machine.active_sessions_count }} active
        </span>
      </div>
      
      <div v-if="machine.arch" class="machine-tags">
        <span class="tag">{{ machine.arch }}</span>
        <span v-if="machine.agent_version" class="tag">v{{ machine.agent_version }}</span>
      </div>
    </div>
    
    <div 
      v-if="!machine.can_accept_more_sessions && machine.status === 'online'" 
      class="machine-warning"
    >
      Max sessions reached
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatusDot from './StatusDot.vue';
import PlatformIcon from './PlatformIcon.vue';
import type { Machine } from '@/types';

interface Props {
  machine: Machine;
}

const props = defineProps<Props>();

defineEmits<{
  click: [machine: Machine];
  connect: [machine: Machine];
  edit: [machine: Machine];
  delete: [machine: Machine];
  wake: [id: string];
}>();

const machineHasWakeOnLan = computed(() => 
  props.machine.capabilities?.includes('wake_on_lan')
);
</script>

<style scoped>
.machine-card {
  @apply relative bg-dark-2 border border-dark-4 rounded-xl p-4 transition-all duration-200;
}

.machine-card:hover {
  @apply border-brand-purple/50;
  box-shadow: 0 0 20px color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.machine-online {
  @apply border-l-4 border-l-green-500;
}

.machine-offline {
  @apply border-l-4 border-l-red-500 opacity-75;
}

.machine-connecting {
  @apply border-l-4 border-l-amber-400;
}

.machine-header {
  @apply flex items-center justify-between mb-3;
}

.machine-status-platform {
  @apply flex items-center gap-2;
}

.machine-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1.5 rounded-lg transition-colors duration-150;
  @apply text-gray-400 hover:text-white hover:bg-dark-3;
}

.action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.action-btn svg {
  @apply w-4 h-4;
}

.wake-btn:hover {
  @apply text-amber-400 bg-amber-400/10;
}

.connect-btn:hover:not(:disabled) {
  @apply text-green-400 bg-green-400/10;
}

.edit-btn:hover {
  @apply text-brand-cyan bg-brand-cyan/10;
}

.delete-btn:hover {
  @apply text-red-400 bg-red-400/10;
}

.machine-info {
  @apply cursor-pointer;
}

.machine-name {
  @apply text-lg font-semibold text-white mb-1 truncate;
}

.machine-hostname {
  @apply text-sm text-gray-400 mb-3;
}

.machine-meta {
  @apply flex items-center gap-4 mb-3;
}

.meta-item {
  @apply flex items-center gap-1.5 text-xs text-gray-500;
}

.meta-item svg {
  @apply w-4 h-4;
}

.sessions-active {
  @apply text-green-400;
}

.machine-tags {
  @apply flex items-center gap-2 flex-wrap;
}

.tag {
  @apply px-2 py-0.5 text-xs rounded-full bg-dark-3 text-gray-400;
}

.machine-warning {
  @apply mt-3 px-3 py-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg border border-amber-400/20;
}
</style>
