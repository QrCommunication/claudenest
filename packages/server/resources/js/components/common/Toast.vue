<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      :class="[
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-card shadow-lg ring-1 ring-black ring-opacity-5',
        variantClasses[toast.type],
      ]"
    >
      <div class="p-4">
        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg
              v-if="toast.type === 'success'"
              class="h-6 w-6 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg
              v-else-if="toast.type === 'error'"
              class="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg
              v-else-if="toast.type === 'warning'"
              class="h-6 w-6 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg
              v-else
              class="h-6 w-6 text-brand-cyan"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Content -->
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-skin-primary">{{ toast.title }}</p>
            <p v-if="toast.message" class="mt-1 text-sm text-skin-secondary">{{ toast.message }}</p>
          </div>

          <!-- Close Button -->
          <div class="ml-4 flex flex-shrink-0">
            <button
              class="inline-flex rounded-md text-skin-muted hover:text-skin-primary focus:outline-none"
              @click="remove"
            >
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div
        v-if="toast.duration && toast.duration > 0"
        class="h-1 bg-white/10"
      >
        <div
          class="h-full bg-current opacity-50 transition-all duration-100 ease-linear"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Toast } from '@/types';

interface Props {
  toast: Toast;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  remove: [id: string];
}>();

const variantClasses = {
  success: 'bg-surface-2 border border-green-500/20',
  error: 'bg-surface-2 border border-red-500/20',
  warning: 'bg-surface-2 border border-yellow-500/20',
  info: 'bg-surface-2 border border-brand-cyan/20',
};

const progress = ref(100);
let interval: number | null = null;

const remove = () => {
  emit('remove', props.toast.id);
};

onMounted(() => {
  if (props.toast.duration && props.toast.duration > 0) {
    const step = 100 / (props.toast.duration / 100);
    interval = window.setInterval(() => {
      progress.value -= step;
      if (progress.value <= 0) {
        if (interval) clearInterval(interval);
      }
    }, 100);
  }
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>
