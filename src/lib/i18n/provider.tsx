import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { isLanguage, translate, type Language } from "./translate";

import { LanguageContext, useLanguage } from "./context";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const search = useRouterState({ select: (state) => state.matches.at(-1)?.search ?? {} });
  const language: Language = isLanguage(search.lang) ? search.lang : "es";
  const matches = useRouterState({ select: (state) => state.matches });
  const setLanguage = useCallback(
    (next: Language) => {
      try {
        document.cookie = `vne-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      } catch {
        /* The explicit language URL remains usable when cookies are blocked. */
      }
      void navigate({
        to: ".",
        search: (previous) => ({ ...previous, lang: next }),
        replace: true,
      });
    },
    [navigate],
  );
  const t = useCallback((source: string) => translate(source, language), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  useEffect(() => {
    document.documentElement.lang = language;
    // Use authoritative route metadata rather than previously modified DOM content.
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
