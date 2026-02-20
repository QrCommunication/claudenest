<template>
  <div class="step-machine">
    <h2 class="step-title">Select a Machine</h2>
    <p class="step-desc">Choose the machine where this project is located.</p>

    <div class="machines-grid" v-if="machines.length > 0">
      <div
        v-for="machine in machines"
        :key="machine.id"
        class="machine-card"
        :class="{ 'machine-selected': state.machineId === machine.id }"
        @click="selectMachine(machine.id)"
      >
        <div class="machine-status">
          <span
            class="status-dot"
            :class="machine.status === 'online' ? 'dot-online' : 'dot-offline'"
          ></span>
          <span class="machine-name">{{ machine.display_name || machine.name }}</span>
        </div>
        <div class="machine-meta">
          <span class="meta-item">{{ machine.platform }}</span>
          <span class="meta-item" v-if="machine.hostname">{{ machine.hostname }}</span>
        </div>
        <div class="machine-sessions" v-if="machine.active_sessions_count > 0">
          {{ machine.active_sessions_count }} active session(s)
        </div>
      </div>
    </div>

    <div class="empty-state" v-else-if="!isLoading">
      <p>No machines registered.</p>
      <router-link to="/machines" class="link">Add a machine first</router-link>
    </div>

    <div class="loading-state" v-if="isLoading">
      <div class="spinner"></div>
      <span>Loading machines...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useMachinesStore } from '@/stores/machines';
import { storeToRefs } from 'pinia';
import type { WizardState } from '@/composables/useProjectWizard';

interface Props {
  state: WizardState;
}

const props = defineProps<Props>();
const machinesStore = useMachinesStore();
const { machines, isLoading } = storeToRefs(machinesStore);

function selectMachine(machineId: string): void {
  props.state.machineId = machineId;
}

onMounted(async () => {
  if (machines.value.length === 0) {
    await machinesStore.fetchMachines(1, 100);
  }
});
</script>

<style scoped>
.step-machine {
  @apply space-y-4;
}

.step-title {
  @apply text-lg font-semibold text-white;
}

.step-desc {
  @apply text-sm text-gray-400;
}

.machines-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3;
}

.machine-card {
  @apply p-4 rounded-xl border border-dark-4 bg-dark-2 cursor-pointer transition-all duration-200 space-y-2;
}

.machine-card:hover {
  @apply border-gray-500;
}

.machine-selected {
  @apply border-brand-purple bg-brand-purple/5 ring-1 ring-brand-purple/30;
}

.machine-status {
  @apply flex items-center gap-2;
}

.status-dot {
  @apply w-2.5 h-2.5 rounded-full flex-shrink-0;
}

.dot-online {
  @apply bg-green-500;
}

.dot-offline {
  @apply bg-gray-500;
}

.machine-name {
  @apply text-sm font-medium text-white;
}

.machine-meta {
  @apply flex items-center gap-2 text-xs text-gray-500;
}

.meta-item {
  @apply bg-dark-3 px-2 py-0.5 rounded;
}

.machine-sessions {
  @apply text-xs text-gray-400;
}

.empty-state {
  @apply text-center py-8 text-gray-500 space-y-2;
}

.link {
  @apply text-brand-purple underline;
}

.loading-state {
  @apply flex items-center justify-center gap-2 py-8 text-gray-400;
}

.spinner {
  @apply w-5 h-5 border-2 border-gray-600 border-t-brand-purple rounded-full animate-spin;
}
</style>
