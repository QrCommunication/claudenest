<template>
  <Card class-name="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <ScrollTextIcon class="w-5 h-5 text-brand-purple" />
          <span class="font-medium text-white">Server Logs</span>
          <Badge v-if="serverName" variant="default" size="sm">
            {{ serverName }}
          </Badge>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'text-brand-purple': autoScroll }"
            @click="autoScroll = !autoScroll"
          >
            <ArrowDownIcon class="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" @click="clearLogs">
            <TrashIcon class="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" @click="refreshLogs">
            <RefreshCwIcon class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
          </Button>
        </div>
      </div>
    </template>

    <div 
      ref="logContainerRef"
      class="flex-1 bg-dark-1 rounded-lg p-4 font-mono text-xs overflow-auto max-h-[500px]"
      @scroll="handleScroll"
    >
      <div v-if="logs.length === 0" class="text-dark-4 text-center py-8">
        <TerminalIcon class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No logs available</p>
      </div>
      
      <div v-else class="space-y-1">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="flex gap-3 hover:bg-dark-2/50 px-1 -mx-1 rounded"
        >
          <span class="text-dark-4 flex-shrink-0 w-16 text-right select-none">
            {{ formatTime(log.timestamp) }}
          </span>
          <span 
            :class="[
              'flex-shrink-0 w-12 font-bold',
              levelColorClass(log.level)
            ]"
          >
            {{ log.level }}
          </span>
          <span 
            class="break-all whitespace-pre-wrap"
            :class="logColorClass(log.level)"
          >
            {{ log.message }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mt-3 text-xs text-dark-4">
      <span>{{ logs.length }} entries</span>
      <span v-if="lastUpdated">Last updated: {{ lastUpdated }}</span>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import {
  ScrollTextIcon,
  ArrowDownIcon,
  TrashIcon,
  RefreshCwIcon,
  TerminalIcon,
} from 'lucide-vue-next';

interface LogEntry {
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'STDOUT' | 'STDERR';
  message: string;
}

interface Props {
  serverName?: string;
  logs?: LogEntry[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  serverName: '',
  logs: () => [],
  isLoading: false,
});

const emit = defineEmits<{
  refresh: [];
}>();

const logContainerRef = ref<HTMLElement>();
const autoScroll = ref(true);
const isRefreshing = ref(false);
const lastUpdated = ref<string>('');

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
  });
}

function levelColorClass(level: LogEntry['level']): string {
  const colors: Record<LogEntry['level'], string> = {
    DEBUG: 'text-gray-500',
    INFO: 'text-blue-400',
    WARN: 'text-yellow-400',
    ERROR: 'text-red-400',
    STDOUT: 'text-green-400',
    STDERR: 'text-red-400',
  };
  return colors[level] || 'text-gray-400';
}

function logColorClass(level: LogEntry['level']): string {
  const colors: Record<LogEntry['level'], string> = {
    DEBUG: 'text-gray-400',
    INFO: 'text-white',
    WARN: 'text-yellow-200',
    ERROR: 'text-red-200',
    STDOUT: 'text-green-200',
    STDERR: 'text-red-200',
  };
  return colors[level] || 'text-white';
}

function scrollToBottom(): void {
  if (autoScroll.value && logContainerRef.value) {
    nextTick(() => {
      logContainerRef.value!.scrollTop = logContainerRef.value!.scrollHeight;
    });
  }
}

function handleScroll(): void {
  if (!logContainerRef.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = logContainerRef.value;
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
  
  // Disable auto-scroll if user manually scrolled up
  if (!isAtBottom) {
    autoScroll.value = false;
  }
}

function clearLogs(): void {
  // This would need to be implemented in the parent component
  // or through a separate API call
}

async function refreshLogs(): Promise<void> {
  isRefreshing.value = true;
  emit('refresh');
  
  setTimeout(() => {
    isRefreshing.value = false;
    lastUpdated.value = new Date().toLocaleTimeString();
    scrollToBottom();
  }, 500);
}

watch(() => props.logs, () => {
  lastUpdated.value = new Date().toLocaleTimeString();
  scrollToBottom();
}, { deep: true });
</script>
