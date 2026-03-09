import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'claudenest-theme';

// Singleton refs shared across all instances of useTheme
const theme = ref<Theme>('dark');
const systemTheme = ref<ResolvedTheme>('dark');

// Singleton media query listener (one per app)
let mediaQuery: MediaQueryList | null = null;
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
let listenerRefCount = 0;

export function useTheme() {
  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (theme.value === 'system') {
      return systemTheme.value;
    }
    return theme.value;
  });

  const isDark = computed(() => resolvedTheme.value === 'dark');

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme();
  };

  const toggleTheme = () => {
    if (theme.value === 'dark') {
      setTheme('light');
    } else if (theme.value === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const applyTheme = () => {
    const html = document.documentElement;
    const resolved = resolvedTheme.value;

    // Set data-theme attribute
    html.setAttribute('data-theme', resolved);

    // Set dark class for Tailwind
    if (resolved === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const initTheme = () => {
    // Load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ['dark', 'light', 'system'].includes(stored)) {
      theme.value = stored;
    }

    // Set up singleton media query listener (only once across all component instances)
    if (listenerRefCount === 0) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      systemTheme.value = mediaQuery.matches ? 'dark' : 'light';

      mediaQueryListener = (e: MediaQueryListEvent) => {
        systemTheme.value = e.matches ? 'dark' : 'light';
        if (theme.value === 'system') {
          applyTheme();
        }
      };

      mediaQuery.addEventListener('change', mediaQueryListener);
    } else if (mediaQuery) {
      // Listener already attached; just sync the current system value
      systemTheme.value = mediaQuery.matches ? 'dark' : 'light';
    }

    listenerRefCount++;

    // Apply initial theme
    applyTheme();
  };

  const cleanupTheme = () => {
    if (listenerRefCount > 0) {
      listenerRefCount--;
    }
    if (listenerRefCount === 0 && mediaQuery && mediaQueryListener) {
      mediaQuery.removeEventListener('change', mediaQueryListener);
      mediaQuery = null;
      mediaQueryListener = null;
    }
  };

  // Watch for theme changes
  watch(resolvedTheme, () => {
    applyTheme();
  });

  // Initialize on composable creation and clean up on unmount
  onMounted(() => {
    initTheme();
  });

  onUnmounted(() => {
    cleanupTheme();
  });

  return {
    theme,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  };
}
