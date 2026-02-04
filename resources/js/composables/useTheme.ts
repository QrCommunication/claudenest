import { ref, watch, onMounted } from 'vue';

type Theme = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'claudenest-theme';

const theme = ref<Theme>('dark');
const isDark = ref(true);

export function useTheme() {
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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (theme.value === 'system') {
        isDark.value = e.matches;
        applyTheme('system');
      }
    });
  });

  watch(theme, applyTheme);

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}
