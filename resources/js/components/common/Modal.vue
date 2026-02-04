<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeOnBackdrop && close()"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <!-- Modal Content -->
        <div
          :class="[
            'relative bg-dark-2 rounded-card border border-dark-4 shadow-2xl',
            'w-full transform transition-all',
            sizeClasses[size],
            className,
          ]"
        >
          <!-- Close Button -->
          <button
            v-if="showClose"
            class="absolute right-4 top-4 text-dark-4 hover:text-white transition-colors"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Header -->
          <div v-if="$slots.header || title" class="px-6 py-4 border-b border-dark-4">
            <slot name="header">
              <h3 class="text-lg font-semibold text-white pr-8">{{ title }}</h3>
              <p v-if="description" class="mt-1 text-sm text-dark-4">{{ description }}</p>
            </slot>
          </div>

          <!-- Body -->
          <div :class="['p-6', contentClass]">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-dark-4">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface Props {
  modelValue: boolean;
  title?: string;
  description?: string;
  size?: ModalSize;
  showClose?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  contentClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  size: 'md',
  showClose: true,
  closeOnBackdrop: true,
  closeOnEsc: true,
  className: '',
  contentClass: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

// Handle escape key
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.closeOnEsc) {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        window.removeEventListener('keydown', handleEsc);
      }
    };
    window.addEventListener('keydown', handleEsc);
  }
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .transform,
.modal-leave-active .transform {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .transform,
.modal-leave-to .transform {
  transform: scale(0.95);
}
</style>
