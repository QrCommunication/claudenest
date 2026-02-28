<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-skin-primary">Skills</h1>
        <p class="text-skin-secondary mt-1">Manage discovered skills and their configurations</p>
      </div>
      <div class="flex items-center gap-3">
        <MachineSelector />
        <Badge variant="info" size="md">
          {{ skillsStore.pagination.total }} total
        </Badge>
        <Button
          variant="ghost"
          @click="refreshSkills"
          :loading="skillsStore.isLoading"
        >
          <RefreshCwIcon class="w-4 h-4" />
          Refresh
        </Button>
        <Button
          variant="primary"
          @click="createSkill"
        >
          <PlusIcon class="w-4 h-4" />
          New Skill
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="flex-1">
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search skills..."
          class="w-full"
        >
          <template #left-icon>
            <SearchIcon class="w-4 h-4 text-skin-secondary" />
          </template>
        </Input>
      </div>
      <Select
        v-model="selectedCategory"
        :options="categoryOptions"
        placeholder="All Categories"
        class="w-full sm:w-48"
      />
      <Select
        v-model="selectedStatus"
        :options="statusOptions"
        placeholder="All Status"
        class="w-full sm:w-40"
      />
    </div>

    <!-- Category Stats -->
    <div v-if="categoryStats.length > 0" class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="stat in categoryStats"
        :key="stat.category"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedCategory === stat.category
            ? 'bg-brand-purple text-white'
            : 'bg-surface-2 text-skin-secondary hover:bg-surface-3'
        ]"
        @click="selectedCategory = selectedCategory === stat.category ? '' : stat.category"
      >
        {{ stat.category }}
        <span class="ml-1 opacity-70">({{ stat.count }})</span>
      </button>
    </div>

    <!-- Skills Grid -->
    <div v-if="skillsStore.isLoading && skillsStore.skills.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Skeleton v-for="i in 6" :key="i" class="h-40" />
    </div>

    <div v-else-if="filteredSkills.length === 0" class="text-center py-12">
      <ZapIcon class="w-12 h-12 text-skin-secondary mx-auto mb-4" />
      <h3 class="text-lg font-medium text-skin-primary mb-2">No skills found</h3>
      <p class="text-skin-secondary mb-4">
        {{ searchQuery ? 'Try adjusting your search filters' : 'Create your first skill to get started' }}
      </p>
      <Button variant="primary" @click="createSkill">
        <PlusIcon class="w-4 h-4" />
        Create Skill
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SkillCard
        v-for="skill in filteredSkills"
        :key="skill.id"
        :skill="skill"
        :is-toggling="skillsStore.isToggling && skillsStore.selectedSkill?.id === skill.id"
        :is-deleting="isDeleting === skill.id"
        @toggle="toggleSkill"
        @edit="editSkill"
        @delete="confirmDelete"
      />
    </div>

    <!-- Pagination -->
    <div v-if="skillsStore.pagination.lastPage > 1" class="flex justify-center mt-8">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :disabled="skillsStore.pagination.currentPage === 1"
          @click="changePage(skillsStore.pagination.currentPage - 1)"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </Button>
        <span class="text-sm text-skin-secondary">
          Page {{ skillsStore.pagination.currentPage }} of {{ skillsStore.pagination.lastPage }}
        </span>
        <Button
          variant="ghost"
          size="sm"
          :disabled="skillsStore.pagination.currentPage === skillsStore.pagination.lastPage"
          @click="changePage(skillsStore.pagination.currentPage + 1)"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Preview Modal -->
    <Modal v-model="showPreviewModal" size="lg">
      <template #title>
        <div class="flex items-center gap-2">
          <EyeIcon class="w-5 h-5 text-brand-purple" />
          Skill Preview
        </div>
      </template>
      
      <div v-if="previewingSkill" class="max-h-[70vh] overflow-y-auto">
        <SkillPreview
          :name="previewingSkill.name"
          :display-name="previewingSkill.display_name"
          :description="previewingSkill.description ?? undefined"
          :version="previewingSkill.version"
          :category="previewingSkill.category"
          :tags="previewingSkill.tags"
          :content="(previewingSkill.config?.content as string) || ''"
        />
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="ghost" @click="showPreviewModal = false">
            Close
          </Button>
          <Button 
            variant="primary" 
            @click="editSkill(previewingSkill!)"
          >
            <EditIcon class="w-4 h-4" />
            Edit
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal">
      <template #title>
        <div class="flex items-center gap-2 text-red-400">
          <AlertTriangleIcon class="w-5 h-5" />
          Delete Skill
        </div>
      </template>
      
      <p class="text-skin-secondary">
        Are you sure you want to delete <strong class="text-skin-primary">{{ skillToDelete?.display_name }}</strong>? 
        This action cannot be undone.
      </p>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="ghost" @click="showDeleteModal = false">
            Cancel
          </Button>
          <Button 
            variant="error" 
            :loading="skillsStore.isDeleting"
            @click="deleteSkill"
          >
            Delete
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSkillsStore } from '@/stores/skills';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import SkillCard from './SkillCard.vue';
import SkillPreview from '@/components/skills/SkillPreview.vue';
import MachineSelector from '@/components/common/MachineSelector.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Select from '@/components/common/Select.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import Modal from '@/components/common/Modal.vue';
import {
  SearchIcon,
  RefreshCwIcon,
  ZapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  AlertTriangleIcon,
} from 'lucide-vue-next';
import type { Skill } from '@/types';

const router = useRouter();
const skillsStore = useSkillsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedStatus = ref<'all' | 'enabled' | 'disabled'>('all');
const showPreviewModal = ref(false);
const showDeleteModal = ref(false);
const previewingSkill = ref<Skill | null>(null);
const skillToDelete = ref<Skill | null>(null);
const isDeleting = ref<string | null>(null);

const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...skillsStore.categories.map(cat => ({ value: cat, label: cat })),
]);

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

const categoryStats = computed(() => {
  return Object.entries(skillsStore.categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
});

const filteredSkills = computed(() => {
  let result = skillsStore.skills;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.display_name && s.display_name.toLowerCase().includes(query)) ||
      (s.description && s.description.toLowerCase().includes(query))
    );
  }

  if (selectedCategory.value) {
    result = result.filter(s => s.category === selectedCategory.value);
  }

  if (selectedStatus.value !== 'all') {
    const enabled = selectedStatus.value === 'enabled';
    result = result.filter(s => s.enabled === enabled);
  }

  return result;
});

const currentMachineId = computed(() => machinesStore.selectedMachine?.id);

onMounted(() => {
  if (currentMachineId.value) {
    loadSkills();
  }
});

watch(currentMachineId, (newId) => {
  if (newId) {
    loadSkills();
  }
});

async function loadSkills(): Promise<void> {
  if (!currentMachineId.value) return;
  
  try {
    await skillsStore.fetchSkills(currentMachineId.value);
  } catch {
    toast.error('Failed to load skills');
  }
}

async function refreshSkills(): Promise<void> {
  await loadSkills();
  toast.success('Skills refreshed');
}

function createSkill(): void {
  router.push('/skills/new');
}

function editSkill(skill: Skill): void {
  router.push(`/skills/${encodeURIComponent(skill.path)}/edit`);
}

function viewSkill(skill: Skill): void {
  previewingSkill.value = skill;
  showPreviewModal.value = true;
}

async function toggleSkill(skill: Skill): Promise<void> {
  if (!currentMachineId.value) return;
  
  try {
    await skillsStore.toggleSkill(currentMachineId.value, skill.path);
    toast.success(`Skill ${skill.enabled ? 'disabled' : 'enabled'}`);
  } catch {
    toast.error('Failed to toggle skill');
  }
}

function confirmDelete(skill: Skill): void {
  skillToDelete.value = skill;
  showDeleteModal.value = true;
}

async function deleteSkill(): Promise<void> {
  if (!currentMachineId.value || !skillToDelete.value) return;
  
  isDeleting.value = skillToDelete.value.id;
  
  try {
    await skillsStore.deleteSkill(currentMachineId.value, skillToDelete.value.path);
    toast.success('Skill deleted successfully');
    showDeleteModal.value = false;
  } catch {
    toast.error('Failed to delete skill');
  } finally {
    isDeleting.value = null;
    skillToDelete.value = null;
  }
}

function changePage(page: number): void {
  if (!currentMachineId.value) return;
  skillsStore.fetchSkills(currentMachineId.value, page);
}
</script>
