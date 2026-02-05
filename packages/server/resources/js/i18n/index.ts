import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

export type SupportedLocale = 'en' | 'fr';

// Get saved locale from localStorage or detect from browser
function getDefaultLocale(): SupportedLocale {
  // Check localStorage first
  const saved = localStorage.getItem('claudenest-locale');
  if (saved && ['en', 'fr'].includes(saved)) {
    return saved as SupportedLocale;
  }
  
  // Detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'fr') {
    return 'fr';
  }
  
  return 'en';
}

export const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    fr,
  },
  // Missing key warning
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
});

// Helper to change locale
export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem('claudenest-locale', locale);
  document.documentElement.setAttribute('lang', locale);
}

// Helper to get current locale
export function getLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale;
}

// Available locales with labels
export const availableLocales: Array<{ code: SupportedLocale; name: string; flag: string }> = [
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'fr', name: 'Francais', flag: 'FR' },
];

export default i18n;
