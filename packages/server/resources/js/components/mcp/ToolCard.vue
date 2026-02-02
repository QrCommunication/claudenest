<template>
  <Card class-name="h-full">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-brand-purple/10 flex items-center justify-center">
          <WrenchIcon class="w-4 h-4 text-brand-purple" />
        </div>
        <div>
          <h3 class="font-medium text-white">{{ tool.name }}</h3>
          <p v-if="serverName" class="text-xs text-dark-4">{{ serverName }}</p>
        </div>
      </div>
      <Button 
        v-if="!hideTest"
        variant="ghost" 
        size="sm"
        @click="$emit('test', tool)"
      >
        <PlayIcon class="w-4 h-4" />
      </Button>
    </div>

    <p class="mt-3 text-sm text-dark-4">
      {{ tool.description || 'No description available' }}
    </p>

    <div v-if="hasParameters" class="mt-4">
      <p class="text-xs font-medium text-dark-4 mb-2">Parameters</p>
      <div class="space-y-1.5">
        <div 
          v-for="(param, name) in parameters" 
          :key="name"
          class="flex items-center gap-2 text-xs"
        >
          <code class="text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded">
            {{ name }}
          </code>
          <span class="text-dark-4">{{ param.type }}</span>
          <span v-if="isRequired(name)" class="text-red-400">*</span>
        </div>
      </div>
    </div>

    <div v-if="requiredParams.length > 0" class="mt-3 flex items-center gap-2">
      <span class="text-xs text-dark-4">Required:</span>
      <div class="flex gap-1 flex-wrap">
        <Badge 
          v-for="param in requiredParams" 
          :key="param"
          variant="error" 
          size="sm"
        >
          {{ param }}
        </Badge>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import { WrenchIcon, PlayIcon } from 'lucide-vue-next';
import type { MCPTool, MCPToolWithServer } from '@/types';

interface Props {
  tool: MCPTool | MCPToolWithServer;
  serverName?: string;
  hideTest?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  serverName: '',
  hideTest: false,
});

defineEmits<{
  test: [tool: MCPTool | MCPToolWithServer];
}>();

const parameters = computed(() => props.tool.parameters?.properties || {});
const hasParameters = computed(() => Object.keys(parameters.value).length > 0);
const requiredParams = computed(() => props.tool.parameters?.required || []);

function isRequired(name: string): boolean {
  return requiredParams.value.includes(name);
}
</script>
