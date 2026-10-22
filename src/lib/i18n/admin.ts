import { useLanguage } from "./context";
import { adminCatalog } from "./admin-catalog";

export function useAdminLanguage() {
  const context = useLanguage();
  return {
    ...context,
    t: (source: string) => {
      if (context.language === "es") return source;
      return (
        adminCatalog[source.replace(/\s+/g, " ").trim()]?.[context.language === "en" ? 0 : 1] ??
        context.t(source)
      );
    },
  };
}
