<template>
  <Modal
    :model-value="modelValue"
    :title="t('projectRecovery.title')"
    size="lg"
    :close-on-backdrop="!isRecovering"
    :close-on-esc="!isRecovering"
    @update:model-value="onModalToggle"
  >
    <div class="pr-body">
      <p class="pr-question">{{ t('projectRecovery.question') }}</p>

      <div class="pr-meta">
        <span class="pr-name">{{ name }}</span>
        <span v-if="formattedArchivedAt" class="pr-archived-at">
          {{ t('projectRecovery.archivedAt', { date: formattedArchivedAt }) }}
        </span>
      </div>

      <div class="pr-preview">
        <span class="pr-preview-label">{{ t('projectRecovery.contextPreviewLabel') }}</span>
        <p v-if="contextPreview" class="pr-preview-text">{{ contextPreview }}</p>
        <p v-else class="pr-preview-empty">{{ t('projectRecovery.noContext') }}</p>
      </div>

      <p v-if="errorMessage" class="pr-error" role="alert">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <div class="pr-actions">
        <button
          type="button"
          class="pr-btn pr-btn-ghost"
          :disabled="isRecovering"
          @click="onCreateNew"
        >
          {{ t('projectRecovery.createNew') }}
        </button>
        <button
          type="button"
          class="pr-btn pr-btn-primary"
          :disabled="isRecovering"
          @click="onRecover"
        >
          {{ isRecovering ? t('projectRecovery.recovering') : t('projectRecovery.recover') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/common/Modal.vue';
import { useProjectsStore } from '@/stores/projects';
import { useToast } from '@/composables/useToast';
import type { SharedProject } from '@/types';

interface Props {
  /** Controls visibility (v-model). */
  modelValue: boolean;
  /** The archived project's id (from the `recoverable` 409 payload). */
  archivedProjectId: string;
  /** The archived project's name. */
  name: string;
  /** ISO8601 timestamp of when the project was archived. */
  archivedAt?: string | null;
  /** Short preview of the archived context (backend `context_preview`). */
  contextPreview?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  archivedAt: null,
  contextPreview: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  /** Emitted after the archived project was successfully recovered. */
  recovered: [project: SharedProject];
  /** Emitted when the user declines recovery and wants a fresh project instead. */
  'create-new': [];
}>();

const { t } = useI18n();
const projectsStore = useProjectsStore();
const toast = useToast();

const isRecovering = ref(false);
const errorMessage = ref<string | null>(null);

const formattedArchivedAt = computed(() => {
  if (!props.archivedAt) {
    return null;
  }
  const date = new Date(props.archivedAt);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
});

function close(): void {
  emit('update:modelValue', false);
}

// Backdrop/Esc close is blocked while recovering; ignore the toggle in that case.
function onModalToggle(value: boolean): void {
  if (isRecovering.value) {
    return;
  }
  emit('update:modelValue', value);
}

async function onRecover(): Promise<void> {
  if (isRecovering.value) {
    return;
  }
  isRecovering.value = true;
  errorMessage.value = null;

  try {
    const project = await projectsStore.recoverProject(props.archivedProjectId);
    toast.success(t('projectRecovery.toastRecovered'));
    emit('recovered', project);
    close();
  } catch (err) {
    const message = err instanceof Error ? err.message : t('projectRecovery.toastRecoverFailed');
    errorMessage.value = message;
    toast.error(t('projectRecovery.toastRecoverFailed'), message);
  } finally {
    isRecovering.value = false;
  }
}

function onCreateNew(): void {
  if (isRecovering.value) {
    return;
  }
  emit('create-new');
  close();
}
</script>

<style scoped>
.pr-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pr-question {
  font-size: 0.95rem;
  color: var(--text-secondary, var(--color-text-secondary));
  line-height: 1.55;
}

.pr-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pr-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, var(--color-text-primary));
}

.pr-archived-at {
  font-size: 0.78rem;
  color: var(--text-muted, var(--color-text-muted));
}

.pr-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 1rem;
  background: var(--surface-2, var(--bg-secondary));
  border: 1px solid var(--border-color, var(--color-border));
  border-radius: 0.6rem;
}

.pr-preview-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted, var(--color-text-muted));
}

.pr-preview-text {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-secondary, var(--color-text-secondary));
  white-space: pre-wrap;
}

.pr-preview-empty {
  font-size: 0.85rem;
  font-style: italic;
  color: var(--text-muted, var(--color-text-muted));
}

.pr-error {
  font-size: 0.82rem;
  color: var(--status-error, #ef4444);
}

.pr-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.pr-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}

.pr-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pr-btn-ghost {
  color: var(--text-primary, var(--color-text-primary));
  background: var(--surface-2, var(--bg-secondary));
  border: 1px solid var(--border-color, var(--color-border));
}

.pr-btn-ghost:not(:disabled):hover {
  border-color: var(--border-hover, var(--accent-purple));
}

.pr-btn-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.pr-btn-primary:not(:disabled):hover {
  filter: brightness(1.05);
}
</style>
