<template>
  <Card 
    hoverable 
    class-name="h-full flex flex-col transition-all duration-200"
    :class="{ 'ring-2 ring-brand-purple/50': isSelected }"
  >
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div 
          :class="[
            'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
            statusBgClass
          ]"
        >
          <ServerIcon :class="['w-5 h-5', statusIconClass]" />
        </div>
        <div>
          <h3 class="font-semibold text-skin-primary">{{ server.display_name }}</h3>
          <div class="flex items-center gap-2 text-xs text-skin-secondary">
            <span class="font-mono">{{ server.name }}</span>
            <span>•</span>
            <span>{{ server.transport }}</span>
          </div>
        </div>
      </div>
      <MCPStatusBadge :status="server.status" />
    </div>

    <!-- Description -->
    <p class="mt-3 text-sm text-skin-secondary line-clamp-2">
      {{ server.description || 'No description available' }}
    </p>

    <!-- Connection Details -->
    <div class="mt-4 space-y-2">
      <div v-if="server.command" class="flex items-center gap-2 text-xs">
        <TerminalIcon class="w-3.5 h-3.5 text-skin-secondary flex-shrink-0" />
        <code class="text-skin-secondary bg-surface-3 px-2 py-0.5 rounded truncate flex-1 font-mono">
          {{ server.command }}
        </code>
      </div>
      <div v-if="server.url" class="flex items-center gap-2 text-xs">
        <LinkIcon class="w-3.5 h-3.5 text-skin-secondary flex-shrink-0" />
        <span class="text-skin-secondary truncate">{{ server.url }}</span>
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-4 flex items-center gap-4 text-sm">
      <div 
        class="flex items-center gap-1.5 cursor-pointer hover:text-brand-purple transition-colors"
        @click="$emit('view-tools', server)"
      >
        <WrenchIcon class="w-4 h-4 text-brand-purple" />
        <span class="text-skin-primary font-medium">{{ server.tools_count }}</span>
        <span class="text-skin-secondary">tools</span>
      </div>
      <div v-if="server.uptime" class="flex items-center gap-1.5">
        <ClockIcon class="w-4 h-4 text-skin-secondary" />
        <span class="text-skin-secondary">{{ server.uptime }}</span>
      </div>
    </div>

    <!-- Error Message -->
    <div 
      v-if="hasErrors && server.error_message" 
      class="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded"
    >
      <p class="text-xs text-red-400 line-clamp-2">{{ server.error_message }}</p>
    </div>

    <!-- Actions -->
    <div class="mt-auto pt-4 flex items-center justify-between">
      <div class="flex gap-2">
        <Badge variant="default" size="sm">
          {{ server.transport }}
        </Badge>
      </div>
      
      <div class="flex gap-2">
        <!-- Start Button -->
        <Button 
          v-if="isStopped"
          variant="success" 
          size="sm"
          :loading="isStarting"
          @click="$emit('start', server)"
        >
          <PlayIcon class="w-4 h-4" />
          Start
        </Button>

        <!-- Stop Button -->
        <Button 
          v-else-if="isRunning"
          variant="error" 
          size="sm"
          :loading="isStopping"
          @click="$emit('stop', server)"
        >
          <SquareIcon class="w-4 h-4" />
          Stop
        </Button>

        <!-- Restart Button (for error state) -->
        <Button 
          v-else-if="hasErrors"
          variant="warning" 
          size="sm"
          :loading="isStarting"
          @click="$emit('restart', server)"
        >
          <RefreshCwIcon class="w-4 h-4" />
          Restart
        </Button>

        <!-- View Button -->
        <Button 
          variant="ghost" 
          size="sm"
          @click="$emit('view', server)"
        >
          <SettingsIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import MCPStatusBadge from '@/components/mcp/MCPStatusBadge.vue';
import {
  ServerIcon,
  TerminalIcon,
  LinkIcon,
  WrenchIcon,
  ClockIcon,
  PlayIcon,
  SquareIcon,
  RefreshCwIcon,
  SettingsIcon,
} from 'lucide-vue-next';
import type { MCPServer } from '@/types';

interface Props {
  server: MCPServer;
  isSelected?: boolean;
  isStarting?: boolean;
  isStopping?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isStarting: false,
  isStopping: false,
});

const emit = defineEmits<{
  start: [server: MCPServer];
  stop: [server: MCPServer];
  restart: [server: MCPServer];
  view: [server: MCPServer];
  'view-tools': [server: MCPServer];
}>();

const isRunning = computed(() => props.server.status === 'running');
const isStopped = computed(() => props.server.status === 'stopped');
const hasErrors = computed(() => props.server.status === 'error');

const statusBgClass = computed(() => {
  if (isRunning.value) return 'bg-green-500/10';
  if (hasErrors.value) return 'bg-red-500/10';
  return 'bg-surface-3';
});

const statusIconClass = computed(() => {
  if (isRunning.value) return 'text-green-400';
  if (hasErrors.value) return 'text-red-400';
  return 'text-skin-secondary';
});
</script>
