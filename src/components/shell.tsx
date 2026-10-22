import { T, useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "./language-selector";
import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Menu, Moon, Phone, Sun, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { legalLinks, nav, org } from "@/data/site";
import { media } from "@/data/media";

function Mark({ className = "size-9" }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <img
      src="/favicon.svg?v=3"
      alt={t("Emblema del árbol de Fundación VNE")}
      className={`shrink-0 rounded-full object-contain ${className}`}
      width={36}
      height={36}
    />
  );
}

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("vne-theme", next ? "dark" : "light");
    } catch {
      /* Storage may be blocked by the browser. */
    }
    setDark(next);
  }

  return { dark, toggle };
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-navy"
      >
        <T>Saltar al contenido</T>
      </a>
      <Header />
      <main id="contenido">{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  const { t } = useLanguage();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1280px)");
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuPanel.current?.querySelector<HTMLElement>("a")?.focus();
    const close = () => setOpen(false);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        menuButton.current?.focus();
      }
    };
    // This is a navigation disclosure, not a modal: Tab remains free to leave it.
    const focus = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !menuPanel.current?.contains(event.target) &&
        !menuButton.current?.contains(event.target)
      )
        close();
    };
    document.addEventListener("keydown", keyboard);
    document.addEventListener("focusin", focus);
    desktop.addEventListener("change", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("focusin", focus);
      desktop.removeEventListener("change", close);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md dark:border-white/10 dark:bg-navy-deep/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <Mark />
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-sm sm:text-[15px] font-semibold tracking-tight text-navy dark:text-cream">
              <T>Fundación VNE</T>
            </span>
            <span className="hidden text-xs text-mist sm:block dark:text-cream/70">
              <T>Venezuela Nueva Esperanza</T>
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label={t("Principal")}>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3 py-2 text-sm font-semibold"
              inactiveProps={{
                className: "text-navy/80 hover:bg-navy/5 dark:text-cream/80 dark:hover:bg-white/10",
              }}
              activeProps={{
                className:
                  "bg-navy text-cream hover:bg-navy-mid dark:bg-gold dark:text-navy dark:hover:bg-gold",
              }}
            >
              <T>{item.label}</T>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 xl:ml-3">
          <LanguageSelector />
          <button
            type="button"
            onClick={toggle}
            aria-label={t(dark ? "Usar tema claro" : "Usar tema oscuro")}
            className="grid size-11 place-items-center rounded-full text-navy hover:bg-navy/5 dark:text-cream dark:hover:bg-white/10"
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <Link
            to="/donaciones"
            className="hidden h-11 items-center rounded-full bg-navy px-4 text-sm font-semibold text-cream sm:inline-flex dark:bg-gold dark:text-navy"
          >
            <T>Donar</T>
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-navy xl:hidden dark:text-cream"
            ref={menuButton}
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">
              <T>Menú</T>
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          ref={menuPanel}
          id="menu-movil"
          className="border-t border-line bg-paper px-4 py-3 xl:hidden dark:border-white/10 dark:bg-navy-deep"
          aria-label={t("Móvil")}
        >
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-semibold"
                  inactiveProps={{
                    className: "text-navy hover:bg-navy/5 dark:text-cream dark:hover:bg-white/10",
                  }}
                  activeProps={{
                    className:
                      "bg-navy text-cream hover:bg-navy-mid dark:bg-gold dark:text-navy dark:hover:bg-gold",
                  }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  <T>{item.label}</T>
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/donaciones"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg bg-navy px-3 py-3 text-center text-base font-semibold text-cream dark:bg-gold dark:text-navy"
              >
                <T>Donar</T>
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-20 bg-navy text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="font-display text-lg text-gold">
            <T>Contacto</T>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/80">
            <T>Administración y atención</T>
          </p>
          <a
            className="mt-1 inline-flex items-center gap-2 text-sm font-semibold"
            href={`tel:${org.adminTel}`}
          >
            <Phone className="size-4 text-gold" aria-hidden="true" />
            <T>{org.adminPhone}</T>
          </a>
          <p className="mt-4 text-sm leading-relaxed text-cream/80">
            <T>Oficina ejecutiva</T>
          </p>
          <a
            className="mt-1 inline-flex items-center gap-2 text-sm font-semibold"
            href={`tel:${org.executiveTel}`}
          >
            <Phone className="size-4 text-gold" aria-hidden="true" />
            <T>{org.executivePhone}</T>
          </a>
          <a
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
            href={`mailto:${org.email}`}
          >
            <Mail className="size-4 text-gold" aria-hidden="true" />
            <T>{org.email}</T>
          </a>
          <div className="mt-5 flex gap-2">
            <a
              href={org.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label={t("Instagram de Fundación VNE")}
              className="grid size-11 place-items-center rounded-full border border-gold/50"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href={`https://wa.me/${org.adminTel.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              aria-label={t("WhatsApp de administración")}
              className="grid size-11 place-items-center rounded-full border border-gold/50 text-xs font-bold"
            >
              <T>WA</T>
            </a>
            <Link
              to="/donaciones"
              aria-label={t("Donar por Zelle")}
              className="grid size-11 place-items-center rounded-full border border-gold/50 text-xs font-bold"
            >
              <T>Zelle</T>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-gold">
            <T>La organización</T>
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/85">
            <T>{org.name}</T>
            <br />
            <T>LLC con propósito social</T>
            <br />
            <T>Registrada en el Estado de Nueva York — </T>
            <T>{org.founded}</T>
          </p>
          <p className="mt-4 text-sm leading-7 text-cream/85">
            <T>{org.addressNy}</T>
            <br />
            <T>EIN: </T>
            <T>{org.ein}</T>
          </p>
          <h3 className="mt-6 font-display text-base text-gold">
            <T>Horario</T>
          </h3>
          <p className="mt-2 text-sm leading-7 text-cream/85">
            <T>{org.hours}</T>
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg text-gold">
            <T>Cumplimiento</T>
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/80">
            <T>
              Operamos conforme a las regulaciones federales y estatales aplicables, con estándares
              internos de gobernanza, rendición de cuentas y transparencia.
            </T>
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {legalLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-gold underline-offset-4 hover:underline">
                  <T>{item.label}</T>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/solicitudes" className="text-cream/70 underline-offset-4 hover:underline">
                <T>Administración de solicitudes</T>
              </Link>
            </li>
          </ul>
          <Link
            to="/"
            aria-label={t("Ir al inicio de Fundación VNE")}
            className="mt-8 inline-block max-w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            <img
              src={media.logo}
              alt={t("Logo completo de Fundación VNE")}
              loading="lazy"
              decoding="async"
              width={256}
              height={107}
              className="h-auto w-60 max-w-full rounded-md object-contain"
            />
          </Link>
        </div>
      </div>
      <div className="bg-card px-5 py-4 text-center text-xs leading-5 text-ink">
        <T>© 2022–2026 </T>
        <T>{org.name}</T>
        <T>. Todos los derechos reservados.</T>
        <br />
        <T>Este sitio es informativo y no constituye un compromiso legal ni financiero.</T>
      </div>
    </footer>
  );
}

export function PageIntro({
  kicker,
  title,
  lede,
  tone = "navy",
}: {
  kicker: string;
  title: string;
  lede: string;
  tone?: "navy" | "forest";
}) {
  const bg = tone === "forest" ? "bg-forest" : "bg-navy";
  return (
    <section className={`${bg} text-cream`}>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">
          <T>{kicker}</T>
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.15] font-semibold text-balance sm:text-5xl">
          <T>{title}</T>
        </h1>
        <p className="editorial-justify mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">
          <T>{lede}</T>
        </p>
      </div>
    </section>
  );
}
