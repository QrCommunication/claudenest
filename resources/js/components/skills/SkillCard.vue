<template>
  <Card hoverable class-name="h-full flex flex-col">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div 
          :class="[
            'w-10 h-10 rounded-lg flex items-center justify-center',
            `bg-${categoryColor}-500/10`
          ]"
        >
          <component :is="categoryIcon" :class="`w-5 h-5 text-${categoryColor}-400`" />
        </div>
        <div>
          <h3 class="font-semibold text-white">{{ skill.display_name }}</h3>
          <p class="text-xs text-dark-4">{{ skill.path }}</p>
        </div>
      </div>
      <SkillToggle 
        :enabled="skill.enabled" 
        :loading="isToggling"
        @toggle="$emit('toggle', skill)"
      />
    </div>

    <p class="mt-3 text-sm text-dark-4 line-clamp-2">
      {{ skill.description || 'No description available' }}
    </p>

    <div class="mt-4 flex items-center gap-2 flex-wrap">
      <Badge :variant="categoryVariant" size="sm">
        {{ skill.category }}
      </Badge>
      <Badge v-if="skill.version" variant="default" size="sm">
        v{{ skill.version }}
      </Badge>
      <Badge v-if="skill.has_config" variant="info" size="sm">
        configurable
      </Badge>
    </div>

    <div class="mt-auto pt-4 flex items-center justify-between">
      <div class="flex gap-1">
        <span 
          v-for="tag in displayedTags" 
          :key="tag"
          class="text-xs text-dark-4 bg-dark-3 px-2 py-0.5 rounded"
        >
          {{ tag }}
        </span>
        <span v-if="remainingTags > 0" class="text-xs text-dark-4">
          +{{ remainingTags }}
        </span>
      </div>
      
      <div class="flex gap-2">
        <Button 
          v-if="skill.has_config"
          variant="ghost" 
          size="sm"
          @click="$emit('configure', skill)"
        >
          <SettingsIcon class="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          @click="$emit('view', skill)"
        >
          <ArrowRightIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/common/Card.vue';
import Badge from '@/components/common/Badge.vue';
import Button from '@/components/common/Button.vue';
import SkillToggle from './SkillToggle.vue';
import type { Skill } from '@/types';

// Simple icon components
const ShieldIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' };
const GlobeIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' };
const TerminalIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>' };
const CpuIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>' };
const SearchIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' };
const FileIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>' };
const GitBranchIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>' };
const ZapIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' };
const DatabaseIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>' };
const SettingsIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>' };
const ArrowRightIcon = { template: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>' };

interface Props {
  skill: Skill;
  isToggling?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isToggling: false,
});

defineEmits<{
  toggle: [skill: Skill];
  configure: [skill: Skill];
  view: [skill: Skill];
}>();

const categoryIcon = computed(() => {
  const icons: Record<string, unknown> = {
    auth: ShieldIcon,
    browser: GlobeIcon,
    command: TerminalIcon,
    mcp: CpuIcon,
    search: SearchIcon,
    file: FileIcon,
    git: GitBranchIcon,
    general: ZapIcon,
    api: ZapIcon,
    database: DatabaseIcon,
  };
  return icons[props.skill.category] || ZapIcon;
});

const categoryColor = computed(() => props.skill.category_color || 'gray');

const categoryVariant = computed(() => {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'> = {
    auth: 'purple',
    browser: 'info',
    command: 'success',
    mcp: 'warning',
    search: 'info',
    file: 'warning',
    git: 'error',
    general: 'default',
    api: 'info',
    database: 'purple',
  };
  return variants[props.skill.category] || 'default';
});

const displayedTags = computed(() => props.skill.tags?.slice(0, 2) || []);
const remainingTags = computed(() => Math.max(0, (props.skill.tags?.length || 0) - 2));
</script>
