<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Button variant="ghost" @click="goBack">
          <ArrowLeftIcon class="w-4 h-4" />
          {{ t('skillsSkilleditor.back') }}
        </Button>
        <div>
          <h1 class="text-2xl font-bold text-skin-primary">
            {{ isEditing ? t('skillsSkilleditor.editSkill') : t('skillsSkilleditor.createSkill') }}
          </h1>
          <p class="text-skin-secondary mt-1">
            {{ isEditing ? t('skillsSkilleditor.editSubtitle') : t('skillsSkilleditor.createSubtitle') }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          @click="togglePreview"
          :class="{ 'bg-brand-purple/20 text-brand-purple': showPreview }"
        >
          <EyeIcon class="w-4 h-4" />
          {{ showPreview ? t('skillsSkilleditor.hidePreview') : t('skillsSkilleditor.showPreview') }}
        </Button>
        <Button
          variant="error"
          v-if="isEditing"
          :loading="skillsStore.isDeleting"
          @click="confirmDelete"
        >
          <TrashIcon class="w-4 h-4" />
          {{ t('skillsSkilleditor.delete') }}
        </Button>
        <Button
          variant="primary"
          :loading="isSaving"
          @click="saveSkill"
        >
          <SaveIcon class="w-4 h-4" />
          {{ t('skillsSkilleditor.save') }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" :class="{ 'lg:grid-cols-1': !showPreview }">
      <!-- Editor -->
      <div class="space-y-4">
        <!-- Frontmatter Fields -->
        <Card :title="t('skillsSkilleditor.skillMetadata')">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              v-model="skillForm.name"
              :label="t('skillsSkilleditor.name')"
              placeholder="my-skill-name"
              required
            />
            <Input
              v-model="skillForm.display_name"
              :label="t('skillsSkilleditor.displayName')"
              :placeholder="t('skillsSkilleditor.displayNamePlaceholder')"
            />
            <Input
              v-model="skillForm.version"
              :label="t('skillsSkilleditor.version')"
              placeholder="1.0.0"
            />
            <Select
              v-model="skillForm.category"
              :label="t('skillsSkilleditor.category')"
              :options="categoryOptions"
              required
            />
            <Input
              v-model="skillForm.author"
              :label="t('skillsSkilleditor.author')"
              :placeholder="t('skillsSkilleditor.authorPlaceholder')"
            />
            <Input
              v-model="skillForm.path"
              :label="t('skillsSkilleditor.filePath')"
              placeholder="path/to/skill.md"
              required
              :disabled="isEditing"
            />
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-skin-primary mb-2">{{ t('skillsSkilleditor.description') }}</label>
            <textarea
              v-model="skillForm.description"
              rows="2"
              :placeholder="t('skillsSkilleditor.descriptionPlaceholder')"
              class="w-full bg-surface-1 border border-skin rounded-lg px-3 py-2 text-skin-primary text-sm focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-skin-primary mb-2">{{ t('skillsSkilleditor.tagsLabel') }}</label>
            <Input
              v-model="tagsInput"
              :placeholder="t('skillsSkilleditor.tagsPlaceholder')"
            />
          </div>
        </Card>

        <!-- Content Editor -->
        <Card :title="t('skillsSkilleditor.content')" class-name="flex-1">
          <MarkdownEditor
            v-model="skillForm.content"
            :rows="24"
            :placeholder="t('skillsSkilleditor.contentPlaceholder')"
          />
        </Card>
      </div>

      <!-- Preview -->
      <div v-if="showPreview" class="space-y-4">
        <Card :title="t('skillsSkilleditor.preview')" class-name="h-full">
          <SkillPreview
            :name="skillForm.name"
            :display-name="skillForm.display_name"
            :description="skillForm.description"
            :version="skillForm.version"
            :category="skillForm.category"
            :author="skillForm.author"
            :tags="parsedTags"
            :content="skillForm.content"
          />
        </Card>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal">
      <template #title>
        <div class="flex items-center gap-2 text-red-400">
          <AlertTriangleIcon class="w-5 h-5" />
          {{ t('skillsSkilleditor.deleteSkill') }}
        </div>
      </template>

      <p class="text-skin-secondary">
        {{ t('skillsSkilleditor.deleteConfirmPrefix') }} <strong class="text-skin-primary">{{ skillForm.name }}</strong>{{ t('skillsSkilleditor.deleteConfirmSuffix') }}
        {{ t('skillsSkilleditor.deleteConfirmUndo') }}
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="ghost" @click="showDeleteModal = false">
            {{ t('skillsSkilleditor.cancel') }}
          </Button>
          <Button
            variant="error"
            :loading="skillsStore.isDeleting"
            @click="deleteSkill"
          >
            {{ t('skillsSkilleditor.deleteSkill') }}
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSkillsStore } from '@/stores/skills';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import MarkdownEditor from '@/components/skills/MarkdownEditor.vue';
import SkillPreview from '@/components/skills/SkillPreview.vue';
import {
  ArrowLeftIcon,
  EyeIcon,
  SaveIcon,
  TrashIcon,
  AlertTriangleIcon,
} from 'lucide-vue-next';
import type { SkillCategory } from '@/types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const skillsStore = useSkillsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const isEditing = computed(() => route.name === 'skills.edit');
const showPreview = ref(true);
const showDeleteModal = ref(false);
const isSaving = ref(false);
const tagsInput = ref('');

const skillForm = ref({
  name: '',
  display_name: '',
  description: '',
  version: '1.0.0',
  category: 'general' as SkillCategory,
  author: '',
  path: '',
  content: '',
});

const categoryOptions = [
  { value: 'auth', label: 'Authentication' },
  { value: 'browser', label: 'Browser' },
  { value: 'command', label: 'Command' },
  { value: 'mcp', label: 'MCP' },
  { value: 'search', label: 'Search' },
  { value: 'file', label: 'File' },
  { value: 'git', label: 'Git' },
  { value: 'general', label: 'General' },
  { value: 'api', label: 'API' },
  { value: 'database', label: 'Database' },
];

const parsedTags = computed(() => {
  return tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
});

const currentMachineId = computed(() => machinesStore.selectedMachine?.id);

onMounted(() => {
  if (isEditing.value) {
    loadSkill();
  } else {
    skillForm.value.path = generateDefaultPath();
  }
});

async function loadSkill(): Promise<void> {
  if (!currentMachineId.value || !route.params.id) return;

  const path = decodeURIComponent(route.params.id as string);

  try {
    const skill = await skillsStore.fetchSkill(currentMachineId.value, path);

    skillForm.value = {
      name: skill.name,
      display_name: skill.display_name || skill.name,
      description: skill.description || '',
      version: skill.version,
      category: skill.category,
      author: '',
      path: skill.path,
      content: (skill.config?.content as string) || '',
    };

    if (skill.tags?.length) {
      tagsInput.value = skill.tags.join(', ');
    }
  } catch {
    toast.error(t('skillsSkilleditor.toastLoadFailed'));
    goBack();
  }
}

function generateDefaultPath(): string {
  const date = new Date().toISOString().split('T')[0];
  return `${date}/new-skill.md`;
}

function togglePreview(): void {
  showPreview.value = !showPreview.value;
}

async function saveSkill(): Promise<void> {
  if (!currentMachineId.value) {
    toast.error(t('skillsSkilleditor.toastNoMachine'));
    return;
  }

  if (!skillForm.value.name || !skillForm.value.path) {
    toast.error(t('skillsSkilleditor.toastNameAndPathRequired'));
    return;
  }

  isSaving.value = true;

  try {
    if (isEditing.value) {
      await skillsStore.updateSkill(
        currentMachineId.value,
        skillForm.value.path,
        {
          display_name: skillForm.value.display_name,
          description: skillForm.value.description,
          config: {
            version: skillForm.value.version,
            category: skillForm.value.category,
            author: skillForm.value.author,
            tags: parsedTags.value,
            content: skillForm.value.content,
          },
        }
      );
      toast.success(t('skillsSkilleditor.toastUpdated'));
    } else {
      await skillsStore.createSkill(currentMachineId.value, {
        name: skillForm.value.name,
        display_name: skillForm.value.display_name,
        description: skillForm.value.description,
        category: skillForm.value.category,
        path: skillForm.value.path,
        version: skillForm.value.version,
        enabled: true,
        tags: parsedTags.value,
        examples: [],
      });
      toast.success(t('skillsSkilleditor.toastCreated'));
    }

    goBack();
  } catch {
    toast.error(isEditing.value ? t('skillsSkilleditor.toastUpdateFailed') : t('skillsSkilleditor.toastCreateFailed'));
  } finally {
    isSaving.value = false;
  }
}

function confirmDelete(): void {
  showDeleteModal.value = true;
}

async function deleteSkill(): Promise<void> {
  if (!currentMachineId.value || !isEditing.value) return;

  try {
    await skillsStore.deleteSkill(currentMachineId.value, skillForm.value.path);
    toast.success(t('skillsSkilleditor.toastDeleted'));
    showDeleteModal.value = false;
    goBack();
  } catch {
    toast.error(t('skillsSkilleditor.toastDeleteFailed'));
  }
}

function goBack(): void {
  router.push('/skills');
}
</script>
