<template>
  <div class="code-block" :class="{ 'with-filename': filename, 'with-lines': showLineNumbers }">
    <div class="code-header">
      <div class="code-header-left">
        <span v-if="filename" class="filename">{{ filename }}</span>
        <span v-else class="language-badge" :class="languageClass">{{ displayLanguage }}</span>
      </div>
      <button
        class="copy-btn"
        :class="{ copied: copied }"
        @click="copyCode"
        :aria-label="copied ? t('docsCodeblock.copied') : t('docsCodeblock.copyCode')"
      >
        <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="copy-label">{{ copied ? t('docsCodeblock.copiedExclaim') : t('docsCodeblock.copy') }}</span>
      </button>
    </div>
    <pre :class="`language-${language}`"><code ref="codeRef">{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLineNumbers: false,
});

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
    'text': 'Text',
  };
  return langMap[props.language] || props.language.toUpperCase();
});

const languageClass = computed(() => {
  const classMap: Record<string, string> = {
    'bash': 'lang-shell',
    'sh': 'lang-shell',
    'shell': 'lang-shell',
    'js': 'lang-js',
    'javascript': 'lang-js',
    'ts': 'lang-ts',
    'typescript': 'lang-ts',
    'php': 'lang-php',
    'json': 'lang-json',
    'python': 'lang-python',
    'py': 'lang-python',
  };
  return classMap[props.language] || 'lang-default';
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

onMounted(() => {
  if (codeRef.value) {
    applySyntaxHighlighting(codeRef.value, props.language);
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function span(cls: string, escapedText: string): string {
  return `<span class="${cls}">${escapedText}</span>`;
}

function highlightJson(raw: string): string {
  return raw.split('\n').map(line => {
    const e = escapeHtml(line);
    return e
      .replace(/(&quot;)([^&"]*?)(&quot;)(\s*:)/g,
        (_m, q1, key, q2, colon) => span('token-key', `${q1}${key}${q2}`) + colon,
      )
      .replace(/(:\s*)(&quot;)([^&"]*?)(&quot;)/g,
        (_m, sep, q1, val, q2) => sep + span('token-string', `${q1}${val}${q2}`),
      )
      .replace(/\b(true|false|null)\b/g, v => span('token-boolean', v))
      .replace(/(:\s*)(-?\d+\.?\d*)\b/g,
        (_m, sep, n) => sep + span('token-number', n),
      );
  }).join('\n');
}

function highlightShell(raw: string): string {
  const KEYWORDS = /\b(curl|wget|echo|export|if|then|else|fi|for|do|done|while|function|npm|npx|yarn|pnpm|php|artisan|composer|git|sudo|chmod|chown|mkdir|cp|mv|rm|ln|systemctl|docker|bash|sh)\b/g;

  return raw.split('\n').map(line => {
    if (/^\s*#/.test(line)) {
      return span('token-comment', escapeHtml(line));
    }
    const e = escapeHtml(line);
    return e
      .replace(/(&quot;)(.*?)(&quot;)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      .replace(KEYWORDS, kw => span('token-keyword', kw))
      .replace(/(^|\s)(--?[a-zA-Z][a-zA-Z-]*)/g,
        (_m, before, flag) => before + span('token-flag', flag),
      );
  }).join('\n');
}

function highlightJsTs(raw: string): string {
  const KEYWORDS = /\b(const|let|var|function|async|await|return|import|export|from|class|interface|type|if|else|try|catch|throw|new|extends|implements|readonly|public|private|protected|static|void|boolean|number|string|null|undefined|true|false)\b/g;

  return raw.split('\n').map(line => {
    if (/^\s*\/\//.test(line)) {
      return span('token-comment', escapeHtml(line));
    }
    const e = escapeHtml(line);
    return e
      .replace(/(`)([^`]*?)(`)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      .replace(/(&quot;)([^&]*?)(&quot;)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      .replace(/(')(.*?)(')/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      .replace(KEYWORDS, kw => span('token-keyword', kw))
      .replace(/\b(\d+\.?\d*)\b/g, n => span('token-number', n));
  }).join('\n');
}

function highlightPhp(raw: string): string {
  const KEYWORDS = /\b(class|function|public|private|protected|return|if|else|try|catch|throw|new|use|namespace|extends|implements|abstract|static|readonly|array|string|int|float|bool|void|null|true|false)\b/g;

  return raw.split('\n').map(line => {
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
      return span('token-comment', escapeHtml(line));
    }
    const e = escapeHtml(line);
    return e
      .replace(/(&quot;)([^&]*?)(&quot;)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      .replace(/(')(.*?)(')/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      .replace(KEYWORDS, kw => span('token-keyword', kw))
      .replace(/(\$[a-zA-Z_][a-zA-Z0-9_]*)/g, v => span('token-variable', v))
      .replace(/\b(\d+\.?\d*)\b/g, n => span('token-number', n));
  }).join('\n');
}

function applySyntaxHighlighting(element: HTMLElement, language: string) {
  const code = element.textContent || '';
  let highlighted: string;

  if (language === 'json') {
    highlighted = highlightJson(code);
  } else if (['bash', 'sh', 'shell'].includes(language)) {
    highlighted = highlightShell(code);
  } else if (['js', 'javascript', 'ts', 'typescript'].includes(language)) {
    highlighted = highlightJsTs(code);
  } else if (language === 'php') {
    highlighted = highlightPhp(code);
  } else {
    highlighted = escapeHtml(code);
  }

  element.innerHTML = highlighted;
}
</script>

<style scoped>
.code-block {
  margin: 1.25rem 0;
  border-radius: 8px;
  overflow: hidden;
  background: #0d1117;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.85rem;
  background: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.code-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filename {
  font-size: 0.78rem;
  color: #8b949e;
  font-family: 'JetBrains Mono', monospace;
}

.language-badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 3px;
  color: #8b949e;
  background: rgba(255, 255, 255, 0.06);
}

.language-badge.lang-shell { color: #7ee787; background: rgba(126, 231, 135, 0.1); }
.language-badge.lang-js { color: #f0e68c; background: rgba(240, 230, 140, 0.1); }
.language-badge.lang-ts { color: #79c0ff; background: rgba(121, 192, 255, 0.1); }
.language-badge.lang-php { color: #d2a8ff; background: rgba(210, 168, 255, 0.1); }
.language-badge.lang-json { color: #ffa657; background: rgba(255, 166, 87, 0.1); }
.language-badge.lang-python { color: #79c0ff; background: rgba(121, 192, 255, 0.1); }

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.55rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  color: #8b949e;
  font-size: 0.72rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #c9d1d9;
  border-color: rgba(255, 255, 255, 0.12);
}

.copy-btn.copied {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.2);
  color: #7ee787;
}

.copy-btn svg {
  width: 14px;
  height: 14px;
}

.copy-label {
  font-family: 'IBM Plex Sans', sans-serif;
}

pre {
  margin: 0;
  padding: 1rem 1.15rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  color: #c9d1d9;
}

code {
  font-family: inherit;
}

/* Syntax Highlighting Tokens */
:deep(.token-key) { color: #7dd3fc; }
:deep(.token-string) { color: #7ee787; }
:deep(.token-number) { color: #ffa657; }
:deep(.token-boolean) { color: #d2a8ff; }
:deep(.token-comment) { color: #8b949e; font-style: italic; }
:deep(.token-keyword) { color: #ff7b72; }
:deep(.token-flag) { color: #ffa657; }
:deep(.token-variable) { color: #ffa657; }

/* Light mode overrides */
html:not(.dark) .code-block {
  background: #f6f8fa;
  border-color: #d0d7de;
}

html:not(.dark) .code-header {
  background: #eaeef2;
  border-bottom-color: #d0d7de;
}

html:not(.dark) .filename { color: #57606a; }

html:not(.dark) .language-badge {
  color: #57606a;
  background: rgba(0, 0, 0, 0.05);
}

html:not(.dark) .copy-btn {
  color: #57606a;
  border-color: #d0d7de;
}

html:not(.dark) .copy-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #24292f;
}

html:not(.dark) pre { color: #24292f; }

html:not(.dark) :deep(.token-key) { color: #1d4ed8; }
html:not(.dark) :deep(.token-string) { color: #16a34a; }
html:not(.dark) :deep(.token-number) { color: #cf222e; }
html:not(.dark) :deep(.token-boolean) { color: #8250df; }
html:not(.dark) :deep(.token-comment) { color: #6e7781; }
html:not(.dark) :deep(.token-keyword) { color: #cf222e; }
html:not(.dark) :deep(.token-flag) { color: #953800; }
html:not(.dark) :deep(.token-variable) { color: #cf222e; }

/* Custom scrollbar */
pre::-webkit-scrollbar {
  height: 6px;
}

pre::-webkit-scrollbar-track {
  background: transparent;
}

pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.14);
}

/* ============ REDUCED MOTION ============ */
@media (prefers-reduced-motion: reduce) {
  .copy-btn {
    transition: none;
  }
}
</style>
