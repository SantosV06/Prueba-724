import { useEffect, useState } from "react";
import { ChevronDown, Globe2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { isLanguage, languageOptions } from "@/lib/i18n/translate";

/** Native selection supports keyboard and mobile pickers without a dropdown runtime. */
export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <label className="relative inline-flex h-11 shrink-0 items-center gap-1 rounded-full border border-line px-2 text-xs font-bold text-navy hover:bg-navy/5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold dark:border-white/20 dark:text-cream dark:hover:bg-white/10">
      <Globe2 className="pointer-events-none size-4" aria-hidden="true" />
      <span aria-hidden="true">{language.toUpperCase()}</span>
      <ChevronDown className="pointer-events-none size-3" aria-hidden="true" />
      <select
        disabled={!ready}
        value={language}
        aria-label={t("Idioma")}
        onChange={(event) => {
          if (isLanguage(event.target.value)) setLanguage(event.target.value);
        }}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {languageOptions.map((option) => (
          <option
            key={option.code}
            value={option.code}
            lang={option.code}
            className="bg-paper text-navy dark:bg-navy-deep dark:text-cream"
          >
            {option.code.toUpperCase()} · {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
