<template>
  <div class="code-block" :class="{ 'with-filename': filename }">
    <div class="code-header">
      <span v-if="filename" class="filename">{{ filename }}</span>
      <span v-else class="language">{{ displayLanguage }}</span>
      <button class="copy-btn" @click="copyCode" :class="{ copied: copied }">
        <svg v-if="!copied" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <pre :class="`language-${language}`"><code ref="codeRef">{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Props {
  code: string;
  language: string;
  filename?: string;
}

const props = defineProps<Props>();

const codeRef = ref<HTMLElement>();
const copied = ref(false);

const displayLanguage = computed(() => {
  const langMap: Record<string, string> = {
    'bash': 'Shell',
    'sh': 'Shell',
    'shell': 'Shell',
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'php': 'PHP',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'python': 'Python',
    'py': 'Python',
    'go': 'Go',
    'rust': 'Rust',
    'java': 'Java',
    'csharp': 'C#',
    'ruby': 'Ruby',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
  };
  return langMap[props.language] || props.language.toUpperCase();
});

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Simple syntax highlighting on mount
onMounted(() => {
  if (codeRef.value) {
    applySyntaxHighlighting(codeRef.value, props.language);
  }
});

function applySyntaxHighlighting(element: HTMLElement, language: string) {
  const code = element.textContent || '';
  
  // Simple syntax highlighting for common languages
  let highlighted = code;
  
  if (language === 'json') {
    // Highlight JSON
    highlighted = code
      .replace(/"([^"]+)":/g, '<span class="token-key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="token-string">"$1"</span>')
      .replace(/: (true|false|null)/g, ': <span class="token-boolean">$1</span>')
      .replace(/: (\d+)/g, ': <span class="token-number">$1</span>');
  } else if (['bash', 'sh', 'shell'].includes(language)) {
    // Highlight shell
    highlighted = code
      .replace(/(#.*$)/gm, '<span class="token-comment">$1</span>')
      .replace(/\b(curl|wget|echo|export|if|then|else|fi|for|do|done|while|function)\b/g, '<span class="token-keyword">$1</span>')
      .replace(/(-{1,2}[a-zA-Z-]+)/g, '<span class="token-flag">$1</span>')
      .replace(/(".*?")/g, '<span class="token-string">$1</span>');
  } else if (['js', 'javascript', 'ts', 'typescript'].includes(language)) {
    // Highlight JavaScript/TypeScript
    highlighted = code
      .replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>')
      .replace(/\b(const|let|var|function|async|await|return|import|export|from|class|interface|type|if|else|try|catch)\b/g, '<span class="token-keyword">$1</span>')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="token-string">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
  } else if (language === 'php') {
    // Highlight PHP
    highlighted = code
      .replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>')
      .replace(/\b(php|class|function|public|private|protected|return|if|else|try|catch|throw|new|use)\b/g, '<span class="token-keyword">$1</span>')
      .replace(/(".*?"|'.*?')/g, '<span class="token-string">$1</span>')
      .replace(/(\$[a-zA-Z_][a-zA-Z0-9_]*)/g, '<span class="token-variable">$1</span>');
  }
  
  element.innerHTML = highlighted;
}
</script>

<style scoped>
.code-block {
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-code, var(--bg-primary, #0f0f1a));
  border: 1px solid var(--border-color, var(--border));
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 5%, transparent);
}

.filename {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
}

.language {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  color: var(--text-primary);
}

.copy-btn.copied {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.copy-btn svg {
  width: 16px;
  height: 16px;
}

pre {
  margin: 0;
  padding: 1.25rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-primary);
}

code {
  font-family: inherit;
}

/* Syntax Highlighting Tokens */
:deep(.token-key) {
  color: #7dd3fc;
}

:deep(.token-string) {
  color: #86efac;
}

:deep(.token-number) {
  color: #fca5a5;
}

:deep(.token-boolean) {
  color: #c084fc;
}

:deep(.token-comment) {
  color: #64748b;
}

:deep(.token-keyword) {
  color: #c084fc;
}

:deep(.token-flag) {
  color: #fcd34d;
}

:deep(.token-variable) {
  color: #fca5a5;
}

/* Scrollbar */
pre::-webkit-scrollbar {
  height: 8px;
}

pre::-webkit-scrollbar-track {
  background: transparent;
}

pre::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  border-radius: 4px;
}
</style>
