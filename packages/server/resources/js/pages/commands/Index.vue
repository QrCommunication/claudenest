<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Commands</h1>
        <p class="text-dark-4 mt-1">Discover and execute available commands</p>
      </div>
      <div class="flex items-center gap-3">
        <MachineSelector />
        <Badge variant="info" size="md">
          {{ commandsStore.pagination.total }} total
        </Badge>
      </div>
    </div>

    <!-- Command Palette -->
    <div class="mb-8">
      <CommandPalette
        v-model="searchQuery"
        :commands="commandsStore.commands"
        @select="selectCommand"
      />
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <Select
        v-model="selectedCategory"
        :options="categoryOptions"
        placeholder="All Categories"
        class="w-full sm:w-48"
      />
      <Select
        v-if="skillOptions.length > 0"
        v-model="selectedSkill"
        :options="skillOptions"
        placeholder="All Skills"
        class="w-full sm:w-48"
      />
    </div>

    <!-- Category Stats -->
    <div v-if="categoryStats.length > 0" class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="stat in categoryStats"
        :key="stat.category"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedCategory === stat.category
            ? 'bg-brand-purple text-white'
            : 'bg-dark-2 text-dark-4 hover:bg-dark-3'
        ]"
        @click="selectedCategory = selectedCategory === stat.category ? '' : stat.category"
      >
        {{ stat.category }}
        <span class="ml-1 opacity-70">({{ stat.count }})</span>
      </button>
    </div>

    <!-- Commands List -->
    <div v-if="commandsStore.isLoading && commandsStore.commands.length === 0" class="space-y-3">
      <Skeleton v-for="i in 5" :key="i" class="h-20" />
    </div>

    <div v-else-if="filteredCommands.length === 0" class="text-center py-12">
      <TerminalIcon class="w-12 h-12 text-dark-4 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-white mb-2">No commands found</h3>
      <p class="text-dark-4">
        {{ searchQuery ? 'Try adjusting your search filters' : 'Commands will appear here once discovered' }}
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="command in paginatedCommands"
        :key="command.id"
        class="bg-dark-2 border border-dark-4 rounded-card p-4 hover:border-brand-purple/30 transition-colors cursor-pointer"
        @click="selectCommand(command)"
      >
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg bg-dark-3 flex items-center justify-center flex-shrink-0">
            <TerminalIcon class="w-5 h-5 text-brand-purple" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <code class="text-white font-mono">{{ command.name }}</code>
              <Badge :variant="categoryVariant(command.category)" size="sm">
                {{ command.category }}
              </Badge>
              <Badge v-if="command.has_aliases" variant="default" size="sm">
                {{ command.aliases.length }} alias{{ command.aliases.length > 1 ? 'es' : '' }}
              </Badge>
            </div>
            <p v-if="command.description" class="text-sm text-dark-4 mt-1">
              {{ command.description }}
            </p>
            <code class="text-xs text-dark-4 mt-2 block font-mono">{{ command.signature }}</code>
            
            <div v-if="command.parameters.length > 0" class="flex flex-wrap gap-2 mt-2">
              <span 
                v-for="param in command.parameters" 
                :key="param.name"
                class="text-xs"
              >
                <code 
                  :class="[
                    'px-1.5 py-0.5 rounded',
                    param.required 
                      ? 'bg-red-500/10 text-red-400' 
                      : 'bg-dark-3 text-dark-4'
                  ]"
                >
                  {{ param.name }}: {{ param.type }}
                </code>
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <ArrowRightIcon class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-8">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </Button>
        <span class="text-sm text-dark-4">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <Button
          variant="ghost"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Command Detail Modal -->
    <Modal v-if="selectedCommand" :model-value="showDetail" @close="showDetail = false">
      <template #title>
        <div class="flex items-center gap-2">
          <TerminalIcon class="w-5 h-5 text-brand-purple" />
          {{ selectedCommand.name }}
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Badge :variant="categoryVariant(selectedCommand.category)" size="sm">
            {{ selectedCommand.category }}
          </Badge>
          <Badge variant="default" size="sm">
            {{ selectedCommand.parameters_count }} params
          </Badge>
        </div>

        <p v-if="selectedCommand.description" class="text-dark-4">
          {{ selectedCommand.description }}
        </p>

        <div class="bg-dark-1 rounded-lg p-3">
          <p class="text-xs text-dark-4 mb-1">Usage</p>
          <code class="text-brand-purple font-mono text-sm">{{ selectedCommand.signature }}</code>
        </div>

        <div v-if="selectedCommand.parameters.length > 0">
          <p class="text-sm font-medium text-white mb-2">Parameters</p>
          <div class="space-y-2">
            <div 
              v-for="param in selectedCommand.parameters" 
              :key="param.name"
              class="bg-dark-1 rounded-lg p-3"
            >
              <div class="flex items-center gap-2">
                <code class="text-white font-mono">{{ param.name }}</code>
                <Badge size="sm" variant="default">{{ param.type }}</Badge>
                <Badge v-if="param.required" size="sm" variant="error">required</Badge>
              </div>
              <p v-if="param.description" class="text-xs text-dark-4 mt-1">
                {{ param.description }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="selectedCommand.aliases.length > 0">
          <p class="text-sm font-medium text-white mb-2">Aliases</p>
          <div class="flex gap-2">
            <code 
              v-for="alias in selectedCommand.aliases" 
              :key="alias"
              class="text-brand-purple bg-brand-purple/10 px-2 py-1 rounded text-sm"
            >
              {{ alias }}
            </code>
          </div>
        </div>

        <div v-if="selectedCommand.examples?.length">
          <p class="text-sm font-medium text-white mb-2">Examples</p>
          <div class="space-y-2">
            <div 
              v-for="(example, index) in selectedCommand.examples" 
              :key="index"
              class="bg-dark-1 rounded-lg p-3"
            >
              <p class="font-medium text-white text-sm">{{ example.title }}</p>
              <p v-if="example.description" class="text-xs text-dark-4 mt-1">
                {{ example.description }}
              </p>
              <code class="block mt-2 text-brand-purple font-mono text-sm">{{ example.command }}</code>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="ghost" @click="showDetail = false">
            Close
          </Button>
          <Button 
            variant="primary" 
            :loading="commandsStore.isExecuting"
            @click="executeCommand"
          >
            <PlayIcon class="w-4 h-4" />
            Execute
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useCommandsStore } from '@/stores/commands';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import CommandPalette from '@/components/commands/CommandPalette.vue';
import MachineSelector from '@/components/common/MachineSelector.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import Modal from '@/components/common/Modal.vue';
import {
  TerminalIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
} from 'lucide-vue-next';
import type { DiscoveredCommand, CommandCategory } from '@/types';

const commandsStore = useCommandsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedSkill = ref('all');
const showDetail = ref(false);
const selectedCommand = ref<DiscoveredCommand | null>(null);
const currentPage = ref(1);
const itemsPerPage = 20;

const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...commandsStore.categories.map(cat => ({ value: cat, label: cat })),
]);

const skillOptions = computed(() => [
  { value: 'all', label: 'All Skills' },
  ...commandsStore.skillPaths.map(path => ({ value: path, label: path })),
]);

const categoryStats = computed(() => {
  return Object.entries(commandsStore.categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
});

const filteredCommands = computed(() => {
  let result = commandsStore.commands;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );
  }

  if (selectedCategory.value) {
    result = result.filter(c => c.category === selectedCategory.value);
  }

  if (selectedSkill.value && selectedSkill.value !== 'all') {
    result = result.filter(c => c.skill_path === selectedSkill.value);
  }

  return result;
});

const totalPages = computed(() => 
  Math.ceil(filteredCommands.value.length / itemsPerPage)
);

const paginatedCommands = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCommands.value.slice(start, start + itemsPerPage);
});

const currentMachineId = computed(() => machinesStore.selectedMachine?.id);

onMounted(() => {
  if (currentMachineId.value) {
    loadCommands();
  }
});

watch(currentMachineId, (newId) => {
  if (newId) {
    loadCommands();
  }
});

async function loadCommands(): Promise<void> {
  if (!currentMachineId.value) return;
  
  try {
    await commandsStore.fetchCommands(currentMachineId.value);
  } catch {
    toast.error('Failed to load commands');
  }
}

function selectCommand(command: DiscoveredCommand): void {
  selectedCommand.value = command;
  showDetail.value = true;
}

async function executeCommand(): Promise<void> {
  if (!currentMachineId.value || !selectedCommand.value) return;
  
  try {
    await commandsStore.executeCommand(currentMachineId.value, selectedCommand.value.id);
    toast.success(`Command "${selectedCommand.value.name}" executed`);
    showDetail.value = false;
  } catch {
    toast.error('Failed to execute command');
  }
}

function categoryVariant(category: CommandCategory): 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'> = {
    general: 'default',
    git: 'error',
    file: 'warning',
    search: 'info',
    build: 'success',
    test: 'purple',
    deploy: 'error',
    docker: 'info',
    npm: 'error',
    composer: 'warning',
  };
  return variants[category] || 'default';
}
</script>
