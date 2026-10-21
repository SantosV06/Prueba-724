import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const themeBoot = `(function(){try{if(localStorage.getItem("vne-theme")==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export const Route = createRootRoute({
  head: ({ matches }) => ({
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
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", sizes: "any", href: "/favicon.svg?v=3" },
      ...(__SITE_ORIGIN__
        ? [{ rel: "canonical", href: `${__SITE_ORIGIN__}${matches.at(-1)?.pathname ?? "/"}` }]
        : []),
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
