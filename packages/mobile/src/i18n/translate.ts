/**
 * Minimal, dependency-free i18n core for the mobile app.
 *
 * The project ships no i18next/expo-localization (and the sandbox can't install
 * them), so this is a tiny self-contained layer: a pure `translate()` (testable
 * in isolation), a Hermes-safe device-locale detector, and `t()` bound to the
 * detected language. Keys are flat dotted strings; `{name}` placeholders are
 * interpolated. Missing keys fall back to English, then to the raw key.
 */

import { en } from "./en";
import { fr } from "./fr";

export type Lang = "en" | "fr";

export type Translations = Record<string, string>;

const RESOURCES: Record<Lang, Translations> = { en, fr };

/**
 * Pure translation: resolve `key` in `lang` (fallback en → raw key) and
 * interpolate `{placeholder}` tokens. Kept pure so it can be unit-tested
 * without touching device APIs.
 */
export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string {
  const template = RESOURCES[lang][key] ?? RESOURCES.en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, token: string) =>
    token in params ? String(params[token]) : `{${token}}`,
  );
}

/**
 * Detect the device language. Uses `Intl` (available in Hermes on Expo SDK 54)
 * and falls back to English on any failure or unsupported locale.
 */
export function detectLang(): Lang {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale ?? "en";
    return locale.toLowerCase().startsWith("fr") ? "fr" : "en";
  } catch {
    return "en";
  }
}
