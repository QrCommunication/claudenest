<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-skin-primary">{{ t('mcpIndex.title') }}</h1>
        <p class="text-skin-secondary mt-1">{{ t('mcpIndex.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <MachineSelector />
        <Badge v-if="mcpStore.stats" variant="info" size="md">
          {{ mcpStore.stats.running }}/{{ mcpStore.stats.total }} {{ t('mcpIndex.running') }}
        </Badge>
        <Button
          variant="ghost"
          @click="refreshServers"
          :loading="mcpStore.isLoading"
        >
          <RefreshCwIcon class="w-4 h-4" />
          {{ t('mcpIndex.refresh') }}
        </Button>
        <Button variant="primary" @click="showAddModal = true">
          <PlusIcon class="w-4 h-4" />
          {{ t('mcpIndex.addServer') }}
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="mcpStore.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card class-name="text-center">
        <p class="text-2xl font-bold text-skin-primary">{{ mcpStore.stats.total }}</p>
        <p class="text-sm text-skin-secondary">{{ t('mcpIndex.totalServers') }}</p>
      </Card>
      <Card class-name="text-center">
        <p class="text-2xl font-bold text-green-400">{{ mcpStore.stats.running }}</p>
        <p class="text-sm text-skin-secondary">{{ t('mcpIndex.runningLabel') }}</p>
      </Card>
      <Card class-name="text-center">
        <p class="text-2xl font-bold text-skin-secondary">{{ mcpStore.stats.stopped }}</p>
        <p class="text-sm text-skin-secondary">{{ t('mcpIndex.stopped') }}</p>
      </Card>
      <Card class-name="text-center">
        <p class="text-2xl font-bold text-brand-purple">{{ mcpStore.stats.total_tools }}</p>
        <p class="text-sm text-skin-secondary">{{ t('mcpIndex.totalTools') }}</p>
      </Card>
    </div>

    <!-- Filter by Transport -->
    <div v-if="mcpStore.transports.length > 0" class="flex flex-wrap gap-2 mb-6">
      <button
        :class="[
          'px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedTransport === null
            ? 'bg-brand-purple text-white'
            : 'bg-surface-2 text-skin-secondary hover:bg-surface-3'
        ]"
        @click="selectedTransport = null"
      >
        {{ t('mcpIndex.allTransports') }}
      </button>
      <button
        v-for="transport in mcpStore.transports"
        :key="transport"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedTransport === transport
            ? 'bg-brand-purple text-white'
            : 'bg-surface-2 text-skin-secondary hover:bg-surface-3'
        ]"
        @click="selectedTransport = selectedTransport === transport ? null : transport"
      >
        {{ transport }}
      </button>
    </div>

    <!-- Servers Grid -->
    <div v-if="mcpStore.isLoading && mcpStore.servers.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton v-for="i in 6" :key="i" class="h-48" />
    </div>

    <div v-else-if="filteredServers.length === 0" class="text-center py-12">
      <ServerIcon class="w-12 h-12 text-skin-secondary mx-auto mb-4" />
      <h3 class="text-lg font-medium text-skin-primary mb-2">{{ t('mcpIndex.noServers') }}</h3>
      <p class="text-skin-secondary mb-4">{{ t('mcpIndex.noServersHint') }}</p>
      <Button variant="primary" @click="showAddModal = true">
        <PlusIcon class="w-4 h-4" />
        {{ t('mcpIndex.addServer') }}
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ServerCard
        v-for="server in filteredServers"
        :key="server.id"
        :server="server"
        :is-selected="selectedServer?.id === server.id"
        :is-starting="mcpStore.isStarting && mcpStore.selectedServer?.id === server.id"
        :is-stopping="mcpStore.isStopping && mcpStore.selectedServer?.id === server.id"
        @start="startServer"
        @stop="stopServer"
        @restart="restartServer"
        @view="selectServer"
        @view-tools="viewTools"
      />
    </div>

    <!-- Server Details Panel -->
    <div v-if="selectedServer" class="mt-6">
      <Card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-skin-primary">{{ selectedServer.display_name }}</h3>
          <Button variant="ghost" size="sm" @click="selectedServer = null">
            <XIcon class="w-4 h-4" />
          </Button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Configuration -->
          <div>
            <h4 class="text-sm font-medium text-skin-secondary mb-3">{{ t('mcpIndex.configuration') }}</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-skin-secondary">{{ t('mcpIndex.transport') }}</span>
                <Badge variant="default" size="sm">{{ selectedServer.transport }}</Badge>
              </div>
              <div v-if="selectedServer.command" class="flex justify-between">
                <span class="text-skin-secondary">{{ t('mcpIndex.command') }}</span>
                <code class="text-xs bg-surface-1 px-2 py-0.5 rounded font-mono max-w-xs truncate">
                  {{ selectedServer.command }}
                </code>
              </div>
              <div v-if="selectedServer.url" class="flex justify-between">
                <span class="text-skin-secondary">{{ t('mcpIndex.url') }}</span>
                <span class="text-skin-primary">{{ selectedServer.url }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-skin-secondary">{{ t('mcpIndex.status') }}</span>
                <MCPStatusBadge :status="selectedServer.status" />
              </div>
            </div>
          </div>
          
          <!-- Tools Preview -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-medium text-skin-secondary">{{ t('mcpIndex.tools') }} ({{ selectedServer.tools_count }})</h4>
              <Button variant="ghost" size="sm" @click="viewTools(selectedServer)">
                {{ t('mcpIndex.viewAll') }}
              </Button>
            </div>
            <div v-if="selectedServer.tools?.length" class="space-y-2">
              <div
                v-for="tool in selectedServer.tools.slice(0, 3)"
                :key="tool.name"
                class="flex items-center gap-2 p-2 bg-surface-1 rounded"
              >
                <WrenchIcon class="w-4 h-4 text-brand-purple" />
                <span class="text-sm text-skin-primary">{{ tool.name }}</span>
              </div>
              <div v-if="selectedServer.tools.length > 3" class="text-sm text-skin-secondary text-center">
                +{{ selectedServer.tools.length - 3 }} {{ t('mcpIndex.more') }}
              </div>
            </div>
            <div v-else class="text-sm text-skin-secondary">
              {{ t('mcpIndex.noToolsAvailable') }}
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-skin">
          <Button variant="error" @click="deleteServer(selectedServer)">
            <TrashIcon class="w-4 h-4" />
            {{ t('mcpIndex.delete') }}
          </Button>
          <Button 
            v-if="selectedServer.status === 'stopped'"
            variant="success" 
            :loading="mcpStore.isStarting"
            @click="startServer(selectedServer)"
          >
            <PlayIcon class="w-4 h-4" />
            {{ t('mcpIndex.start') }}
          </Button>
          <Button 
            v-else
            variant="error" 
            :loading="mcpStore.isStopping"
            @click="stopServer(selectedServer)"
          >
            <SquareIcon class="w-4 h-4" />
            {{ t('mcpIndex.stop') }}
          </Button>
        </div>
      </Card>
    </div>

    <!-- Add Server Modal -->
    <AddServerModal
      :show="showAddModal"
      :is-submitting="mcpStore.isCreating"
      @close="showAddModal = false"
      @submit="addServer"
    />

    <!-- Tools Modal -->
    <ToolsModal
      :show="showToolsModal"
      :server="selectedServerForTools"
      :is-loading="mcpStore.isLoading"
      @close="showToolsModal = false"
      @refresh="refreshServerTools"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMCPStore } from '@/stores/mcp';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import ServerCard from './ServerCard.vue';
import AddServerModal from './AddServerModal.vue';
import ToolsModal from './ToolsModal.vue';
import MachineSelector from '@/components/common/MachineSelector.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import MCPStatusBadge from '@/components/mcp/MCPStatusBadge.vue';
import {
  PlusIcon,
  ServerIcon,
  RefreshCwIcon,
  XIcon,
  WrenchIcon,
  TrashIcon,
  PlayIcon,
  SquareIcon,
} from 'lucide-vue-next';
import type { MCPServer, CreateMCPServerPayload } from '@/types';

const { t } = useI18n();
const mcpStore = useMCPStore();
const machinesStore = useMachinesStore();
const { success: toastSuccess, error: toastError } = useToast();

const showAddModal = ref(false);
const showToolsModal = ref(false);
const selectedServer = ref<MCPServer | null>(null);
const selectedServerForTools = ref<MCPServer | null>(null);
const selectedTransport = ref<string | null>(null);

const currentMachineId = computed(() => machinesStore.selectedMachine?.id);

const filteredServers = computed(() => {
  let servers = mcpStore.servers;
  
  if (selectedTransport.value) {
    servers = servers.filter(s => s.transport === selectedTransport.value);
  }
  
  return servers;
});

onMounted(() => {
  if (currentMachineId.value) {
    loadServers();
  }
});

watch(currentMachineId, (newId) => {
  if (newId) {
    loadServers();
  }
});

async function loadServers(): Promise<void> {
  if (!currentMachineId.value) return;
  
  try {
    await mcpStore.fetchServers(currentMachineId.value);
  } catch {
    toastError(t('mcpIndex.toastLoadFailed'));
  }
}

async function refreshServers(): Promise<void> {
  await loadServers();
  toastSuccess(t('mcpIndex.toastServersRefreshed'));
}

async function addServer(data: CreateMCPServerPayload): Promise<void> {
  if (!currentMachineId.value) return;

  try {
    await mcpStore.createServer(currentMachineId.value, data);
    toastSuccess(t('mcpIndex.toastServerAdded'));
    showAddModal.value = false;
  } catch {
    toastError(t('mcpIndex.toastAddFailed'));
  }
}

async function startServer(server: MCPServer): Promise<void> {
  if (!currentMachineId.value) return;

  try {
    await mcpStore.startServer(currentMachineId.value, server.name);
    toastSuccess(t('mcpIndex.toastServerStarted', { name: server.display_name }));
  } catch {
    toastError(t('mcpIndex.toastStartFailed'));
  }
}

async function stopServer(server: MCPServer): Promise<void> {
  if (!currentMachineId.value) return;

  try {
    await mcpStore.stopServer(currentMachineId.value, server.name);
    toastSuccess(t('mcpIndex.toastServerStopped', { name: server.display_name }));
  } catch {
    toastError(t('mcpIndex.toastStopFailed'));
  }
}

async function restartServer(server: MCPServer): Promise<void> {
  await stopServer(server);
  await new Promise(resolve => setTimeout(resolve, 500));
  await startServer(server);
}

function selectServer(server: MCPServer): void {
  selectedServer.value = server;
  mcpStore.selectServer(server);
}

function viewTools(server: MCPServer): void {
  selectedServerForTools.value = server;
  showToolsModal.value = true;

  // Load tools for this server
  if (currentMachineId.value) {
    mcpStore.fetchServerTools(currentMachineId.value, server.name);
  }
}

async function refreshServerTools(server: MCPServer): Promise<void> {
  if (!currentMachineId.value) return;

  try {
    await mcpStore.fetchServerTools(currentMachineId.value, server.name);
    toastSuccess(t('mcpIndex.toastToolsRefreshed'));
  } catch {
    toastError(t('mcpIndex.toastToolsRefreshFailed'));
  }
}

async function deleteServer(server: MCPServer): Promise<void> {
  if (!currentMachineId.value) return;

  if (!confirm(t('mcpIndex.confirmDelete', { name: server.display_name }))) {
    return;
  }

  try {
    await mcpStore.deleteServer(currentMachineId.value, server.name);
    selectedServer.value = null;
    toastSuccess(t('mcpIndex.toastServerDeleted'));
  } catch {
    toastError(t('mcpIndex.toastDeleteFailed'));
  }
}
</script>
