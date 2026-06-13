<template>
  <Modal :model-value="modelValue" :title="t('epicDecomposition.title')" @update:model-value="onClose">
    <div class="epic-decomp">
      <!-- Step 1: epic title -->
      <label class="ed-label" for="ed-title">{{ t('epicDecomposition.epicName') }}</label>
      <input
        id="ed-title"
        v-model="epicTitle"
        class="ed-input"
        :placeholder="t('epicDecomposition.epicNamePlaceholder')"
        maxlength="255"
      />

      <!-- Step 2: PRD + credential + decompose (reuses the project flow) -->
      <PrdInput
        v-model="prd"
        :credential-id="credentialId"
        :is-decomposing="isDecomposing"
        :error="decompositionError"
        @update:credential-id="(v) => (credentialId = v)"
        @decompose="onDecompose"
      />

      <!-- Step 3: live decomposition output -->
      <div v-if="isDecomposing || decompositionOutput" class="ed-progress">
        <div class="ed-progress-head">
          <span v-if="isDecomposing" class="ed-spinner">↻</span>
          {{ isDecomposing ? t('epicDecomposition.decomposing') : t('epicDecomposition.decomposed') }}
        </div>
        <pre v-if="decompositionOutput" class="ed-output">{{ decompositionOutput.slice(-1200) }}</pre>
      </div>

      <!-- Step 4: plan summary + confirm -->
      <div v-if="masterPlan" class="ed-summary">
        <p class="ed-summary-line">
          <strong>{{ masterPlan.waves.length }}</strong> {{ t('epicDecomposition.sprints') }} ·
          <strong>{{ taskCount }}</strong> {{ t('epicDecomposition.tasks') }}
        </p>
        <ul class="ed-waves">
          <li v-for="w in masterPlan.waves" :key="w.id" class="ed-wave">
            <span class="ed-wave-name">{{ w.name }}</span>
            <span class="ed-wave-count">{{ w.tasks.length }}</span>
          </li>
        </ul>
      </div>

      <p v-if="createError" class="ed-error">{{ createError }}</p>
    </div>

    <template #footer>
      <div class="ed-actions">
        <button class="ed-btn ed-btn--ghost" @click="onClose">{{ t('common.cancel') }}</button>
        <button
          class="ed-btn ed-btn--primary"
          :disabled="!canCreate"
          @click="onCreateEpic"
        >
          {{ isCreating ? t('epicDecomposition.creating') : t('epicDecomposition.createEpic') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/common/Modal.vue';
import PrdInput from '@/components/projects/PrdInput.vue';
import { useDecomposition } from '@/composables/useDecomposition';
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
  created: [];
}>();

const { t } = useI18n();
const toast = useToast();
const credentialsStore = useCredentialsStore();

const {
  masterPlan,
  isDecomposing,
  decompositionOutput,
  decompositionError,
  startDecomposition,
  cleanup,
} = useDecomposition();

const epicTitle = ref('');
const prd = ref('');
const credentialId = ref('');
const isCreating = ref(false);
const createError = ref<string | null>(null);

const taskCount = computed(() =>
  (masterPlan.value?.waves ?? []).reduce((n, w) => n + w.tasks.length, 0),
);

const canCreate = computed(
  () => !!masterPlan.value && epicTitle.value.trim().length > 0 && !isCreating.value,
);

function onDecompose(): void {
  createError.value = null;
  void startDecomposition(props.projectId, prd.value, credentialId.value);
}

async function onCreateEpic(): Promise<void> {
  if (!canCreate.value) return;
  isCreating.value = true;
  createError.value = null;
  try {
    await api.post<ApiResponse<{ created: number; sprints: number }>>(
      `/projects/${props.projectId}/epics/from-plan`,
      { title: epicTitle.value.trim(), description: masterPlan.value?.prd_summary ?? undefined },
    );
    toast.success(t('epicDecomposition.created', { name: epicTitle.value.trim() }));
    emit('created');
    onClose();
  } catch (e) {
    const msg =
      (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
        ?.message ?? t('epicDecomposition.createFailed');
    createError.value = msg;
    toast.error(msg);
  } finally {
    isCreating.value = false;
  }
}

function reset(): void {
  epicTitle.value = '';
  prd.value = '';
  createError.value = null;
  masterPlan.value = null;
  decompositionOutput.value = '';
  decompositionError.value = null;
}

function onClose(): void {
  cleanup();
  emit('update:modelValue', false);
}

// Reset + preload credentials whenever the modal opens.
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reset();
      if (credentialsStore.credentials.length === 0) void credentialsStore.fetchCredentials();
    }
  },
);
</script>

<style scoped>
.epic-decomp {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  min-width: min(560px, 80vw);
}
.ed-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary, #8b8ca0);
}
.ed-input {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border-color, #2a2d3a);
  border-radius: 8px;
  background: var(--bg-input, #1a1b26);
  color: var(--text-primary, #e6e6ef);
  font-size: 0.9rem;
}
.ed-input:focus {
  outline: none;
  border-color: var(--accent-purple, #a855f7);
}
.ed-progress {
  border: 1px solid var(--border-color, #2a2d3a);
  border-radius: 8px;
  padding: 0.6rem;
  background: var(--bg-secondary, #14151f);
}
.ed-progress-head {
  font-size: 0.8rem;
  color: var(--text-secondary, #8b8ca0);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.ed-spinner {
  display: inline-block;
  animation: ed-spin 0.8s linear infinite;
}
@keyframes ed-spin {
  to {
    transform: rotate(360deg);
  }
}
.ed-output {
  margin: 0.5rem 0 0;
  max-height: 160px;
  overflow: auto;
  font-size: 0.72rem;
  white-space: pre-wrap;
  color: var(--text-muted, #6b6d80);
}
.ed-summary {
  border: 1px solid var(--accent-purple, #a855f7);
  border-radius: 8px;
  padding: 0.7rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 8%, transparent);
}
.ed-summary-line {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: var(--text-primary, #e6e6ef);
}
.ed-waves {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.ed-wave {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary, #8b8ca0);
}
.ed-wave-count {
  font-variant-numeric: tabular-nums;
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
</style>
