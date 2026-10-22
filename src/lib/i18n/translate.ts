import { catalog } from "./catalog.ts";

export type Language = "es" | "en" | "pt";
export const languageOptions = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
] as const;
export function isLanguage(value: unknown): value is Language {
  return value === "es" || value === "en" || value === "pt";
}
export function translate(source: string, language: Language) {
  if (language === "es") return source;
  const key = source.replace(/\s+/g, " ").trim();
  const translated = catalog[key]?.[language === "en" ? 0 : 1];
  if (translated === undefined) return source;
  return (source.match(/^\s*/)?.[0] ?? "") + translated + (source.match(/\s*$/)?.[0] ?? "");
}
