<template>
  <div class="machine-selector">
    <div class="selector-row">
      <label class="selector-label">
        <svg viewBox="0 0 24 24" fill="currentColor" class="label-icon">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
        Machine
      </label>
      <select
        :value="machinesStore.selectedMachine?.id ?? ''"
        class="selector-select"
        @change="handleChange"
      >
        <option value="" disabled>Select a machine...</option>
        <option
          v-for="machine in machines"
          :key="machine.id"
          :value="machine.id"
        >
          {{ machine.display_name || machine.name }}
          <template v-if="machine.status === 'online'"> (online)</template>
          <template v-else-if="machine.status === 'offline'"> (offline)</template>
        </option>
      </select>
    </div>

    <div v-if="machines.length === 0 && !isLoading" class="empty-state">
      <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
      </svg>
      <p>No machines registered. <router-link to="/machines" class="link">Add a machine</router-link> first.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useMachinesStore } from '@/stores/machines';
import { storeToRefs } from 'pinia';

const machinesStore = useMachinesStore();
const { machines, isLoading } = storeToRefs(machinesStore);

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const machine = machines.value.find(m => m.id === target.value) ?? null;
  machinesStore.selectMachine(machine);
}

onMounted(async () => {
  if (machines.value.length === 0) {
    await machinesStore.fetchMachines(1, 100);
  }
  autoSelectFirst();
});

watch(machines, () => {
  autoSelectFirst();
});

function autoSelectFirst(): void {
  if (!machinesStore.selectedMachine && machines.value.length > 0) {
    machinesStore.selectMachine(machines.value[0]);
  }
}
</script>

<style scoped>
.machine-selector {
  flex-shrink: 0;
}

.selector-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.label-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.selector-select {
  padding: 6px 28px 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: border-color 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  min-width: 180px;
}

.selector-select:focus {
  outline: none;
  border-color: var(--accent-purple);
}

.selector-select:hover {
  border-color: var(--text-muted);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-top: 8px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
  background-color: color-mix(in srgb, var(--accent-purple) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple) 15%, transparent);
}

.empty-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--text-muted);
}

.link {
  color: var(--accent-purple);
  text-decoration: underline;
}
</style>
