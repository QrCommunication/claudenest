/**
 * i18n entry point. The device language is detected once at module load
 * (EN/FR, default EN) — the app has no in-app language switcher, so a constant
 * binding is enough. `useTranslation()` mirrors the react-i18next shape so call
 * sites read naturally and a future swap to a real lib stays mechanical.
 */

import { detectLang, translate, type Lang } from "./translate";

export type { Lang } from "./translate";
export { translate, detectLang } from "./translate";

const LANG: Lang = detectLang();

/** Translate `key` in the device language with optional `{placeholder}` params. */
export function t(
  key: string,
  params?: Record<string, string | number>,
): string {
  return translate(LANG, key, params);
}

/** react-i18next-style hook: `const { t } = useTranslation();`. */
export function useTranslation(): {
  t: (key: string, params?: Record<string, string | number>) => string;
  lang: Lang;
} {
  return { t, lang: LANG };
}
