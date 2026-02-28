<template>
  <div class="context-editor">
    <textarea
      v-if="editable"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      :placeholder="placeholder"
      :rows="computedRows"
      class="editor-textarea"
    />
    <div 
      v-else 
      class="context-preview"
      :class="{ 'is-empty': !modelValue }"
    >
      <template v-if="modelValue">
        {{ modelValue }}
      </template>
      <template v-else>
        {{ placeholder }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: string;
  editable?: boolean;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  placeholder: '',
  minRows: 3,
  maxRows: 10,
});

defineEmits<{
  'update:modelValue': [value: string];
}>();

const computedRows = computed(() => {
  if (!props.modelValue) return props.minRows;
  
  const lines = props.modelValue.split('\n').length;
  return Math.min(Math.max(lines, props.minRows), props.maxRows);
});
</script>

<style scoped>
.context-editor {
  @apply w-full;
}

.editor-textarea {
  @apply w-full px-4 py-3 bg-surface-2 border border-skin rounded-lg text-skin-primary text-sm;
  @apply focus:outline-none focus:border-brand-purple;
  @apply resize-none;
  font-family: inherit;
  line-height: 1.6;
}

.context-preview {
  @apply px-4 py-3 bg-surface-3 rounded-lg text-sm text-skin-primary whitespace-pre-wrap;
  line-height: 1.6;
  min-height: 3rem;
}

.context-preview.is-empty {
  @apply text-skin-secondary italic;
}
</style>
