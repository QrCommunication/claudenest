import { ref, watch, onMounted, onUnmounted } from 'vue';

type Theme = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'claudenest-theme';

// Singleton refs shared across all instances of useTheme
const theme = ref<Theme>('dark');
const isDark = ref(true);

export function useTheme() {
  let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
  let mediaQuery: MediaQueryList | null = null;

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDark.value = prefersDark;
    } else {
      isDark.value = newTheme === 'dark';
    }

    if (isDark.value) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (savedTheme) {
      theme.value = savedTheme;
    }
    applyTheme(theme.value);
  };

  onMounted(() => {
    initTheme();

    // Listen for system theme changes
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQueryListener = (e: MediaQueryListEvent) => {
      if (theme.value === 'system') {
        isDark.value = e.matches;
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', mediaQueryListener);
  });

  onUnmounted(() => {
    // Cleanup media query listener
    if (mediaQuery && mediaQueryListener) {
      mediaQuery.removeEventListener('change', mediaQueryListener);
      mediaQueryListener = null;
      mediaQuery = null;
    }
  });

  watch(theme, applyTheme);

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}
