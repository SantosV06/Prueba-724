import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Globe2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { isLanguage, languageOptions } from "@/lib/i18n/translate";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={!ready}
          aria-label={`${t("Idioma")}: ${languageOptions.find((option) => option.code === language)?.label}`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-full border border-line px-2 text-xs font-bold text-navy hover:bg-navy/5 focus-visible:outline-2 focus-visible:outline-gold dark:border-white/20 dark:text-cream dark:hover:bg-white/10"
        >
          <Globe2 className="size-4" aria-hidden="true" />
          <span>{language.toUpperCase()}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          aria-label="Español / English / Português"
          className="z-50 min-w-40 rounded-xl border border-line bg-paper p-1 text-navy shadow-xl dark:border-white/20 dark:bg-navy-deep dark:text-cream"
        >
          <DropdownMenu.RadioGroup
            value={language}
            onValueChange={(value) => {
              if (isLanguage(value)) setLanguage(value);
            }}
          >
            {languageOptions.map((option) => (
              <DropdownMenu.RadioItem
                key={option.code}
                value={option.code}
                lang={option.code}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none focus:bg-navy/5 data-[state=checked]:font-bold dark:focus:bg-white/10"
              >
                <span className="w-4">
                  <DropdownMenu.ItemIndicator>
                    <Check className="size-4" aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </span>
                {option.label}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
