<template>
  <button
    type="button"
    :disabled="loading"
    :class="[
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-dark-1',
      enabled ? 'bg-brand-purple' : 'bg-dark-4',
      loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-90',
    ]"
    @click="$emit('toggle')"
  >
    <span class="sr-only">{{ enabled ? 'Disable' : 'Enable' }}</span>
    <span
      :class="[
        'inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out',
        enabled ? 'translate-x-6' : 'translate-x-1',
        loading && 'animate-pulse',
      ]"
    >
      <LoaderIcon 
        v-if="loading" 
        class="w-3 h-3 text-dark-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" 
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import { LoaderIcon } from 'lucide-vue-next';

interface Props {
  enabled: boolean;
  loading?: boolean;
}

defineProps<Props>();

defineEmits<{
  toggle: [];
}>();
</script>
