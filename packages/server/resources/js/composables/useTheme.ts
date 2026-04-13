import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'claudenest-theme';
const VALID_THEMES: Theme[] = ['dark', 'light', 'system'];

// Singleton refs shared across all instances of useTheme
const theme = ref<Theme>('dark');
const systemTheme = ref<ResolvedTheme>('dark');

// Singleton media query listener (one per app)
let mediaQuery: MediaQueryList | null = null;
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
let listenerRefCount = 0;

// ── Pure helpers ──────────────────────────────────────────────────────────────

function loadStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && (VALID_THEMES as string[]).includes(stored)
    ? (stored as Theme)
    : null;
}

function detectSystemTheme(mq: MediaQueryList): ResolvedTheme {
  return mq.matches ? 'dark' : 'light';
}

function applyThemeToDOM(resolved: ResolvedTheme): void {
  const html = document.documentElement;
  html.setAttribute('data-theme', resolved);
  html.classList.toggle('dark', resolved === 'dark');
}

function createMediaQueryListener(
  onSystemChange: (resolved: ResolvedTheme) => void,
): (e: MediaQueryListEvent) => void {
  return (e: MediaQueryListEvent) => {
    onSystemChange(e.matches ? 'dark' : 'light');
  };
}

// ── Media query lifecycle (singleton) ────────────────────────────────────────

function attachMediaQueryListener(onSystemChange: (resolved: ResolvedTheme) => void): void {
  if (listenerRefCount === 0) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemTheme.value = detectSystemTheme(mediaQuery);

    mediaQueryListener = createMediaQueryListener(onSystemChange);
    mediaQuery.addEventListener('change', mediaQueryListener);
  } else if (mediaQuery) {
    // Listener already attached — sync current value only
    systemTheme.value = detectSystemTheme(mediaQuery);
  }

  listenerRefCount++;
}

function detachMediaQueryListener(): void {
  if (listenerRefCount > 0) {
    listenerRefCount--;
  }

  if (listenerRefCount === 0 && mediaQuery && mediaQueryListener) {
    mediaQuery.removeEventListener('change', mediaQueryListener);
    mediaQuery = null;
    mediaQueryListener = null;
  }
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useTheme() {
  const resolvedTheme = computed<ResolvedTheme>(() =>
    theme.value === 'system' ? systemTheme.value : theme.value,
  );

  const isDark = computed(() => resolvedTheme.value === 'dark');

  function applyTheme(): void {
    applyThemeToDOM(resolvedTheme.value);
  }

  function setTheme(newTheme: Theme): void {
    theme.value = newTheme;
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme();
  }

  function toggleTheme(): void {
    const next: Record<Theme, Theme> = { dark: 'light', light: 'system', system: 'dark' };
    setTheme(next[theme.value]);
  }

  function initTheme(): void {
    const stored = loadStoredTheme();
    if (stored) {
      theme.value = stored;
    }

    attachMediaQueryListener((resolved) => {
      systemTheme.value = resolved;
      if (theme.value === 'system') {
        applyTheme();
      }
    });

    applyTheme();
  }

  // Apply theme whenever resolvedTheme changes (e.g. system preference flip)
  watch(resolvedTheme, applyTheme);

  onMounted(initTheme);
  onUnmounted(detachMediaQueryListener);

  return {
    theme,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  };
}
