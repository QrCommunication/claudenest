<template>
  <Modal
    :model-value="modelValue"
    :title="t('epicDecomposition.title')"
    class-name="!max-w-[640px] max-h-[85vh] flex flex-col"
    content-class="flex-1 min-h-0 overflow-y-auto"
    @update:model-value="onClose"
  >
    <div class="epic-decomp">
      <!-- Epic title -->
      <label class="ed-label" for="ed-title">{{ t('epicDecomposition.epicName') }}</label>
      <input
        id="ed-title"
        v-model="epicTitle"
        class="ed-input"
        :placeholder="t('epicDecomposition.epicNamePlaceholder')"
        maxlength="255"
      />

      <!-- PRD -->
      <label class="ed-label" for="ed-prd">{{ t('projects.decompose.prd_title') }}</label>
      <textarea
        id="ed-prd"
        v-model="prd"
        class="ed-textarea"
        :placeholder="t('projects.decompose.prd_placeholder')"
        rows="10"
        maxlength="50000"
      ></textarea>
      <div class="ed-charcount" :class="{ 'ed-charcount--over': prd.length > 50000 }">
        {{ prd.length }} / 50 000
      </div>

      <!-- Credential -->
      <label class="ed-label" for="ed-cred">{{ t('projects.decompose.credential') }}</label>
      <select id="ed-cred" v-model="credentialId" class="ed-input">
        <option value="" disabled>{{ t('projects.decompose.select_credential') }}</option>
        <option v-for="cred in credentials" :key="cred.id" :value="cred.id">
          {{ cred.name }} ({{ cred.auth_type }}){{ cred.is_default ? ' ★' : '' }}
        </option>
      </select>

      <p class="ed-hint">{{ t('epicDecomposition.decomposeWithAiHint') }}</p>
      <p v-if="error" class="ed-error">{{ error }}</p>
    </div>

    <template #footer>
      <div class="ed-actions">
        <button class="ed-btn ed-btn--ghost" @click="onClose">{{ t('common.cancel') }}</button>
        <!-- Single action: create the epic + launch its async decomposition. -->
        <button class="ed-btn ed-btn--primary" :disabled="!canDecompose" @click="onDecompose">
          <span v-if="isSubmitting" class="ed-spinner" aria-hidden="true" />
          {{ t('epicDecomposition.decomposeWithAi') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import Modal from '@/components/common/Modal.vue';
import { useCredentialsStore } from '@/stores/credentials';
import { api } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import type { ApiResponse } from '@/types';

interface Props {
  projectId: string;
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  // The async "Decompose with AI" run was launched: the epic exists (pending);
  // its sprints/tasks arrive later on the realtime `.epic.decomposition` signal.
  started: [];
}>();

const { t } = useI18n();
const toast = useToast();
const credentialsStore = useCredentialsStore();
const { credentials } = storeToRefs(credentialsStore);

const PRD_MIN_LENGTH = 20;
const PRD_MAX_LENGTH = 50000;

const epicTitle = ref('');
const prd = ref('');
const credentialId = ref('');
const isSubmitting = ref(false);
const error = ref<string | null>(null);

const canDecompose = computed(
  () =>
    epicTitle.value.trim().length > 0 &&
    prd.value.trim().length >= PRD_MIN_LENGTH &&
    prd.value.length <= PRD_MAX_LENGTH &&
    !!credentialId.value &&
    !isSubmitting.value,
);

// Single action: POST /projects/{id}/epics/decompose creates the epic up-front
// (pending) and spawns the decompose session. We don't await the plan — Show.vue
// surfaces the pending epic on `started` and reacts to the realtime completion.
async function onDecompose(): Promise<void> {
  if (!canDecompose.value) return;
  isSubmitting.value = true;
  error.value = null;
  try {
    await api.post<ApiResponse<{ status: string }>>(
      `/projects/${props.projectId}/epics/decompose`,
      {
        title: epicTitle.value.trim(),
        prd: prd.value,
        credential_id: credentialId.value,
      },
    );
    emit('started');
    onClose();
  } catch (e) {
    const msg =
      (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
        ?.message ?? t('epicDecomposition.createFailed');
    error.value = msg;
    toast.error(msg);
  } finally {
    isSubmitting.value = false;
  }
}

function reset(): void {
  epicTitle.value = '';
  prd.value = '';
  credentialId.value = '';
  error.value = null;
  isSubmitting.value = false;
}

function onClose(): void {
  emit('update:modelValue', false);
}

// Reset + preload credentials (auto-selecting the default) whenever the modal opens.
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    reset();
    if (credentialsStore.credentials.length === 0) {
      await credentialsStore.fetchCredentials();
    }
    if (!credentialId.value && credentialsStore.defaultCredential) {
      credentialId.value = credentialsStore.defaultCredential.id;
    }
  },
);
</script>

<style scoped>
.epic-decomp {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: min(560px, 80vw);
}
.ed-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary, #8b8ca0);
}
.ed-input,
.ed-textarea {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-color, #2a2d3a);
  border-radius: 8px;
  background: var(--bg-input, #1a1b26);
  color: var(--text-primary, #e6e6ef);
  font-size: 0.9rem;
}
.ed-textarea {
  resize: vertical;
  min-height: 9rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
}
.ed-input:focus,
.ed-textarea:focus {
  outline: none;
  border-color: var(--accent-purple, #a855f7);
}
.ed-charcount {
  margin-top: -0.3rem;
  text-align: right;
  font-size: 0.7rem;
  color: var(--text-muted, #6b6d80);
  font-variant-numeric: tabular-nums;
}
.ed-charcount--over {
  color: var(--color-error, #ef4444);
}
.ed-hint {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--text-muted, #6b6d80);
}
.ed-error {
  color: var(--color-error, #ef4444);
  font-size: 0.8rem;
  margin: 0;
}
.ed-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.ed-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.ed-btn--ghost {
  background: transparent;
  border-color: var(--border-color, #2a2d3a);
  color: var(--text-secondary, #8b8ca0);
}
.ed-btn--primary {
  background: var(--accent-purple, #a855f7);
  color: #fff;
}
.ed-btn--primary:disabled {
  opacity: 0.5;
  cursor: default;
}
.ed-spinner {
  width: 0.8rem;
  height: 0.8rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: ed-spin 0.7s linear infinite;
}
@keyframes ed-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ed-spinner {
    animation: none;
  }
}
</style>
