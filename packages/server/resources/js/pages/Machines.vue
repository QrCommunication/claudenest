<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Machines</h1>
        <p class="text-dark-4 mt-1">Manage your connected machines and devices</p>
      </div>
      <Button @click="openPairModal">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Machine
      </Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card hoverable>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-dark-4">Total Machines</p>
            <p class="text-2xl font-bold text-white">{{ store.machines.length }}</p>
          </div>
          <div class="w-10 h-10 bg-brand-purple/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
        </div>
      </Card>
      <Card hoverable>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-dark-4">Online</p>
            <p class="text-2xl font-bold text-green-400">{{ store.onlineMachines.length }}</p>
          </div>
          <div class="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </Card>
      <Card hoverable>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-dark-4">Offline</p>
            <p class="text-2xl font-bold text-red-400">{{ store.offlineMachines.length }}</p>
          </div>
          <div class="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search machines..."
        class="sm:w-64"
        @update:model-value="handleSearchChange"
      >
        <template #left-icon>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </template>
      </Input>
      <Select
        v-model="statusFilter"
        :options="[
          { value: 'all', label: 'All Status' },
          { value: 'online', label: 'Online' },
          { value: 'offline', label: 'Offline' },
        ]"
        class="sm:w-40"
        @update:model-value="handleStatusChange"
      />
    </div>

    <!-- Error Banner -->
    <div
      v-if="store.error"
      class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between"
    >
      <p class="text-sm text-red-400">{{ store.error }}</p>
      <button class="text-red-400 hover:text-red-300 text-sm" @click="store.clearError()">
        Dismiss
      </button>
    </div>

    <!-- Machines List -->
    <Card>
      <Table
        :data="store.filteredMachines"
        :columns="columns"
        :is-loading="store.isLoading"
      >
        <template #row="{ row: rawRow }">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                :class="platformBg((rawRow as Machine).platform)"
              >
                <component
                  :is="platformIcon((rawRow as Machine).platform)"
                  class="w-5 h-5"
                  :class="platformColor((rawRow as Machine).platform)"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ (rawRow as Machine).display_name || (rawRow as Machine).name }}</p>
                <p class="text-xs text-dark-4">{{ (rawRow as Machine).id }}</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-dark-4">
            {{ (rawRow as Machine).hostname || '-' }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-dark-4 capitalize">
            {{ (rawRow as Machine).platform }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <Badge
              :variant="(rawRow as Machine).status === 'online' ? 'success' : 'error'"
              size="sm"
              dot
            >
              {{ (rawRow as Machine).status }}
            </Badge>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-dark-4">
            {{ (rawRow as Machine).last_seen_human || formatTime((rawRow as Machine).last_seen_at) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                :disabled="!(rawRow as Machine).is_online"
                @click="connect(rawRow as Machine)"
              >
                Connect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="openEditModal(rawRow as Machine)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                :loading="store.isDeleting"
                @click="handleDelete(rawRow as Machine)"
              >
                <svg class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </td>
        </template>
      </Table>
    </Card>

    <!-- Pair Machine Modal -->
    <Modal v-model="showPairModal" title="Pair a Machine">
      <div class="space-y-4">
        <div class="bg-dark-3/50 rounded-lg p-4 border border-dark-4">
          <p class="text-sm text-dark-4 leading-relaxed">
            Run <code class="bg-dark-1 text-brand-cyan px-1.5 py-0.5 rounded text-xs font-mono">claudenest-agent pair</code>
            on your machine to get a pairing code, then enter it below.
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-white mb-1.5">Pairing Code</label>
          <input
            v-model="pairingCodeDisplay"
            type="text"
            class="w-full bg-dark-1 border border-dark-4 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-white placeholder-dark-4 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple uppercase"
            placeholder="XXX-XXX"
            maxlength="7"
            autocomplete="off"
            @input="handlePairingCodeInput"
            @keydown.enter="completePairing"
          />
        </div>
        <Input
          v-model="pairingMachineName"
          label="Machine Name (optional)"
          placeholder="e.g., MacBook Pro"
        />
        <p v-if="pairingError" class="text-sm text-red-400">{{ pairingError }}</p>
        <div class="flex justify-end gap-3 pt-4">
          <Button variant="secondary" @click="closePairModal">
            Cancel
          </Button>
          <Button
            :loading="isPairing"
            :disabled="normalizedPairingCode.length !== 6"
            @click="completePairing"
          >
            Complete Pairing
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Edit Machine Modal -->
    <Modal v-model="showEditModal" title="Edit Machine">
      <div class="space-y-4">
        <Input
          v-model="editForm.name"
          label="Machine Name"
          placeholder="e.g., MacBook Pro"
          required
        />
        <p v-if="editError" class="text-sm text-red-400">{{ editError }}</p>
        <div class="flex justify-end gap-3 pt-4">
          <Button variant="secondary" @click="showEditModal = false">
            Cancel
          </Button>
          <Button :loading="store.isUpdating" @click="saveEdit">
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" title="Delete Machine" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-dark-4">
          Are you sure you want to remove
          <span class="text-white font-medium">{{ machineToDelete?.display_name || machineToDelete?.name }}</span>?
          This action cannot be undone.
        </p>
        <div class="flex justify-end gap-3 pt-4">
          <Button variant="secondary" @click="showDeleteModal = false">
            Cancel
          </Button>
          <Button
            variant="primary"
            class="!bg-red-500 hover:!bg-red-600"
            :loading="store.isDeleting"
            @click="confirmDelete"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useMachinesStore } from '@/stores/machines';
import api, { getErrorMessage } from '@/utils/api';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import Badge from '@/components/common/Badge.vue';
import Table from '@/components/common/Table.vue';
import Modal from '@/components/common/Modal.vue';
import type { Machine, TableColumn } from '@/types';
import {
  ComputerDesktopIcon,
  ServerIcon,
  DeviceTabletIcon,
} from '@heroicons/vue/24/outline';

const router = useRouter();
const toast = useToast();
const store = useMachinesStore();

// ==================== FILTER STATE ====================

const searchQuery = ref(store.filters.search);
const statusFilter = ref(store.filters.status);

// ==================== PAIR MODAL STATE ====================

const showPairModal = ref(false);
const pairingCodeDisplay = ref('');
const pairingMachineName = ref('');
const isPairing = ref(false);
const pairingError = ref('');

const normalizedPairingCode = computed(() =>
  pairingCodeDisplay.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
);

// ==================== EDIT MODAL STATE ====================

const showEditModal = ref(false);
const editError = ref('');
const editingMachine = ref<Machine | null>(null);
const editForm = ref({ name: '' });

// ==================== DELETE MODAL STATE ====================

const showDeleteModal = ref(false);
const machineToDelete = ref<Machine | null>(null);

// ==================== TABLE COLUMNS ====================

const columns: TableColumn[] = [
  { key: 'name', label: 'Machine', sortable: true },
  { key: 'hostname', label: 'Hostname', sortable: true },
  { key: 'platform', label: 'Platform', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'last_seen_at', label: 'Last Seen', sortable: true },
  { key: 'actions', label: '', sortable: false },
];

// ==================== LIFECYCLE ====================

onMounted(async () => {
  try {
    await store.fetchMachines();
  } catch {
    toast.error('Load Failed', 'Could not fetch machines. Please try again.');
  }
});

// ==================== FILTER HANDLERS ====================

function handleSearchChange(value: string | number) {
  store.setFilters({ search: String(value) });
}

function handleStatusChange(value: string | number) {
  store.setFilters({ status: String(value) } as Parameters<typeof store.setFilters>[0]);
}

// Keep local refs in sync if store filters change externally
watch(() => store.filters.search, (val) => { searchQuery.value = val; });
watch(() => store.filters.status, (val) => { statusFilter.value = val; });

// ==================== PLATFORM HELPERS ====================

const platformIcon = (platform: string) => {
  const icons: Record<string, typeof ComputerDesktopIcon> = {
    darwin: ComputerDesktopIcon,
    linux: ServerIcon,
    win32: DeviceTabletIcon,
  };
  return icons[platform] || ComputerDesktopIcon;
};

const platformBg = (platform: string) => {
  const bgs: Record<string, string> = {
    darwin: 'bg-brand-purple/10',
    linux: 'bg-brand-cyan/10',
    win32: 'bg-brand-indigo/10',
  };
  return bgs[platform] || 'bg-dark-3';
};

const platformColor = (platform: string) => {
  const colors: Record<string, string> = {
    darwin: 'text-brand-purple',
    linux: 'text-brand-cyan',
    win32: 'text-brand-indigo',
  };
  return colors[platform] || 'text-dark-4';
};

const formatTime = (timestamp: string | null) => {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ==================== PAIRING CODE HELPERS ====================

function formatPairingCode(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
  if (clean.length > 3) {
    return clean.slice(0, 3) + '-' + clean.slice(3);
  }
  return clean;
}

function handlePairingCodeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const cursorPos = input.selectionStart ?? 0;
  const rawBefore = pairingCodeDisplay.value;
  const rawValue = input.value;

  pairingCodeDisplay.value = formatPairingCode(rawValue);

  // Adjust cursor position after formatting
  const newLength = pairingCodeDisplay.value.length;
  const oldLength = rawBefore.length;
  const adjustedPos = cursorPos + (newLength - rawValue.length);

  requestAnimationFrame(() => {
    input.setSelectionRange(
      Math.min(adjustedPos, newLength),
      Math.min(adjustedPos, newLength)
    );
  });
}

// ==================== PAIR MODAL ACTIONS ====================

function openPairModal() {
  pairingCodeDisplay.value = '';
  pairingMachineName.value = '';
  pairingError.value = '';
  isPairing.value = false;
  showPairModal.value = true;
}

function closePairModal() {
  showPairModal.value = false;
}

async function completePairing() {
  const code = normalizedPairingCode.value;

  if (code.length !== 6) {
    pairingError.value = 'Please enter a valid 6-character pairing code.';
    return;
  }

  isPairing.value = true;
  pairingError.value = '';

  // Format code as XXX-XXX for the API URL
  const formattedCode = code.slice(0, 3) + '-' + code.slice(3);

  try {
    const payload: Record<string, string> = {};
    if (pairingMachineName.value.trim()) {
      payload.name = pairingMachineName.value.trim();
    }

    await api.post(`/pairing/${formattedCode}/complete`, payload);

    // Refetch machines to get the newly paired machine
    await store.fetchMachines();

    showPairModal.value = false;
    toast.success('Machine Paired', 'The machine has been successfully paired to your account.');
  } catch (err: unknown) {
    pairingError.value = getErrorMessage(err);
  } finally {
    isPairing.value = false;
  }
}

// ==================== EDIT ACTIONS ====================

function openEditModal(machine: Machine) {
  editingMachine.value = machine;
  editForm.value.name = machine.display_name || machine.name;
  editError.value = '';
  showEditModal.value = true;
}

async function saveEdit() {
  if (!editingMachine.value) return;

  const name = editForm.value.name.trim();
  if (!name) {
    editError.value = 'Machine name is required.';
    return;
  }

  editError.value = '';

  try {
    await store.updateMachine(editingMachine.value.id, { name });
    showEditModal.value = false;
    toast.success('Machine Updated', `${name} has been updated successfully.`);
  } catch (err: unknown) {
    editError.value = getErrorMessage(err);
  }
}

// ==================== DELETE ACTIONS ====================

function handleDelete(machine: Machine) {
  machineToDelete.value = machine;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!machineToDelete.value) return;

  const machineName = machineToDelete.value.display_name || machineToDelete.value.name;

  try {
    await store.deleteMachine(machineToDelete.value.id);
    showDeleteModal.value = false;
    toast.success('Machine Removed', `${machineName} has been removed.`);
  } catch (err: unknown) {
    toast.error('Delete Failed', getErrorMessage(err));
  }
}

// ==================== CONNECT ACTION ====================

function connect(machine: Machine) {
  router.push(`/sessions/new?machine=${machine.id}`);
}
</script>
