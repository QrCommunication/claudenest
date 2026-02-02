<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium text-dark-4 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-400">*</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="[
          'block w-full rounded-button bg-dark-3 border text-white appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-dark-4',
          sizeClasses[size],
        ]"
        @change="handleChange"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
        <option
          v-if="placeholder"
          value=""
          disabled
          selected
          class="text-dark-4"
        >
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Dropdown Arrow -->
      <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-dark-4">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1.5 text-sm text-red-400">
      {{ error }}
    </p>

    <!-- Helper Text -->
    <p v-else-if="helperText" class="mt-1.5 text-sm text-dark-4">
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SelectOption } from '@/types';

type SelectSize = 'sm' | 'md' | 'lg';

interface Props {
  modelValue: string | number;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  size?: SelectSize;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  helperText: '',
  error: '',
  disabled: false,
  required: false,
  size: 'md',
  id: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

let selectIdCounter = 0;
const selectId = computed(() => props.id || `select-${++selectIdCounter}`);

const sizeClasses: Record<SelectSize, string> = {
  sm: 'py-1.5 pl-3 pr-10 text-sm',
  md: 'py-2 pl-3 pr-10 text-sm',
  lg: 'py-3 pl-4 pr-10 text-base',
};

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  const numValue = Number(value);
  
  // Try to emit as number if it's a valid number
  const finalValue = !isNaN(numValue) && value !== '' ? numValue : value;
  
  emit('update:modelValue', finalValue);
  emit('change', finalValue);
};
</script>
