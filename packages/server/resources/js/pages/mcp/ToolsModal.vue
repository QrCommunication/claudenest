<template>
  <Modal :model-value="show" @close="$emit('close')" size="lg">
    <template #title>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center">
          <WrenchIcon class="w-5 h-5 text-brand-purple" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-skin-primary">{{ server?.display_name }}</h2>
          <p class="text-sm text-skin-secondary">
            {{ filteredTools.length }} tools available
          </p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Search -->
      <div class="flex gap-3">
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search tools..."
          class="flex-1"
        >
          <template #left-icon>
            <SearchIcon class="w-4 h-4 text-skin-secondary" />
          </template>
        </Input>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton v-for="i in 4" :key="i" class="h-32" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTools.length === 0" class="text-center py-12">
        <WrenchIcon class="w-12 h-12 text-skin-secondary mx-auto mb-4" />
        <h3 class="text-lg font-medium text-skin-primary mb-2">No tools found</h3>
        <p class="text-skin-secondary">
          {{ searchQuery ? 'Try adjusting your search' : 'This server has no tools configured' }}
        </p>
      </div>

      <!-- Tools Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
        <MCPToolCard
          v-for="tool in filteredTools"
          :key="tool.name"
          :tool="tool"
          @test="openTester"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <Button variant="ghost" size="sm" @click="refreshTools" :loading="isLoading">
          <RefreshCwIcon class="w-4 h-4" />
          Refresh
        </Button>
        <Button variant="ghost" @click="$emit('close')">
          Close
        </Button>
      </div>
    </template>
  </Modal>

  <!-- Tool Tester Modal -->
  <ToolTester
    :show="showTester"
    :tool="selectedTool"
    :is-executing="isExecuting"
    :result="executionResult"
    :error="executionError"
    @close="closeTester"
    @execute="executeTool"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMCPStore } from '@/stores/mcp';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import Modal from '@/components/common/Modal.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import MCPToolCard from '@/components/skills/MCPToolCard.vue';
import ToolTester from '@/components/mcp/ToolTester.vue';
import {
  WrenchIcon,
  SearchIcon,
  RefreshCwIcon,
} from 'lucide-vue-next';
import type { MCPServer, MCPTool } from '@/types';

interface Props {
  show: boolean;
  server: MCPServer | null;
  isLoading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  refresh: [server: MCPServer];
}>();

const mcpStore = useMCPStore();
const machinesStore = useMachinesStore();
const { success: toastSuccess, error: toastError } = useToast();

const searchQuery = ref('');
const showTester = ref(false);
const selectedTool = ref<MCPTool | null>(null);
const isExecuting = ref(false);
const executionResult = ref<unknown>(null);
const executionError = ref<string | null>(null);

const currentMachineId = computed(() => machinesStore.selectedMachine?.id);

const filteredTools = computed(() => {
  if (!props.server?.tools) return [];
  
  let tools = props.server.tools;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    tools = tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      (tool.description && tool.description.toLowerCase().includes(query))
    );
  }
  
  return tools;
});

watch(() => props.show, (newVal) => {
  if (newVal && props.server) {
    searchQuery.value = '';
  }
});

function refreshTools(): void {
  if (props.server) {
    emit('refresh', props.server);
  }
}

function openTester(tool: MCPTool): void {
  selectedTool.value = tool;
  executionResult.value = null;
  executionError.value = null;
  showTester.value = true;
}

function closeTester(): void {
  showTester.value = false;
  selectedTool.value = null;
  executionResult.value = null;
  executionError.value = null;
}

async function executeTool(params: Record<string, unknown>): Promise<void> {
  if (!currentMachineId.value || !props.server || !selectedTool.value) return;
  
  isExecuting.value = true;
  executionResult.value = null;
  executionError.value = null;
  
  try {
    const result = await mcpStore.executeTool(
      currentMachineId.value,
      props.server.name,
      {
        tool: selectedTool.value.name,
        params,
      }
    );
    executionResult.value = result;
    toastSuccess('Tool executed successfully');
  } catch (err) {
    executionError.value = err instanceof Error ? err.message : 'Failed to execute tool';
    toastError('Failed to execute tool');
  } finally {
    isExecuting.value = false;
  }
}
</script>
