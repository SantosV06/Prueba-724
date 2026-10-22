import { isLanguage, translate, type Language } from "./translate";
export function languageFromSearch(search: Record<string, unknown>): Language {
  return isLanguage(search.lang) ? search.lang : "es";
}
export function languageHref(origin: string, path: string, language: Language) {
  return `${origin}${path}${language === "es" ? "" : `?lang=${language}`}`;
}
export function localizedHead<
  T extends {
    meta?: { title?: string; name?: string; content?: string; [key: string]: unknown }[];
  },
>(head: T, search: Record<string, unknown>): T {
  const language = languageFromSearch(search);
  return {
    ...head,
    meta: head.meta?.map((meta) => ({
      ...meta,
      ...(meta.title ? { title: localizedTitle(meta.title, language) } : {}),
      ...(meta.name === "description" && meta.content
        ? { content: translate(meta.content, language) }
        : {}),
    })),
  };
}
function localizedTitle(title: string, language: Language) {
  const translated = translate(title, language);
  const suffix = " | Fundación VNE";
  return translated === title && title.endsWith(suffix)
    ? `${translate(title.slice(0, -suffix.length), language)}${suffix}`
    : translated;
}
