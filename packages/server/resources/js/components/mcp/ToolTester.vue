<template>
  <Modal :model-value="show" @update:model-value="$emit('close')" @close="$emit('close')">
    <template #title>
      <div class="flex items-center gap-2">
        <WrenchIcon class="w-5 h-5 text-brand-purple" />
        Test Tool: {{ tool?.name }}
      </div>
    </template>

    <div class="space-y-4">
      <p v-if="tool?.description" class="text-sm text-dark-4">
        {{ tool.description }}
      </p>

      <div v-if="hasParameters" class="space-y-3">
        <p class="text-sm font-medium text-white">Parameters</p>
        
        <div
          v-for="(param, name) in parameters"
          :key="String(name)"
          class="space-y-1"
        >
          <label class="flex items-center gap-2 text-sm">
            <span class="text-white">{{ name }}</span>
            <Badge size="sm" variant="default">{{ param.type }}</Badge>
            <Badge v-if="isRequired(name)" size="sm" variant="error">required</Badge>
          </label>
          <p v-if="param.description" class="text-xs text-dark-4">
            {{ param.description }}
          </p>
          
          <select
            v-if="param.enum"
            v-model="paramValues[name]"
            class="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-purple"
          >
            <option value="">Select...</option>
            <option v-for="option in param.enum" :key="String(option)" :value="option">
              {{ option }}
            </option>
          </select>
          
          <textarea
            v-else-if="param.type === 'object' || param.type === 'array'"
            v-model="paramValues[name]"
            rows="3"
            :placeholder="`Enter ${param.type} as JSON...`"
            class="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-purple font-mono"
          />
          
          <Input
            v-else
            v-model="paramValues[name]"
            :type="inputType(param.type)"
            :placeholder="param.description || `Enter ${param.type}...`"
          />
        </div>
      </div>

      <div v-else class="text-center py-4">
        <p class="text-sm text-dark-4">This tool has no parameters</p>
      </div>

      <!-- Result -->
      <div v-if="result" class="mt-4">
        <p class="text-sm font-medium text-white mb-2">Result</p>
        <pre class="bg-dark-1 border border-dark-4 rounded-lg p-3 text-xs text-dark-4 overflow-auto max-h-60 font-mono">{{ formattedResult }}</pre>
      </div>

      <!-- Error -->
      <div v-if="error" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p class="text-sm text-red-400">{{ error }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="ghost" @click="$emit('close')">
          Cancel
        </Button>
        <Button 
          variant="primary" 
          :loading="isExecuting"
          @click="execute"
        >
          <PlayIcon class="w-4 h-4" />
          Execute
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import { WrenchIcon, PlayIcon } from 'lucide-vue-next';
import type { MCPTool } from '@/types';

interface Props {
  show: boolean;
  tool: MCPTool | null;
  isExecuting?: boolean;
  result?: unknown;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  isExecuting: false,
  result: undefined,
  error: null,
});

const emit = defineEmits<{
  close: [];
  execute: [params: Record<string, unknown>];
}>();

const paramValues = ref<Record<string, string>>({});

const parameters = computed(() => props.tool?.parameters?.properties || {});
const hasParameters = computed(() => Object.keys(parameters.value).length > 0);
const requiredParams = computed(() => props.tool?.parameters?.required || []);

const formattedResult = computed(() => {
  if (!props.result) return '';
  return JSON.stringify(props.result, null, 2);
});

watch(() => props.tool, () => {
  paramValues.value = {};
}, { immediate: true });

function isRequired(name: string): boolean {
  return requiredParams.value.includes(name);
}

type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';

function inputType(paramType: string): InputType {
  switch (paramType) {
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'text';
    default:
      return 'text';
  }
}

function execute(): void {
  const params: Record<string, unknown> = {};
  
  for (const [name, value] of Object.entries(paramValues.value)) {
    if (!value && isRequired(name)) {
      continue;
    }
    
    const paramType = parameters.value[name]?.type;
    
    if (paramType === 'number' || paramType === 'integer') {
      params[name] = Number(value);
    } else if (paramType === 'boolean') {
      params[name] = value === 'true';
    } else if (paramType === 'object' || paramType === 'array') {
      try {
        params[name] = JSON.parse(value);
      } catch {
        params[name] = value;
      }
    } else {
      params[name] = value;
    }
  }
  
  emit('execute', params);
}
</script>
