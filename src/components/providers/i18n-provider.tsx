"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getDictionary,
  translate,
  type Dictionary,
} from "@/lib/i18n";
import type { AppLanguage } from "@/types/finance";

interface I18nContextValue {
  locale: AppLanguage;
  direction: "ltr" | "rtl";
  dictionary: Dictionary;
  t: (key: string, fallback?: string) => string;
  setLocale: (locale: AppLanguage) => void;
}

interface I18nProviderProps {
  children: ReactNode;
  initialLocale: AppLanguage;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: I18nProviderProps) {
  const [locale, setLocale] =
    useState<AppLanguage>(initialLocale);

  const dictionary = useMemo(
    () => getDictionary(locale),
    [locale],
  );

  const direction: I18nContextValue["direction"] =
    locale === "ar" ? "rtl" : "ltr";

  const t = useCallback(
    (key: string, fallback?: string) =>
      translate(dictionary, key, fallback),
    [dictionary],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction,
      dictionary,
      t,
      setLocale,
    }),
    [locale, direction, dictionary, t],
  );

  return (
    <I18nContext.Provider value={value}>
      <div
        dir={direction}
        lang={locale}
        className="min-h-screen"
      >
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error(
      "useI18n must be used inside I18nProvider.",
    );
  }

  return context;
}
