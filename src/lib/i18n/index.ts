import ar from "@/lib/i18n/ar.json";
import en from "@/lib/i18n/en.json";
import type { AppLanguage } from "@/types/finance";

export const dictionaries = { en, ar } as const;
export type Dictionary = typeof en;

export function getDictionary(language: AppLanguage): Dictionary {
  return dictionaries[language] as Dictionary;
}

export function translate(
  dictionary: Dictionary,
  key: string,
  fallback = key,
): string {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, dictionary);

  return typeof value === "string" ? value : fallback;
}
