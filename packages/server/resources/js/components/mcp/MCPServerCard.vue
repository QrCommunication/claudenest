<template>
  <Card hoverable class-name="h-full flex flex-col">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div
          :class="[
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isRunning ? 'bg-green-500/10' : hasErrors ? 'bg-red-500/10' : 'bg-surface-3'
          ]"
        >
          <ServerIcon
            :class="[
              'w-5 h-5',
              isRunning ? 'text-green-400' : hasErrors ? 'text-red-400' : 'text-skin-secondary'
            ]"
          />
        </div>
        <div>
          <h3 class="font-semibold text-skin-primary">{{ server.display_name }}</h3>
          <p class="text-xs text-skin-secondary">{{ server.transport }} transport</p>
        </div>
      </div>
      <MCPStatusBadge :status="server.status" />
    </div>

    <p class="mt-3 text-sm text-skin-secondary line-clamp-2">
      {{ server.description || 'No description available' }}
    </p>

    <div class="mt-4 space-y-2">
      <div v-if="server.command" class="flex items-center gap-2 text-xs">
        <TerminalIcon class="w-3.5 h-3.5 text-skin-secondary" />
        <code class="text-skin-secondary bg-surface-3 px-2 py-0.5 rounded truncate flex-1">
          {{ server.command }}
        </code>
      </div>
      <div v-if="server.url" class="flex items-center gap-2 text-xs">
        <LinkIcon class="w-3.5 h-3.5 text-skin-secondary" />
        <span class="text-skin-secondary truncate">{{ server.url }}</span>
      </div>
    </div>

    <div class="mt-4 flex items-center gap-4 text-sm">
      <div class="flex items-center gap-1.5">
        <WrenchIcon class="w-4 h-4 text-skin-secondary" />
        <span class="text-skin-secondary">{{ server.tools_count }} tools</span>
      </div>
      <div v-if="server.uptime" class="flex items-center gap-1.5">
        <ClockIcon class="w-4 h-4 text-skin-secondary" />
        <span class="text-skin-secondary">{{ server.uptime }}</span>
      </div>
    </div>

    <div class="mt-auto pt-4 flex items-center justify-between">
      <div class="flex gap-2">
        <Badge variant="default" size="sm">
          {{ server.transport }}
        </Badge>
      </div>
      
      <div class="flex gap-2">
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
        <Button 
          v-else-if="isRunning"
          variant="error" 
          size="sm"
          :loading="isStopping"
          @click="$emit('stop', server)"
        >
          <StopIcon class="w-4 h-4" />
          Stop
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          @click="$emit('view', server)"
        >
          <ArrowRightIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <div v-if="hasErrors && server.error_message" class="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
      <p class="text-xs text-red-400">{{ server.error_message }}</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import MCPStatusBadge from './MCPStatusBadge.vue';
import { 
  ServerIcon, 
  TerminalIcon, 
  LinkIcon, 
  WrenchIcon, 
  ClockIcon,
  PlayIcon,
  SquareIcon,
  ArrowRightIcon,
} from 'lucide-vue-next';
import type { MCPServer } from '@/types';

// Icon aliases
const StopIcon = SquareIcon;

interface Props {
  server: MCPServer;
  isStarting?: boolean;
  isStopping?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isStarting: false,
  isStopping: false,
});

defineEmits<{
  start: [server: MCPServer];
  stop: [server: MCPServer];
  view: [server: MCPServer];
}>();

const isRunning = computed(() => props.server.status === 'running');
const isStopped = computed(() => props.server.status === 'stopped');
const hasErrors = computed(() => props.server.status === 'error');
</script>
