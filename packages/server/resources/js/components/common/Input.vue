<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-skin-secondary mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-400">*</span>
    </label>
    
    <div class="relative">
      <!-- Left Icon -->
      <div
        v-if="$slots['left-icon']"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-skin-secondary"
      >
        <slot name="left-icon" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'block w-full rounded-button bg-surface-3 border text-skin-primary placeholder-skin-secondary',
          'focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-skin',
          $slots['left-icon'] ? 'pl-10' : 'pl-4',
          $slots['right-icon'] || type === 'password' ? 'pr-10' : 'pr-4',
          sizeClasses[size],
        ]"
        @input="handleInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />

      <!-- Right Icon / Password Toggle -->
      <div
        v-if="$slots['right-icon'] || type === 'password'"
        class="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <slot name="right-icon">
          <button
            v-if="type === 'password' || showPassword"
            type="button"
            class="text-skin-secondary hover:text-skin-primary transition-colors"
            @click="togglePassword"
          >
            <svg
              v-if="!showPassword"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </slot>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1.5 text-sm text-red-400">
      {{ error }}
    </p>

    <!-- Helper Text -->
    <p v-else-if="helperText" class="mt-1.5 text-sm text-skin-secondary">
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
type InputSize = 'sm' | 'md' | 'lg';

interface Props {
  modelValue: string;
  type?: InputType;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  size?: InputSize;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
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
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

let inputIdCounter = 0;
const inputId = computed(() => props.id || `input-${++inputIdCounter}`);

const showPassword = ref(false);

const sizeClasses: Record<InputSize, string> = {
  sm: 'py-1.5 text-sm',
  md: 'py-2 text-sm',
  lg: 'py-3 text-base',
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>
