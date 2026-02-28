<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-skin-secondary" />
      <Input
        v-model="searchQuery"
        type="text"
        placeholder="Search commands..."
        class="pl-10 pr-10"
        @focus="isOpen = true"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="isOpen = false"
      />
      <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <span v-if="searchQuery" class="text-xs text-skin-secondary">
          {{ filteredCommands.length }} results
        </span>
        <kbd class="hidden sm:inline-block text-xs text-skin-secondary bg-surface-3 px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>
    </div>

    <!-- Results Dropdown -->
    <div 
      v-if="isOpen && searchQuery"
      class="absolute top-full left-0 right-0 mt-2 bg-surface-2 border border-skin rounded-card shadow-xl max-h-96 overflow-auto z-50"
    >
      <div v-if="filteredCommands.length === 0" class="p-4 text-center">
        <p class="text-sm text-skin-secondary">No commands found</p>
      </div>
      
      <template v-else>
        <div 
          v-for="(command, index) in filteredCommands" 
          :key="command.id"
          :class="[
            'p-3 cursor-pointer transition-colors',
            index === highlightedIndex ? 'bg-brand-purple/10' : 'hover:bg-surface-3'
          ]"
          @click="selectCommand(command)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-surface-3 flex items-center justify-center flex-shrink-0">
              <TerminalIcon class="w-4 h-4 text-brand-purple" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <code class="text-sm text-skin-primary font-mono">{{ command.name }}</code>
                <Badge :variant="categoryVariant(command.category)" size="sm">
                  {{ command.category }}
                </Badge>
              </div>
              <p v-if="command.description" class="text-xs text-skin-secondary mt-1 line-clamp-1">
                {{ command.description }}
              </p>
              <code class="text-xs text-skin-secondary mt-1 block">{{ command.signature }}</code>
            </div>
            <ArrowRightIcon 
              v-if="index === highlightedIndex" 
              class="w-4 h-4 text-brand-purple flex-shrink-0" 
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Backdrop -->
    <div 
      v-if="isOpen && searchQuery" 
      class="fixed inset-0 z-40" 
      @click="isOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import { SearchIcon, TerminalIcon, ArrowRightIcon } from 'lucide-vue-next';
import type { DiscoveredCommand, CommandCategory } from '@/types';

interface Props {
  commands: DiscoveredCommand[];
  modelValue?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [command: DiscoveredCommand];
  'update:modelValue': [value: string];
}>();

const searchQuery = ref(props.modelValue || '');
const isOpen = ref(false);
const highlightedIndex = ref(0);

const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.commands.slice(0, 10);
  }
  
  const query = searchQuery.value.toLowerCase();
  return props.commands.filter(cmd => 
    cmd.name.toLowerCase().includes(query) ||
    (cmd.description && cmd.description.toLowerCase().includes(query)) ||
    cmd.aliases.some(alias => alias.toLowerCase().includes(query))
  ).slice(0, 20);
});

watch(searchQuery, (value) => {
  emit('update:modelValue', value);
  highlightedIndex.value = 0;
});

watch(() => props.modelValue, (value) => {
  if (value !== searchQuery.value) {
    searchQuery.value = value || '';
  }
});

watch(filteredCommands, () => {
  highlightedIndex.value = 0;
});

function highlightNext(): void {
  if (highlightedIndex.value < filteredCommands.value.length - 1) {
    highlightedIndex.value++;
  }
}

function highlightPrev(): void {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
}

function selectHighlighted(): void {
  const command = filteredCommands.value[highlightedIndex.value];
  if (command) {
    selectCommand(command);
  }
}

function selectCommand(command: DiscoveredCommand): void {
  emit('select', command);
  isOpen.value = false;
  searchQuery.value = '';
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

// Keyboard shortcut (Cmd/Ctrl + K)
function handleKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    input?.focus();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>
