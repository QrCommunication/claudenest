<template>
  <Card hoverable class-name="h-full flex flex-col group">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div 
          :class="[
            'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
            `bg-${categoryColor}-500/10`
          ]"
        >
          <component :is="categoryIcon" :class="`w-5 h-5 text-${categoryColor}-400`" />
        </div>
        <div>
          <h3 class="font-semibold text-skin-primary group-hover:text-brand-purple transition-colors">
            {{ skill.display_name }}
          </h3>
          <p class="text-xs text-skin-secondary font-mono">{{ skill.path }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Badge 
          :variant="skill.enabled ? 'success' : 'default'" 
          size="sm"
        >
          {{ skill.enabled ? 'Enabled' : 'Disabled' }}
        </Badge>
      </div>
    </div>

    <p class="mt-3 text-sm text-skin-secondary line-clamp-2">
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
          class="text-xs text-skin-secondary bg-surface-3 px-2 py-0.5 rounded"
        >
          {{ tag }}
        </span>
        <span v-if="remainingTags > 0" class="text-xs text-skin-secondary">
          +{{ remainingTags }}
        </span>
      </div>
      
      <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="sm"
          @click.stop="$emit('edit', skill)"
        >
          <EditIcon class="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          @click.stop="$emit('toggle', skill)"
          :loading="isToggling"
        >
          <PowerIcon 
            :class="[
              'w-4 h-4',
              skill.enabled ? 'text-green-400' : 'text-skin-secondary'
            ]" 
          />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          @click.stop="$emit('delete', skill)"
          :loading="isDeleting"
        >
          <TrashIcon class="w-4 h-4 text-red-400" />
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
import {
  ShieldIcon,
  GlobeIcon,
  TerminalIcon,
  CpuIcon,
  SearchIcon,
  FileIcon,
  GitBranchIcon,
  ZapIcon,
  DatabaseIcon,
  EditIcon,
  PowerIcon,
  TrashIcon,
} from 'lucide-vue-next';
import type { Skill } from '@/types';

interface Props {
  skill: Skill;
  isToggling?: boolean;
  isDeleting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isToggling: false,
  isDeleting: false,
});

defineEmits<{
  edit: [skill: Skill];
  toggle: [skill: Skill];
  delete: [skill: Skill];
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
