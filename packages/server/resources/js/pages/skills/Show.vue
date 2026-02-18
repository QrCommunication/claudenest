<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="skillsStore.isLoading" class="max-w-4xl mx-auto">
      <Skeleton class="h-32 mb-6" />
      <Skeleton class="h-64" />
    </div>

    <!-- Error State -->
    <div v-else-if="!skill" class="text-center py-12">
      <AlertCircleIcon class="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-white mb-2">Skill not found</h3>
      <p class="text-dark-4 mb-4">The skill you're looking for doesn't exist or has been removed.</p>
      <Button variant="primary" @click="$router.push('/skills')">
        Back to Skills
      </Button>
    </div>

    <!-- Skill Details -->
    <div v-else class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <div 
            :class="[
              'w-14 h-14 rounded-xl flex items-center justify-center',
              `bg-${skill.category_color}-500/10`
            ]"
          >
            <ZapIcon :class="`w-7 h-7 text-${skill.category_color}-400`" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">{{ skill.display_name }}</h1>
            <div class="flex items-center gap-2 mt-1">
              <code class="text-sm text-dark-4">{{ skill.path }}</code>
              <Badge variant="default" size="sm">v{{ skill.version }}</Badge>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <SkillToggle 
            :enabled="skill.enabled" 
            :loading="skillsStore.isToggling"
            @toggle="toggleSkill"
          />
          <Button variant="ghost" @click="$router.push('/skills')">
            <ArrowLeftIcon class="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <!-- Description -->
      <Card v-if="skill.description" class-name="mb-6">
        <p class="text-dark-4">{{ skill.description }}</p>
      </Card>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Configuration -->
        <Card title="Configuration" class-name="lg:col-span-2">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm text-dark-4">
                {{ skill.has_config ? 'Edit the JSON configuration for this skill' : 'No configuration options available' }}
              </p>
              <div v-if="skill.has_config" class="flex gap-2">
                <Button variant="ghost" size="sm" @click="resetConfig">
                  <RotateCcwIcon class="w-4 h-4" />
                  Reset
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  :loading="skillsStore.isUpdating"
                  @click="saveConfig"
                >
                  <SaveIcon class="w-4 h-4" />
                  Save
                </Button>
              </div>
            </div>
            
            <textarea
              v-if="skill.has_config"
              v-model="configJson"
              rows="12"
              class="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-brand-purple"
              :class="{ 'border-red-500': configError }"
            />
            <p v-if="configError" class="text-sm text-red-400">{{ configError }}</p>
            
            <div v-else class="text-center py-8 bg-dark-1 rounded-lg">
              <SettingsIcon class="w-8 h-8 text-dark-4 mx-auto mb-2" />
              <p class="text-sm text-dark-4">This skill has no configurable options</p>
            </div>
          </div>
        </Card>

        <!-- Tags -->
        <Card v-if="skill.tags?.length" title="Tags">
          <div class="flex flex-wrap gap-2">
            <Badge 
              v-for="tag in skill.tags" 
              :key="tag"
              variant="default" 
              size="sm"
            >
              {{ tag }}
            </Badge>
          </div>
        </Card>

        <!-- Examples -->
        <Card v-if="skill.examples?.length" title="Examples">
          <div class="space-y-3">
            <div 
              v-for="(example, index) in skill.examples" 
              :key="index"
              class="bg-dark-1 rounded-lg p-3"
            >
              <p class="font-medium text-white text-sm">{{ example.title }}</p>
              <p v-if="example.description" class="text-xs text-dark-4 mt-1">
                {{ example.description }}
              </p>
              <code 
                v-if="example.code" 
                class="block mt-2 text-xs text-brand-purple bg-brand-purple/10 p-2 rounded font-mono"
              >
                {{ example.code }}
              </code>
            </div>
          </div>
        </Card>
      </div>

      <!-- Related Skills -->
      <div v-if="skillsStore.relatedSkills.length > 0" class="mt-8">
        <h2 class="text-lg font-semibold text-white mb-4">Related Skills</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkillCard
            v-for="relatedSkill in skillsStore.relatedSkills"
            :key="relatedSkill.id"
            :skill="relatedSkill"
            @view="viewSkill"
            @toggle="toggleSkill"
          />
        </div>
      </div>

      <!-- Metadata -->
      <div class="mt-8 pt-6 border-t border-dark-4">
        <div class="flex flex-wrap gap-6 text-sm text-dark-4">
          <span>Discovered: {{ skill.discovered_at_human || 'Unknown' }}</span>
          <span>Created: {{ skill.created_at_human }}</span>
          <span>Updated: {{ skill.updated_at }}</span>
          <span>Machine ID: {{ skill.machine_id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSkillsStore } from '@/stores/skills';
import { useMachinesStore } from '@/stores/machines';
import { useToast } from '@/composables/useToast';
import SkillCard from '@/components/skills/SkillCard.vue';
import SkillToggle from '@/components/skills/SkillToggle.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Badge from '@/components/common/Badge.vue';
import Skeleton from '@/components/common/Skeleton.vue';
import {
  ZapIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  SettingsIcon,
  SaveIcon,
  RotateCcwIcon,
} from 'lucide-vue-next';
import type { Skill } from '@/types';

const route = useRoute();
const router = useRouter();
const skillsStore = useSkillsStore();
const machinesStore = useMachinesStore();
const toast = useToast();

const configJson = ref('');
const configError = ref('');

const skillPath = computed(() => decodeURIComponent(route.params.id as string));
const skill = computed(() => skillsStore.selectedSkill);
const currentMachineId = computed(() => machinesStore.selectedMachine?.id);

onMounted(() => {
  loadSkill();
});

watch(skillPath, () => {
  loadSkill();
});

watch(() => skill.value?.config, (config) => {
  if (config) {
    configJson.value = JSON.stringify(config, null, 2);
  }
}, { immediate: true });

async function loadSkill(): Promise<void> {
  if (!currentMachineId.value || !skillPath.value) return;
  
  try {
    await skillsStore.fetchSkill(currentMachineId.value, skillPath.value);
    if (skill.value?.config) {
      configJson.value = JSON.stringify(skill.value.config, null, 2);
    }
  } catch {
    toast.error('Failed to load skill');
  }
}

async function toggleSkill(): Promise<void> {
  if (!currentMachineId.value || !skill.value) return;
  
  try {
    await skillsStore.toggleSkill(currentMachineId.value, skill.value.path);
    toast.success(`Skill ${skill.value.enabled ? 'disabled' : 'enabled'}`);
  } catch {
    toast.error('Failed to toggle skill');
  }
}

async function saveConfig(): Promise<void> {
  if (!currentMachineId.value || !skill.value) return;
  
  try {
    const config = JSON.parse(configJson.value);
    await skillsStore.updateSkill(currentMachineId.value, skill.value.path, { config });
    toast.success('Configuration saved');
    configError.value = '';
  } catch (e) {
    if (e instanceof SyntaxError) {
      configError.value = 'Invalid JSON: ' + e.message;
    } else {
      toast.error('Failed to save configuration');
    }
  }
}

function resetConfig(): void {
  if (skill.value?.config) {
    configJson.value = JSON.stringify(skill.value.config, null, 2);
    configError.value = '';
  }
}

function viewSkill(targetSkill: Skill): void {
  router.push(`/skills/${encodeURIComponent(targetSkill.path)}`);
}
</script>
