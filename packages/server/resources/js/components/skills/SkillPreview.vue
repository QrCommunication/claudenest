<template>
  <div class="skill-preview">
    <!-- Header -->
    <div class="flex items-start gap-4 mb-6 pb-4 border-b border-skin">
      <div 
        :class="[
          'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
          `bg-${categoryColor}-500/10`
        ]"
      >
        <component :is="categoryIcon" :class="`w-7 h-7 text-${categoryColor}-400`" />
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold text-white">{{ displayName || name || 'Untitled Skill' }}</h1>
        <div class="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="default" size="sm">v{{ version }}</Badge>
          <Badge :variant="categoryVariant" size="sm">{{ category }}</Badge>
          <span v-if="author" class="text-sm text-skin-secondary">by {{ author }}</span>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div v-if="description" class="mb-6">
      <p class="text-skin-secondary">{{ description }}</p>
    </div>

    <!-- Tags -->
    <div v-if="tags.length > 0" class="flex flex-wrap gap-2 mb-6">
      <Badge 
        v-for="tag in tags" 
        :key="tag"
        variant="info" 
        size="sm"
      >
        <TagIcon class="w-3 h-3 mr-1" />
        {{ tag }}
      </Badge>
    </div>

    <!-- Content -->
    <div 
      v-if="content" 
      class="prose prose-invert prose-sm max-w-none"
      v-html="renderedContent"
    />
    
    <div v-else class="text-center py-12 bg-surface-1 rounded-lg">
      <FileTextIcon class="w-8 h-8 text-skin-secondary mx-auto mb-2" />
      <p class="text-sm text-skin-secondary">No content yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Badge from '@/components/common/Badge.vue';
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
  TagIcon,
  FileTextIcon,
} from 'lucide-vue-next';
import type { SkillCategory } from '@/types';

interface Props {
  name?: string;
  displayName?: string;
  description?: string;
  version?: string;
  category?: SkillCategory | string;
  author?: string;
  tags?: string[];
  content?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  displayName: '',
  description: '',
  version: '1.0.0',
  category: 'general',
  author: '',
  tags: () => [],
  content: '',
});

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
  return icons[props.category] || ZapIcon;
});

const categoryColor = computed(() => {
  const colors: Record<string, string> = {
    auth: 'purple',
    browser: 'blue',
    command: 'green',
    mcp: 'orange',
    search: 'cyan',
    file: 'yellow',
    git: 'red',
    general: 'gray',
    api: 'indigo',
    database: 'pink',
  };
  return colors[props.category] || 'gray';
});

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
  return variants[props.category] || 'default';
});

const renderedContent = computed(() => {
  if (!props.content) return '';
  
  // Simple markdown rendering
  let html = props.content
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-white mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-surface-1 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm text-brand-purple font-mono">$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-surface-1 px-1.5 py-0.5 rounded text-brand-purple font-mono text-sm">$1</code>')
    // Blockquotes
    .replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-brand-purple pl-4 italic text-skin-secondary my-4">$1</blockquote>')
    // Lists
    .replace(/^- (.*$)/gim, '<li class="ml-4 text-skin-secondary">$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-skin-secondary">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-purple hover:underline" target="_blank" rel="noopener">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  return html;
});
</script>

<style scoped>
.skill-preview :deep(pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.skill-preview :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
}

.skill-preview :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
}
</style>
