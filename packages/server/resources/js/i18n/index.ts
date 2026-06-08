import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

export type SupportedLocale = 'en' | 'fr';

const LOCALE_STORAGE_KEY = 'claudenest-locale';

// Default to the user's explicit choice (saved via the language selector),
// otherwise fall back to the browser language, otherwise English.
function getDefaultLocale(): SupportedLocale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved && ['en', 'fr'].includes(saved)) {
    return saved as SupportedLocale;
  }

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
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
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
