import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { isLanguage, translate, type Language } from "./translate";

import { LanguageContext, useLanguage } from "./context";

const KEY = "vne-language";
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Spanish on the server and during hydration; restore the preference after mounting.
  const [language, updateLanguage] = useState<Language>("es");
  const matches = useRouterState({ select: (state) => state.matches });
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (isLanguage(saved)) updateLanguage(saved);
    } catch {
      /* Browsing and language selection still work when storage is blocked. */
    }
  }, []);
  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* Session-only preference. */
    }
  }, []);
  const t = useCallback((source: string) => translate(source, language), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  useEffect(() => {
    document.documentElement.lang = language;
    // Use the route's authoritative Spanish metadata, not the previously translated DOM.
    const metadata = matches.flatMap((match) => match.meta ?? []) as {
      title?: string;
      name?: string;
      content?: string;
    }[];
    const title = [...metadata].reverse().find((entry) => entry.title)?.title;
    const description = [...metadata]
      .reverse()
      .find((entry) => entry.name === "description")?.content;
    if (title)
      document.title =
        t(title) === title && title.endsWith(" | Fundación VNE")
          ? `${t(title.slice(0, -" | Fundación VNE".length))} | Fundación VNE`
          : t(title);
    if (description)
      document.querySelector('meta[name="description"]')?.setAttribute("content", t(description));
  }, [language, matches, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
/** React text only: no DOM rewrites, injected HTML, translated URLs or changes to form values. */
export function T({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return typeof children === "string" ? t(children) : children;
}
