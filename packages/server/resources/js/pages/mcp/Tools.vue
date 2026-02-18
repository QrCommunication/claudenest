<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">MCP Tools</h1>
        <p class="text-dark-4 mt-1">Browse and test tools from all MCP servers</p>
      </div>
      <div class="flex items-center gap-3">
        <Badge variant="info" size="md">
          {{ mcpStore.allTools.length }} tools
        </Badge>
        <Button 
          variant="primary" 
          @click="refreshTools"
          :loading="mcpStore.isLoadingTools"
        >
          <RefreshCwIcon class="w-4 h-4" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <Input
        v-model="searchQuery"
        type="text"
        placeholder="Search tools..."
        class="w-full max-w-md"
      >
        <template #left-icon>
          <SearchIcon class="w-4 h-4 text-dark-4" />
        </template>
      </Input>
    </div>

    <!-- Server Filter -->
    <div v-if="mcpStore.servers.length > 1" class="flex flex-wrap gap-2 mb-6">
      <button
        :class="[
          'px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedServer === null
            ? 'bg-brand-purple text-white'
            : 'bg-dark-2 text-dark-4 hover:bg-dark-3'
        ]"
        @click="selectedServer = null"
      >
        All Servers
      </button>
      <button
        v-for="server in mcpStore.servers"
        :key="server.id"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedServer === server.id
            ? 'bg-brand-purple text-white'
            : 'bg-dark-2 text-dark-4 hover:bg-dark-3'
        ]"
        @click="selectedServer = selectedServer === server.id ? null : server.id"
      >
        {{ server.display_name }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="mcpStore.isLoadingTools" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton v-for="i in 6" :key="i" class="h-48" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTools.length === 0" class="text-center py-12">
      <WrenchIcon class="w-12 h-12 text-dark-4 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-white mb-2">No tools found</h3>
      <p class="text-dark-4">
        {{ searchQuery ? 'Try adjusting your search' : 'Start an MCP server to see available tools' }}
      </p>
    </div>

    <!-- Tools Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ToolCard
        v-for="tool in filteredTools"
        :key="`${tool.server.id}-${tool.name}`"
        :tool="tool"
        :server-name="tool.server.display_name"
        @test="openToolTester"
      />
    </div>

    <!-- Tool Tester Modal -->
    <ToolTester
      :show="showTester"
      :tool="selectedTool"
      :is-executing="mcpStore.isExecuting"
      :result="executionResult"
      :error="executionError"
      @close="closeToolTester"
      @execute="executeTool"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMCPStore } from '@/stores/mcp';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import ToolCard from '@/components/mcp/ToolCard.vue';
import ToolTester from '@/components/mcp/ToolTester.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import {
  SearchIcon,
  RefreshCwIcon,
  WrenchIcon,
} from 'lucide-vue-next';
import type { MCPTool, MCPToolWithServer } from '@/types';

const mcpStore = useMCPStore();
const machinesStore = useMachinesStore();
const { success: toastSuccess, error: toastError } = useToast();

const searchQuery = ref('');
const selectedServer = ref<string | null>(null);
const showTester = ref(false);
const selectedTool = ref<MCPTool | MCPToolWithServer | null>(null);
const executionResult = ref<unknown>(undefined);
const executionError = ref<string | null>(null);

const currentMachineId = computed(() => machinesStore.selectedMachine?.id);

const filteredTools = computed(() => {
  let result = mcpStore.allTools;

  if (selectedServer.value) {
    result = result.filter(t => t.server.id === selectedServer.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  }

  return result;
});

onMounted(() => {
  if (currentMachineId.value) {
    loadTools();
  }
});

async function loadTools(): Promise<void> {
  if (!currentMachineId.value) return;
  
  try {
    await Promise.all([
      mcpStore.fetchServers(currentMachineId.value),
      mcpStore.fetchAllTools(currentMachineId.value),
    ]);
  } catch {
    toastError('Failed to load tools');
  }
}

async function refreshTools(): Promise<void> {
  await loadTools();
  toastSuccess('Tools refreshed');
}

function openToolTester(tool: MCPTool | MCPToolWithServer): void {
  selectedTool.value = tool;
  executionResult.value = undefined;
  executionError.value = null;
  showTester.value = true;
}

function closeToolTester(): void {
  showTester.value = false;
  selectedTool.value = null;
  executionResult.value = undefined;
  executionError.value = null;
}

async function executeTool(params: Record<string, unknown>): Promise<void> {
  if (!currentMachineId.value || !selectedTool.value) return;
  
  executionResult.value = undefined;
  executionError.value = null;
  
  try {
    const result = await mcpStore.executeTool(
      currentMachineId.value,
      ('server' in selectedTool.value ? selectedTool.value.server.name : ''),
      {
        tool: selectedTool.value.name,
        params,
      }
    );
    executionResult.value = result;
    toastSuccess('Tool executed successfully');
  } catch (err) {
    executionError.value = 'Failed to execute tool';
    toastError('Failed to execute tool');
  }
}
</script>
