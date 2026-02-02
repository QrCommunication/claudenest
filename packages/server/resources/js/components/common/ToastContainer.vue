<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none"
      aria-live="assertive"
    >
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        class="pointer-events-auto"
        @remove="removeToast"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import Toast from './Toast.vue';
import { useGlobalToast } from '@/composables/useToast';

const { toasts, removeToast } = useGlobalToast();
</script>
