<template>
  <div class="relative">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="text-xs text-skin-secondary font-medium">{{ t('skillsMarkdowneditor.markdown') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <Button
          v-for="action in toolbarActions"
          :key="action.label"
          type="button"
          variant="ghost"
          size="sm"
          class="h-7 w-7 p-0"
          :title="t(action.label)"
          @click="insertMarkdown(action.prefix, action.suffix)"
        >
          <component :is="action.icon" class="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder || t('skillsMarkdowneditor.placeholder')"
      class="w-full bg-surface-1 border border-skin rounded-lg px-4 py-3 text-skin-primary text-sm font-mono focus:outline-none focus:border-brand-purple resize-y transition-colors"
      :class="{ 'border-red-500': error }"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    
    <div v-if="error" class="text-xs text-red-400 mt-1">{{ error }}</div>
    
    <div class="flex items-center justify-between mt-2 text-xs text-skin-secondary">
      <span>{{ t('skillsMarkdowneditor.lines', { count: lineCount }) }}</span>
      <span>{{ t('skillsMarkdowneditor.characters', { count: charCount }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from '@/components/common/Button.vue';
import {
  BoldIcon,
  ItalicIcon,
  HeadingIcon,
  ListIcon,
  ListOrderedIcon,
  CodeIcon,
  LinkIcon,
  QuoteIcon,
} from 'lucide-vue-next';

interface Props {
  modelValue: string;
  rows?: number;
  placeholder?: string;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 20,
  placeholder: '',
  error: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const textareaRef = ref<HTMLTextAreaElement>();

const lineCount = computed(() => props.modelValue.split('\n').length);
const charCount = computed(() => props.modelValue.length);

const toolbarActions = [
  { label: 'skillsMarkdowneditor.bold', icon: BoldIcon, prefix: '**', suffix: '**' },
  { label: 'skillsMarkdowneditor.italic', icon: ItalicIcon, prefix: '_', suffix: '_' },
  { label: 'skillsMarkdowneditor.heading', icon: HeadingIcon, prefix: '## ', suffix: '' },
  { label: 'skillsMarkdowneditor.bulletList', icon: ListIcon, prefix: '- ', suffix: '' },
  { label: 'skillsMarkdowneditor.numberedList', icon: ListOrderedIcon, prefix: '1. ', suffix: '' },
  { label: 'skillsMarkdowneditor.code', icon: CodeIcon, prefix: '`', suffix: '`' },
  { label: 'skillsMarkdowneditor.codeBlock', icon: CodeIcon, prefix: '```\n', suffix: '\n```' },
  { label: 'skillsMarkdowneditor.link', icon: LinkIcon, prefix: '[', suffix: '](url)' },
  { label: 'skillsMarkdowneditor.quote', icon: QuoteIcon, prefix: '> ', suffix: '' },
];

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}

function handleKeydown(event: KeyboardEvent): void {
  // Tab support
  if (event.key === 'Tab') {
    event.preventDefault();
    insertMarkdown('  ', '');
  }
}

function insertMarkdown(prefix: string, suffix: string): void {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = props.modelValue;
  const selectedText = value.substring(start, end);

  const newValue = 
    value.substring(0, start) + 
    prefix + selectedText + suffix + 
    value.substring(end);

  emit('update:modelValue', newValue);

  // Restore cursor position
  setTimeout(() => {
    const newCursorPos = start + prefix.length + selectedText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
  }, 0);
}
</script>
