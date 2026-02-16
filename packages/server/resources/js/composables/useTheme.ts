import { ref, computed, watch, onMounted } from 'vue';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'claudenest-theme';

const theme = ref<Theme>('dark');
const systemTheme = ref<ResolvedTheme>('dark');

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

    // Detect system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemTheme.value = mediaQuery.matches ? 'dark' : 'light';

    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
      systemTheme.value = e.matches ? 'dark' : 'light';
      if (theme.value === 'system') {
        applyTheme();
      }
    });

    // Apply initial theme
    applyTheme();
  };

  // Watch for theme changes
  watch(resolvedTheme, () => {
    applyTheme();
  });

  // Initialize on composable creation
  onMounted(() => {
    initTheme();
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
