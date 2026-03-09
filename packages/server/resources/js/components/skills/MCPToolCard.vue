<template>
  <Card class-name="h-full hover:border-brand-purple/50 transition-colors">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-brand-purple/10 flex items-center justify-center">
          <WrenchIcon class="w-4 h-4 text-brand-purple" />
        </div>
        <div>
          <h3 class="font-medium text-skin-primary">{{ tool.name }}</h3>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        @click="$emit('test', tool)"
      >
        <PlayIcon class="w-4 h-4" />
      </Button>
    </div>

    <p class="mt-3 text-sm text-skin-secondary">
      {{ tool.description || 'No description available' }}
    </p>

    <div v-if="hasParameters" class="mt-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-medium text-skin-secondary">Parameters</p>
        <Badge v-if="requiredParams.length > 0" variant="error" size="sm">
          {{ requiredParams.length }} required
        </Badge>
      </div>
      <div class="space-y-1.5">
        <div 
          v-for="(param, name) in displayedParams" 
          :key="name"
          class="flex items-center gap-2 text-xs"
        >
          <code class="text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded font-mono">
            {{ name }}
          </code>
          <span class="text-skin-secondary">{{ param.type }}</span>
          <span v-if="isRequired(name)" class="text-red-400">*</span>
        </div>
        <div v-if="hiddenParamsCount > 0" class="text-xs text-skin-secondary">
          +{{ hiddenParamsCount }} more
        </div>
      </div>
    </div>

    <div v-if="tool.parameters?.properties" class="mt-3 pt-3 border-t border-skin">
      <div class="flex items-center gap-2">
        <BoxIcon class="w-3.5 h-3.5 text-skin-secondary" />
        <span class="text-xs text-skin-secondary">
          {{ Object.keys(tool.parameters.properties).length }} parameters
        </span>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import { WrenchIcon, PlayIcon, BoxIcon } from 'lucide-vue-next';
import type { MCPTool } from '@/types';

interface Props {
  tool: MCPTool;
  maxParams?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxParams: 3,
});

defineEmits<{
  test: [tool: MCPTool];
}>();

const parameters = computed(() => props.tool.parameters?.properties || {});
const hasParameters = computed(() => Object.keys(parameters.value).length > 0);
const requiredParams = computed(() => props.tool.parameters?.required || []);

const displayedParams = computed(() => {
  const entries = Object.entries(parameters.value);
  return Object.fromEntries(entries.slice(0, props.maxParams));
});

const hiddenParamsCount = computed(() => 
  Math.max(0, Object.keys(parameters.value).length - props.maxParams)
);

function isRequired(name: string): boolean {
  return requiredParams.value.includes(name);
}
</script>
