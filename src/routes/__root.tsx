import { getDefaultLanguage } from "@/lib/i18n/default-language";
import { preferredLanguage } from "@/lib/i18n/preference";
import { requestNonce } from "@/lib/csp-nonce";
import { languageFromSearch, languageHref, localizedHead } from "@/lib/i18n/seo";
import { isLanguage } from "@/lib/i18n/translate";
import {
  createRootRoute,
  redirect,
  HeadContent,
  Outlet,
  Scripts,
  retainSearchParams,
  useRouterState,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { LanguageProvider } from "@/lib/i18n";
import appCss from "../styles.css?url";

const themeBoot = `(function(){try{if(localStorage.getItem("vne-theme")==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>): { lang?: "es" | "en" | "pt" } => ({
    lang: isLanguage(search.lang) ? search.lang : preferredLanguage(),
  }),
  beforeLoad: async ({ location, search }) => {
    if (isLanguage(search.lang)) return;
    const language = await getDefaultLanguage();
    if (language !== "es")
      throw redirect({
        to: location.pathname,
        search: { ...search, lang: language },
        replace: true,
      });
  },
  search: { middlewares: [retainSearchParams(["lang"])] },
  head: ({ matches }) =>
    localizedHead(
      {
        meta: [
          { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { title: "Fundación VNE | Desarrollo social y económico sostenible" },
          {
            name: "description",
            content:
              "Fundación Venezuela Nueva Esperanza. Proyectos productivos, Casas VNE y Proyecto Génesis para autonomía y desarrollo sostenible.",
          },
          { name: "theme-color", content: "#131e3d" },
          ...(requestNonce() ? [{ name: "vne-csp-nonce", content: requestNonce()! }] : []),
        ],
        links: [
          { rel: "icon", type: "image/svg+xml", sizes: "any", href: "/favicon.svg?v=3" },
          ...(__SITE_ORIGIN__
            ? [
                {
                  rel: "canonical",
                  href: languageHref(
                    __SITE_ORIGIN__,
                    matches.at(-1)?.pathname ?? "/",
                    languageFromSearch(matches.at(-1)?.search ?? {}),
                  ),
                },
              ]
            : []),
          ...(__SITE_ORIGIN__ && matches.at(-1)?.pathname !== "/solicitudes"
            ? ["es", "en", "pt", "x-default"].map((lang) => ({
                rel: "alternate",
                hrefLang: lang,
                href:
                  lang === "x-default"
                    ? `${__SITE_ORIGIN__}${matches.at(-1)?.pathname ?? "/"}`
                    : languageHref(
                        __SITE_ORIGIN__,
                        matches.at(-1)?.pathname ?? "/",
                        lang === "en" || lang === "pt" ? lang : "es",
                      ),
              }))
            : []),
          { rel: "stylesheet", href: appCss },
        ],
      },
      matches.at(-1)?.search ?? {},
    ),
  component: RootDocument,
});
function RootDocument() {
  const search = useRouterState({ select: (state) => state.matches.at(-1)?.search ?? {} });
  return (
    <html lang={languageFromSearch(search)} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script nonce={requestNonce()} dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <LanguageProvider>
          <Outlet />
        </LanguageProvider>
        <Analytics beforeSend={(event) => (event.url.includes("/solicitudes") ? null : event)} />
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  );
}
