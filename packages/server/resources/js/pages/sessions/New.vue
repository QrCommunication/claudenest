<template>
  <div class="new-session-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <h1>{{ $t('sessions.create.page_title') }}</h1>
    </div>
    <div class="form-container">
      <div class="card">
        <h2 class="card-title">{{ $t('sessions.create.subtitle') }}</h2>
        <p class="card-desc">
          {{ $t('sessions.create.machine_description') }}
          <strong>{{ machineName }}</strong>
        </p>

        <div class="form-group">
          <label for="machine_select">{{ $t('sessions.details.machine') }}</label>
          <select
            id="machine_select"
            v-model="selectedMachineId"
            :disabled="isFetchingMachines"
          >
            <option value="" disabled>
              {{ isFetchingMachines ? $t('sessions.create.loading_machines') : $t('sessions.create.select_machine_placeholder') }}
            </option>
            <option
              v-for="machine in availableMachines"
              :key="machine.id"
              :value="machine.id"
            >
              {{ machine.name }}
              <template v-if="machine.status !== 'online'">
                ({{ machine.status }})
              </template>
            </option>
          </select>
          <p v-if="noOnlineMachines && !isFetchingMachines" class="field-warning">
            {{ $t('sessions.create.no_online_machines') }}
          </p>
        </div>

        <div class="form-group">
          <label for="shared_project_select">{{ $t('sessions.create.shared_project') }}</label>
          <select
            id="shared_project_select"
            v-model="selectedProjectId"
            :disabled="!selectedMachineId || isFetchingProjects"
          >
            <option value="">
              {{ isFetchingProjects ? $t('sessions.create.loading_projects') : $t('sessions.create.shared_project_placeholder') }}
            </option>
            <option
              v-for="project in machineProjects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }} — {{ project.project_path }}
            </option>
          </select>
          <p v-if="projectsLoadFailed" class="field-warning">
            {{ $t('sessions.create.failed_load_projects') }}
          </p>
          <p
            v-else-if="selectedMachineId && !isFetchingProjects && machineProjects.length === 0"
            class="field-hint"
          >
            {{ $t('sessions.create.no_projects_on_machine') }}
          </p>
        </div>

        <div class="form-group">
          <label>{{ $t('sessions.create.session_mode') }}</label>
          <div class="mode-options">
            <label class="mode-option" :class="{ 'mode-selected': mode === 'interactive' }">
              <input type="radio" value="interactive" v-model="mode" />
              <div>
                <span class="mode-label">{{ $t('sessions.mode.interactive') }}</span>
                <span class="mode-desc">{{ $t('sessions.create.mode_interactive_desc') }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="permission_mode">{{ $t('sessions.create.permission_mode') }}</label>
          <select id="permission_mode" v-model="permissionMode">
            <option value="default">{{ $t('sessions.create.permission_default') }}</option>
            <option value="acceptEdits">{{ $t('sessions.create.permission_accept_edits') }}</option>
            <option value="plan">{{ $t('sessions.create.permission_plan') }}</option>
            <option value="bypassPermissions">{{ $t('sessions.create.permission_bypass') }}</option>
          </select>
          <p v-if="permissionMode === 'bypassPermissions'" class="bypass-warning">
            ⚠ {{ $t('sessions.create.permission_bypass_warning') }}
          </p>
          <p v-else class="field-hint">
            {{ permissionModeDescription }}
          </p>
        </div>

        <div class="form-group">
          <div class="path-header">
            <label>{{ $t('sessions.create.project_path_optional') }}</label>
            <button
              v-if="isSelectedMachineOnline && !isPathLocked"
              class="toggle-input-btn"
              @click="useManualInput = !useManualInput"
            >
              {{ useManualInput ? $t('sessions.create.browse_files') : $t('sessions.create.manual_input') }}
            </button>
          </div>

          <!-- Path locked by the selected shared project -->
          <div v-if="isPathLocked">
            <input
              id="project_path"
              :value="projectPath"
              type="text"
              readonly
              class="locked-input"
            />
            <p class="field-hint">
              {{ $t('sessions.create.path_locked_hint') }}
            </p>
          </div>

          <!-- Manual text input -->
          <div v-else-if="useManualInput || !isSelectedMachineOnline">
            <input
              id="project_path"
              v-model="projectPath"
              type="text"
              :placeholder="$t('sessions.create.project_path_placeholder')"
            />
            <p v-if="isSelectedMachineOnline" class="field-hint">
              {{ $t('sessions.create.or_browse') }}
            </p>
          </div>

          <!-- Remote file tree -->
          <RemoteFileTree
            v-else-if="selectedMachineId && isSelectedMachineOnline"
            :machine-id="selectedMachineId"
            @select="onPathSelected"
          />
        </div>

        <div class="form-group">
          <label for="credential_select">{{ $t('sessions.create.credential') }}</label>
          <select
            id="credential_select"
            v-model="selectedCredentialId"
          >
            <option value="">{{ $t('sessions.create.credential_default') }}</option>
            <option
              v-for="c in credentialsStore.credentials"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }} ({{ c.auth_type }})
              <template v-if="c.masked_key"> — {{ c.masked_key }}</template>
              <template v-if="c.is_default"> ★</template>
            </option>
          </select>
          <p v-if="credentialsStore.expiredCredentials.length > 0" class="field-warning">
            {{ $t('sessions.create.expired_credentials_warning', { count: credentialsStore.expiredCredentials.length }) }}
          </p>
        </div>

        <div class="form-group">
          <label for="prompt">
            {{ $t('sessions.create.initial_prompt') }}
            {{ $t('sessions.create.prompt_optional') }}
          </label>
          <textarea
            id="prompt"
            v-model="initialPrompt"
            rows="4"
            :placeholder="$t('sessions.create.initial_prompt_placeholder')"
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" @click="$router.back()">{{ $t('common.cancel') }}</button>
          <button
            class="btn-primary"
            @click="startSession"
            :disabled="isStarting || !canStart"
          >
            <span v-if="isStarting" class="spinner"></span>
            {{ isStarting ? $t('sessions.create.starting') : $t('sessions.create.start_session') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSessionsStore } from '@/stores/sessions';
import { useMachinesStore } from '@/stores/machines';
import { useCredentialsStore } from '@/stores/credentials';
import { useProjectsStore } from '@/stores/projects';
import { useToast } from '@/composables/useToast';
import RemoteFileTree from '@/components/sessions/RemoteFileTree.vue';
import type { PermissionMode, SessionMode, SharedProject } from '@/types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const sessionsStore = useSessionsStore();
const machinesStore = useMachinesStore();
const credentialsStore = useCredentialsStore();
const projectsStore = useProjectsStore();
const toast = useToast();

const mode = ref<SessionMode>('interactive');
const permissionMode = ref<PermissionMode>('default');
const projectPath = ref('');
const initialPrompt = ref('');
const selectedCredentialId = ref('');
const isStarting = ref(false);
const isFetchingMachines = ref(false);
const selectedMachineId = ref('');
const useManualInput = ref(false);
const selectedProjectId = ref('');
const isFetchingProjects = ref(false);
const projectsLoadFailed = ref(false);
const manualPathBackup = ref('');

const availableMachines = computed(() => machinesStore.machines);

const machineProjects = computed<SharedProject[]>(() =>
  projectsStore.projects.filter(p => p.machine_id === selectedMachineId.value)
);

const selectedProject = computed<SharedProject | null>(() =>
  machineProjects.value.find(p => p.id === selectedProjectId.value) ?? null
);

const isPathLocked = computed(() => selectedProject.value !== null);

const permissionModeDescription = computed(() => {
  const descriptionKeys: Record<PermissionMode, string> = {
    default: 'sessions.create.permission_default_desc',
    acceptEdits: 'sessions.create.permission_accept_edits_desc',
    plan: 'sessions.create.permission_plan_desc',
    bypassPermissions: 'sessions.create.permission_bypass_desc',
  };
  return t(descriptionKeys[permissionMode.value]);
});

const isSelectedMachineOnline = computed(() => {
  if (!selectedMachineId.value) return false;
  const machine = availableMachines.value.find(m => m.id === selectedMachineId.value);
  return machine?.status === 'online';
});

const noOnlineMachines = computed(() =>
  availableMachines.value.length > 0 &&
  availableMachines.value.every(m => m.status !== 'online')
);

const machineName = computed(() => {
  if (!selectedMachineId.value) return t('sessions.create.none_selected');
  const machine = availableMachines.value.find(m => m.id === selectedMachineId.value);
  return machine ? machine.name : t('sessions.create.none_selected');
});

const canStart = computed(() => selectedMachineId.value !== '');

watch(selectedMachineId, async (machineId) => {
  selectedProjectId.value = '';
  projectsLoadFailed.value = false;

  if (!machineId) return;

  isFetchingProjects.value = true;
  try {
    await projectsStore.fetchProjects(machineId);
  } catch {
    projectsLoadFailed.value = true;
  } finally {
    isFetchingProjects.value = false;
  }
});

watch(selectedProject, (project, previous) => {
  if (project) {
    if (!previous) {
      manualPathBackup.value = projectPath.value;
    }
    projectPath.value = project.project_path;
  } else if (previous) {
    projectPath.value = manualPathBackup.value;
  }
});

onMounted(async () => {
  isFetchingMachines.value = true;
  try {
    await Promise.all([
      machinesStore.fetchMachines(),
      credentialsStore.fetchCredentials(),
    ]);

    const queryMachineId = route.query.machine as string | undefined;
    if (queryMachineId) {
      const exists = availableMachines.value.some(m => m.id === queryMachineId);
      if (exists) {
        selectedMachineId.value = queryMachineId;
      }
    }

    if (!selectedMachineId.value && availableMachines.value.length === 1) {
      selectedMachineId.value = availableMachines.value[0].id;
    }

    // Auto-select default credential
    if (credentialsStore.defaultCredential) {
      selectedCredentialId.value = credentialsStore.defaultCredential.id;
    }
  } catch {
    toast.error(t('sessions.create.failed_load_machines'), t('sessions.create.failed_load_machines_desc'));
  } finally {
    isFetchingMachines.value = false;
  }
});

function onPathSelected(path: string): void {
  projectPath.value = path;
}

async function startSession() {
  if (!canStart.value) return;

  isStarting.value = true;
  try {
    const session = await sessionsStore.createSession(selectedMachineId.value, {
      mode: mode.value,
      project_path: projectPath.value.trim() || undefined,
      shared_project_id: selectedProjectId.value || undefined,
      permission_mode: permissionMode.value,
      initial_prompt: initialPrompt.value.trim() || undefined,
      credential_id: selectedCredentialId.value || undefined,
    });

    toast.success(t('sessions.create.session_started'), t('sessions.create.session_created_on', { machine: machineName.value }));

    router.push({ name: 'session.terminal', params: { id: session.id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    toast.error(t('sessions.create.failed_start'), message);
  } finally {
    isStarting.value = false;
  }
}
</script>

<style scoped>
@reference "../../../css/tailwind.css";
.new-session-page {
  @apply p-6;
}

.page-header {
  @apply flex items-center gap-4 mb-8;
}

.back-btn {
  @apply p-2 rounded-lg text-skin-secondary hover:text-skin-primary hover:bg-surface-2 transition-colors;
}

.back-btn svg {
  @apply w-6 h-6;
}

.page-header h1 {
  @apply text-2xl font-bold text-skin-primary;
}

.form-container {
  @apply max-w-2xl;
}

.card {
  @apply bg-surface-2 rounded-xl border border-skin p-6;
}

.card-title {
  @apply text-xl font-semibold text-skin-primary mb-2;
}

.card-desc {
  @apply text-skin-secondary mb-6;
}

.form-group {
  @apply mb-6;
}

.form-group label {
  @apply block text-sm font-medium text-skin-primary mb-2;
}

.form-group input,
.form-group textarea,
.form-group select {
  @apply w-full px-3 py-2 bg-surface-3 border border-skin rounded-lg text-skin-primary;
  @apply focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple;
  @apply transition-colors;
}

.form-group select {
  @apply appearance-none cursor-pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.form-group select:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.form-group textarea {
  @apply resize-none;
}

.field-warning {
  @apply text-xs text-yellow-400 mt-1;
}

.field-hint {
  @apply text-xs text-skin-secondary mt-1;
}

.form-group .locked-input {
  @apply opacity-70 cursor-not-allowed bg-surface-2;
}

.bypass-warning {
  @apply text-xs text-red-400 mt-2 p-2 rounded-lg bg-red-400/10 border border-red-400/30;
}

.path-header {
  @apply flex items-center justify-between mb-2;
}

.path-header label {
  @apply mb-0;
}

.toggle-input-btn {
  @apply text-xs text-brand-purple hover:text-brand-cyan transition-colors;
}

.mode-options {
  @apply space-y-2;
}

.mode-option {
  @apply flex items-start gap-3 p-3 rounded-lg bg-surface-3 cursor-pointer;
  @apply hover:bg-surface-4 transition-colors border border-transparent;
}

.mode-option.mode-selected {
  @apply border-brand-purple/50 bg-brand-purple/5;
}

.mode-option input {
  @apply mt-1;
}

.mode-label {
  @apply block text-sm font-medium text-skin-primary;
}

.mode-desc {
  @apply block text-xs text-skin-secondary;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-skin;
}

.btn-secondary {
  @apply px-4 py-2 rounded-lg font-medium text-skin-primary hover:text-skin-primary transition-colors;
}

.btn-primary {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white;
  @apply bg-gradient-to-r from-brand-purple to-brand-indigo;
  @apply hover:opacity-90 transition-opacity;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.spinner {
  @apply w-4 h-4 border-2 border-white/30 border-t-white rounded-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
