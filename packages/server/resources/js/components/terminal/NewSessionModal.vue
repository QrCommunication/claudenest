<template>
  <Transition name="fade">
    <div v-if="props.modelValue" class="modal-overlay" @click.self="handleClose">
      <Transition name="scale">
        <div v-if="props.modelValue" class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">
              <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke-width="2"/>
                <path d="M6 8l4 4-4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 16h6" stroke-width="2" stroke-linecap="round"/>
              </svg>
              New Session
            </h2>
            <button class="close-btn" @click="handleClose">
              <svg class="icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          
          <form class="modal-body" @submit.prevent="handleSubmit">
            <!-- Machine Selection -->
            <div class="form-group">
              <label class="form-label">
                Machine
                <span class="required">*</span>
              </label>
              <select 
                v-model="form.machineId" 
                class="form-select"
                :class="{ 'is-invalid': errors.machineId }"
                required
              >
                <option value="" disabled>Select a machine</option>
                <option 
                  v-for="machine in machines" 
                  :key="machine.id" 
                  :value="machine.id"
                  :disabled="machine.status !== 'online'"
                >
                  {{ machine.name }} {{ machine.status !== 'online' ? '(Offline)' : '' }}
                </option>
              </select>
              <span v-if="errors.machineId" class="error-text">{{ errors.machineId }}</span>
            </div>
            
            <!-- Project Path -->
            <div class="form-group">
              <label class="form-label">Project Path</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <input
                  v-model="form.projectPath"
                  type="text"
                  class="form-input"
                  placeholder="/path/to/project"
                />
              </div>
              <span class="help-text">Leave empty to use default working directory</span>
            </div>
            
            <!-- Mode Selection -->
            <div class="form-group">
              <label class="form-label">
                Mode
                <span class="required">*</span>
              </label>
              <div class="mode-options">
                <label 
                  v-for="mode in modes" 
                  :key="mode.value"
                  class="mode-option"
                  :class="{ active: form.mode === mode.value }"
                >
                  <input
                    v-model="form.mode"
                    type="radio"
                    :value="mode.value"
                    class="mode-radio"
                  />
                  <span class="mode-icon">{{ mode.icon }}</span>
                  <span class="mode-info">
                    <span class="mode-name">{{ mode.label }}</span>
                    <span class="mode-description">{{ mode.description }}</span>
                  </span>
                </label>
              </div>
            </div>
            
            <!-- Initial Prompt -->
            <div class="form-group">
              <label class="form-label">Initial Prompt</label>
              <textarea
                v-model="form.initialPrompt"
                class="form-textarea"
                rows="3"
                placeholder="Enter initial prompt or instructions (optional)..."
              ></textarea>
              <span class="help-text">Optional prompt to send when the session starts</span>
            </div>
            
            <!-- Terminal Size -->
            <div class="form-group">
              <label class="form-label">Terminal Size</label>
              <div class="size-inputs">
                <div class="size-input-group">
                  <label class="size-label">Columns</label>
                  <input
                    v-model.number="form.ptySize.cols"
                    type="number"
                    class="form-input size-input"
                    min="20"
                    max="500"
                  />
                </div>
                <span class="size-separator">×</span>
                <div class="size-input-group">
                  <label class="size-label">Rows</label>
                  <input
                    v-model.number="form.ptySize.rows"
                    type="number"
                    class="form-input size-input"
                    min="10"
                    max="200"
                  />
                </div>
              </div>
            </div>
          </form>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleClose">
              Cancel
            </button>
            <button 
              class="btn btn-primary" 
              :disabled="isSubmitting || !isValid"
              @click="handleSubmit"
            >
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-else>Create Session</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { SessionMode, Machine } from '@/types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  modelValue: boolean;
  machines: Machine[];
  defaultMachineId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: {
    machineId: string;
    projectPath: string;
    mode: SessionMode;
    initialPrompt: string;
    ptySize: { cols: number; rows: number };
  }];
}>();

// ============================================================================
// Form State
// ============================================================================

interface FormState {
  machineId: string;
  projectPath: string;
  mode: SessionMode;
  initialPrompt: string;
  ptySize: { cols: number; rows: number };
}

const form = reactive<FormState>({
  machineId: '',
  projectPath: '',
  mode: 'interactive',
  initialPrompt: '',
  ptySize: { cols: 120, rows: 40 },
});

const errors = reactive<Partial<Record<keyof FormState, string>>>({});
const isSubmitting = ref(false);

// ============================================================================
// Mode Options
// ============================================================================

const modes = [
  {
    value: 'interactive' as SessionMode,
    label: 'Interactive',
    icon: '⌨️',
    description: 'Full terminal with user input',
  },
  {
    value: 'headless' as SessionMode,
    label: 'Headless',
    icon: '⚙️',
    description: 'Background session, no input needed',
  },
  {
    value: 'oneshot' as SessionMode,
    label: 'One-shot',
    icon: '⚡',
    description: 'Single command execution',
  },
];

// ============================================================================
// Computed
// ============================================================================

const isValid = computed(() => {
  return form.machineId && form.mode;
});

// ============================================================================
// Methods
// ============================================================================

function resetForm(): void {
  form.machineId = props.defaultMachineId || '';
  form.projectPath = '';
  form.mode = 'interactive';
  form.initialPrompt = '';
  form.ptySize = { cols: 120, rows: 40 };
  
  Object.keys(errors).forEach((key) => {
    delete errors[key as keyof FormState];
  });
}

function handleClose(): void {
  emit('update:modelValue', false);
  resetForm();
}

async function handleSubmit(): Promise<void> {
  if (!isValid.value) return;
  
  isSubmitting.value = true;
  
  try {
    emit('submit', {
      machineId: form.machineId,
      projectPath: form.projectPath,
      mode: form.mode,
      initialPrompt: form.initialPrompt,
      ptySize: form.ptySize,
    });
    
    handleClose();
  } finally {
    isSubmitting.value = false;
  }
}

// ============================================================================
// Watchers
// ============================================================================

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm();
  }
});

watch(() => props.defaultMachineId, (machineId) => {
  if (machineId && !form.machineId) {
    form.machineId = machineId;
  }
}, { immediate: true });
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 15, 26, 0.8);
  backdrop-filter: blur(4px);
  z-index: 1000;
  padding: 24px;
}

/* Modal Container */
.modal-container {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  background: linear-gradient(135deg, var(--bg-secondary, var(--surface-2)), var(--bg-card, var(--surface-3)));
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  width: 24px;
  height: 24px;
  color: var(--accent-purple, #a855f7);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: color-mix(in srgb, var(--status-error, #ef4444) 10%, transparent);
  color: #ef4444;
}

.icon {
  width: 20px;
  height: 20px;
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Form Groups */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

/* Form Inputs */
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  background: color-mix(in srgb, var(--bg-secondary, var(--surface-2)) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--accent-purple, #a855f7);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #565f89;
}

.form-input.is-invalid,
.form-select.is-invalid {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: 'JetBrains Mono', monospace;
}

/* Input with Icon */
.input-wrapper {
  position: relative;
}

.input-wrapper .form-input {
  padding-left: 40px;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #565f89;
}

/* Help Text */
.help-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #565f89;
}

.error-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #ef4444;
}

/* Mode Options */
.mode-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--bg-secondary, var(--surface-2)) 50%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
}

.mode-option.active {
  border-color: var(--accent-purple, #a855f7);
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

.mode-radio {
  display: none;
}

.mode-icon {
  font-size: 20px;
}

.mode-info {
  display: flex;
  flex-direction: column;
}

.mode-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.mode-description {
  font-size: 12px;
  color: #565f89;
}

/* Size Inputs */
.size-inputs {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.size-input-group {
  flex: 1;
}

.size-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  color: #565f89;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.size-input {
  text-align: center;
}

.size-separator {
  padding-bottom: 10px;
  font-size: 14px;
  color: #565f89;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  background: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 40%, transparent);
  border-top: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
}

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-secondary {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 10%, transparent);
  color: var(--text-secondary);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
}

.btn-secondary:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--text-primary);
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
