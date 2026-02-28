<template>
  <div class="prd-input">
    <div class="prd-header">
      <h3 class="prd-title">{{ $t('projects.decompose.prd_title') }}</h3>
      <p class="prd-subtitle">{{ $t('projects.decompose.prd_description') }}</p>
    </div>

    <!-- PRD Textarea -->
    <div class="prd-field">
      <textarea
        v-model="prd"
        class="prd-textarea"
        :placeholder="$t('projects.decompose.prd_placeholder')"
        rows="12"
      ></textarea>
      <div class="prd-meta">
        <span class="char-count" :class="{ 'text-red-400': prd.length > 50000 }">
          {{ prd.length }} / 50,000
        </span>
      </div>
    </div>

    <!-- Credential Selector -->
    <div class="credential-field">
      <label class="field-label">{{ $t('projects.decompose.credential') }}</label>
      <select
        v-model="selectedCredentialId"
        class="credential-select"
      >
        <option value="" disabled>{{ $t('projects.decompose.select_credential') }}</option>
        <option
          v-for="cred in credentials"
          :key="cred.id"
          :value="cred.id"
        >
          {{ cred.name }} ({{ cred.auth_type }})
          {{ cred.is_default ? '★' : '' }}
        </option>
      </select>
    </div>

    <!-- Decompose Button -->
    <button
      class="btn btn-decompose"
      :disabled="!canDecompose || isDecomposing"
      @click="handleDecompose"
    >
      <svg v-if="isDecomposing" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/>
        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75"/>
      </svg>
      {{ isDecomposing ? $t('projects.decompose.decomposing') : $t('projects.decompose.decompose_btn') }}
    </button>

    <!-- Error -->
    <div v-if="error" class="prd-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCredentialsStore } from '@/stores/credentials';
import { storeToRefs } from 'pinia';

interface Props {
  modelValue: string;
  credentialId: string;
  isDecomposing?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  isDecomposing: false,
  error: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:credentialId', value: string): void;
  (e: 'decompose'): void;
}>();

const credentialsStore = useCredentialsStore();
const { credentials } = storeToRefs(credentialsStore);

const prd = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
});

const selectedCredentialId = computed({
  get: () => props.credentialId,
  set: (v: string) => emit('update:credentialId', v),
});

const canDecompose = computed(() =>
  prd.value.length >= 20 && !!selectedCredentialId.value
);

function handleDecompose(): void {
  if (canDecompose.value) {
    emit('decompose');
  }
}

onMounted(async () => {
  if (credentials.value.length === 0) {
    await credentialsStore.fetchCredentials();
  }
  // Auto-select default credential
  if (!selectedCredentialId.value && credentialsStore.defaultCredential) {
    emit('update:credentialId', credentialsStore.defaultCredential.id);
  }
});
</script>

<style scoped>
.prd-input {
  @apply space-y-4;
}

.prd-header {
  @apply space-y-1;
}

.prd-title {
  @apply text-lg font-semibold text-skin-primary;
}

.prd-subtitle {
  @apply text-sm text-skin-secondary;
}

.prd-field {
  @apply space-y-1;
}

.prd-textarea {
  @apply w-full bg-surface-3 border border-skin rounded-lg p-3 text-sm text-skin-primary
         placeholder-skin-secondary resize-y focus:outline-none focus:ring-1 focus:ring-brand-purple/50
         font-mono;
}

.prd-meta {
  @apply flex justify-end;
}

.char-count {
  @apply text-xs text-skin-muted;
}

.credential-field {
  @apply space-y-1;
}

.field-label {
  @apply block text-sm font-medium text-skin-primary;
}

.credential-select {
  @apply w-full bg-surface-3 border border-skin rounded-lg px-3 py-2 text-sm text-skin-primary
         focus:outline-none focus:ring-1 focus:ring-brand-purple/50;
}

.btn-decompose {
  @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
         bg-gradient-to-r from-brand-purple to-brand-indigo text-white
         hover:opacity-90 transition-opacity;
}

.btn-decompose:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.prd-error {
  @apply p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm;
}
</style>
