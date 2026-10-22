import { createContext, useContext } from "react";
import type { Language } from "./translate";

export const LanguageContext = createContext({
  language: "es" as Language,
  setLanguage: (_language: Language) => {},
  t: (source: string) => source,
});
export const useLanguage = () => useContext(LanguageContext);
