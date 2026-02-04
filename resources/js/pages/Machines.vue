<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Machines</h1>
        <p class="text-dark-4 mt-1">Manage your connected machines and devices</p>
      </div>
      <Button @click="showAddModal = true">
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <p class="text-2xl font-bold text-white">{{ machines.length }}</p>
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
            <p class="text-2xl font-bold text-green-400">{{ onlineCount }}</p>
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
            <p class="text-2xl font-bold text-red-400">{{ offlineCount }}</p>
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
      />
    </div>

    <!-- Machines List -->
    <Card>
      <Table
        :data="filteredMachines"
        :columns="columns"
        :is-loading="isLoading"
      >
        <template #row="{ row }">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                :class="platformBg(row.platform)"
              >
                <component
                  :is="platformIcon(row.platform)"
                  class="w-5 h-5"
                  :class="platformColor(row.platform)"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ row.name }}</p>
                <p class="text-xs text-dark-4">{{ row.id }}</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-dark-4">
            {{ row.hostname }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-dark-4 capitalize">
            {{ row.platform }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <Badge
              :variant="row.status === 'online' ? 'success' : 'error'"
              size="sm"
              dot
            >
              {{ row.status }}
            </Badge>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-dark-4">
            {{ formatTime(row.last_seen_at) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                @click="connect(row)"
              >
                Connect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="editMachine(row)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="deleteMachine(row)"
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

    <!-- Add Machine Modal -->
    <Modal v-model="showAddModal" title="Add New Machine">
      <div class="space-y-4">
        <Input
          v-model="newMachine.name"
          label="Machine Name"
          placeholder="e.g., MacBook Pro"
          required
        />
        <Input
          v-model="newMachine.hostname"
          label="Hostname"
          placeholder="e.g., macbook.local"
          required
        />
        <Select
          v-model="newMachine.platform"
          label="Platform"
          :options="[
            { value: 'darwin', label: 'macOS' },
            { value: 'linux', label: 'Linux' },
            { value: 'win32', label: 'Windows' },
          ]"
          required
        />
        <div class="flex justify-end gap-3 pt-4">
          <Button variant="secondary" @click="showAddModal = false">
            Cancel
          </Button>
          <Button :loading="isSaving" @click="saveMachine">
            Add Machine
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
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

const isLoading = ref(false);
const isSaving = ref(false);
const showAddModal = ref(false);
const searchQuery = ref('');
const statusFilter = ref('all');

const machines = ref<Machine[]>([
  {
    id: 'm1',
    name: 'MacBook Pro',
    status: 'online',
    platform: 'darwin',
    hostname: 'macbook-pro.local',
    last_seen_at: new Date().toISOString(),
  },
  {
    id: 'm2',
    name: 'Ubuntu Server',
    status: 'online',
    platform: 'linux',
    hostname: 'ubuntu-server.local',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'm3',
    name: 'Windows PC',
    status: 'offline',
    platform: 'win32',
    hostname: 'windows-pc.local',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'm4',
    name: 'Raspberry Pi',
    status: 'online',
    platform: 'linux',
    hostname: 'raspberrypi.local',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
]);

const newMachine = ref({
  name: '',
  hostname: '',
  platform: 'linux',
});

const columns: TableColumn<Machine>[] = [
  { key: 'name', label: 'Machine', sortable: true },
  { key: 'hostname', label: 'Hostname', sortable: true },
  { key: 'platform', label: 'Platform', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'last_seen_at', label: 'Last Seen', sortable: true },
  { key: 'actions', label: '', sortable: false },
];

const filteredMachines = computed(() => {
  let result = machines.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.hostname.toLowerCase().includes(query)
    );
  }
  
  if (statusFilter.value !== 'all') {
    result = result.filter(m => m.status === statusFilter.value);
  }
  
  return result;
});

const onlineCount = computed(() => machines.value.filter(m => m.status === 'online').length);
const offlineCount = computed(() => machines.value.filter(m => m.status === 'offline').length);

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

const formatTime = (timestamp: string) => {
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

const connect = (machine: Machine) => {
  toast.success('Connecting', `Connecting to ${machine.name}...`);
  router.push('/sessions');
};

const editMachine = (machine: Machine) => {
  toast.info('Edit Machine', `Editing ${machine.name} - coming soon`);
};

const deleteMachine = (machine: Machine) => {
  if (confirm(`Are you sure you want to remove ${machine.name}?`)) {
    machines.value = machines.value.filter(m => m.id !== machine.id);
    toast.success('Machine Removed', `${machine.name} has been removed`);
  }
};

const saveMachine = () => {
  if (!newMachine.value.name || !newMachine.value.hostname) {
    toast.error('Validation Error', 'Please fill in all required fields');
    return;
  }
  
  isSaving.value = true;
  
  setTimeout(() => {
    const machine: Machine = {
      id: `m${Date.now()}`,
      name: newMachine.value.name,
      status: 'offline',
      platform: newMachine.value.platform,
      hostname: newMachine.value.hostname,
      last_seen_at: new Date().toISOString(),
    };
    
    machines.value.push(machine);
    showAddModal.value = false;
    newMachine.value = { name: '', hostname: '', platform: 'linux' };
    toast.success('Machine Added', 'New machine has been added successfully');
    isSaving.value = false;
  }, 500);
};
</script>
