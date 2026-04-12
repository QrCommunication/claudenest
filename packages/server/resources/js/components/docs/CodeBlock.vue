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
    'text': 'Text',
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

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Escape raw text so it is safe to inject into innerHTML. */
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

// ─── Language highlighters ───────────────────────────────────────────────────
// All functions receive raw (unescaped) text and return safe HTML.
// Strategy: escape first → then apply spans so class attributes are never
// corrupted by regex cascades.

function highlightJson(raw: string): string {
  return raw.split('\n').map(line => {
    const e = escapeHtml(line);
    return e
      // Key: "word":
      .replace(/(&quot;)([^&"]*?)(&quot;)(\s*:)/g,
        (_m, q1, key, q2, colon) => span('token-key', `${q1}${key}${q2}`) + colon,
      )
      // String value: : "..."
      .replace(/(:\s*)(&quot;)([^&"]*?)(&quot;)/g,
        (_m, sep, q1, val, q2) => sep + span('token-string', `${q1}${val}${q2}`),
      )
      // Boolean / null
      .replace(/\b(true|false|null)\b/g, v => span('token-boolean', v))
      // Number (after : only)
      .replace(/(:\s*)(-?\d+\.?\d*)\b/g,
        (_m, sep, n) => sep + span('token-number', n),
      );
  }).join('\n');
}

function highlightShell(raw: string): string {
  const KEYWORDS = /\b(curl|wget|echo|export|if|then|else|fi|for|do|done|while|function|npm|npx|yarn|pnpm|php|artisan|composer|git|sudo|chmod|chown|mkdir|cp|mv|rm|ln|systemctl|docker|bash|sh)\b/g;

  return raw.split('\n').map(line => {
    // Comment lines (# …) — escape and wrap entirely
    if (/^\s*#/.test(line)) {
      return span('token-comment', escapeHtml(line));
    }

    const e = escapeHtml(line);

    return e
      // Double-quoted strings (after HTML-escaping, " becomes &quot;)
      .replace(/(&quot;)(.*?)(&quot;)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      // Shell keywords
      .replace(KEYWORDS, kw => span('token-keyword', kw))
      // Flags: -f or --flag (must be preceded by space or start of line)
      .replace(/(^|\s)(--?[a-zA-Z][a-zA-Z-]*)/g,
        (_m, before, flag) => before + span('token-flag', flag),
      );
  }).join('\n');
}

function highlightJsTs(raw: string): string {
  const KEYWORDS = /\b(const|let|var|function|async|await|return|import|export|from|class|interface|type|if|else|try|catch|throw|new|extends|implements|readonly|public|private|protected|static|void|boolean|number|string|null|undefined|true|false)\b/g;

  return raw.split('\n').map(line => {
    // Single-line comment
    if (/^\s*\/\//.test(line)) {
      return span('token-comment', escapeHtml(line));
    }

    const e = escapeHtml(line);

    return e
      // Template literals (simplified — single-line backtick strings)
      .replace(/(`)([^`]*?)(`)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      // Double-quoted strings
      .replace(/(&quot;)([^&]*?)(&quot;)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      // Single-quoted strings
      .replace(/(')(.*?)(')/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      // Keywords
      .replace(KEYWORDS, kw => span('token-keyword', kw))
      // Numbers (standalone)
      .replace(/\b(\d+\.?\d*)\b/g, n => span('token-number', n));
  }).join('\n');
}

function highlightPhp(raw: string): string {
  const KEYWORDS = /\b(class|function|public|private|protected|return|if|else|try|catch|throw|new|use|namespace|extends|implements|abstract|static|readonly|array|string|int|float|bool|void|null|true|false)\b/g;

  return raw.split('\n').map(line => {
    // Comment lines
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
      return span('token-comment', escapeHtml(line));
    }

    const e = escapeHtml(line);

    return e
      // Double-quoted strings
      .replace(/(&quot;)([^&]*?)(&quot;)/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      // Single-quoted strings
      .replace(/(')(.*?)(')/g,
        (_m, q1, content, q2) => span('token-string', `${q1}${content}${q2}`),
      )
      // Keywords
      .replace(KEYWORDS, kw => span('token-keyword', kw))
      // PHP variables ($var)
      .replace(/(\$[a-zA-Z_][a-zA-Z0-9_]*)/g, v => span('token-variable', v))
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, n => span('token-number', n));
  }).join('\n');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

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
    // Plain text / unknown language — escape only, no spans
    highlighted = escapeHtml(code);
  }

  // All text content is HTML-escaped before being wrapped in spans,
  // so innerHTML here is safe from XSS.
  element.innerHTML = highlighted;
}
</script>

<style scoped>
.code-block {
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--code-bg, var(--surface-1));
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

/* Syntax Highlighting Tokens — dark mode defaults */
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
  color: var(--text-muted);
  font-style: italic;
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

/* Syntax Highlighting Tokens — light mode overrides */
html:not(.dark) :deep(.token-key) {
  color: #1d4ed8;
}

html:not(.dark) :deep(.token-string) {
  color: #16a34a;
}

html:not(.dark) :deep(.token-number) {
  color: #dc2626;
}

html:not(.dark) :deep(.token-boolean) {
  color: #9333ea;
}

html:not(.dark) :deep(.token-keyword) {
  color: #9333ea;
}

html:not(.dark) :deep(.token-flag) {
  color: #b45309;
}

html:not(.dark) :deep(.token-variable) {
  color: #dc2626;
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
