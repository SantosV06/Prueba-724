import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Menu, Moon, Phone, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { legalLinks, nav, org } from "@/data/site";

function Mark({ className = "size-9" }: { className?: string }) {
  return (
    <img
      src="/favicon.svg?v=2"
      alt="Emblema del árbol de Fundación VNE"
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
    localStorage.setItem("vne-theme", next ? "dark" : "light");
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
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido">{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md dark:border-white/10 dark:bg-navy-deep/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <Mark />
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[15px] font-semibold tracking-tight text-navy dark:text-cream">
              Fundación VNE
            </span>
            <span className="hidden text-xs text-mist sm:block dark:text-cream/70">Venezuela Nueva Esperanza</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Principal">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-full px-3 py-2 text-sm font-semibold"
              inactiveProps={{ className: "text-navy/80 hover:bg-navy/5 dark:text-cream/80 dark:hover:bg-white/10" }}
              activeProps={{ className: "bg-navy text-cream hover:bg-navy-mid dark:bg-gold dark:text-navy dark:hover:bg-gold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? "Usar tema claro" : "Usar tema oscuro"}
            className="grid size-11 place-items-center rounded-full text-navy hover:bg-navy/5 dark:text-cream dark:hover:bg-white/10"
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <Link
            to="/donaciones"
            className="hidden h-11 items-center rounded-full bg-navy px-4 text-sm font-semibold text-cream sm:inline-flex dark:bg-gold dark:text-navy"
          >
            Donar
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-navy lg:hidden dark:text-cream"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">Menú</span>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="menu-movil" className="border-t border-line bg-paper px-4 py-3 lg:hidden dark:border-white/10 dark:bg-navy-deep" aria-label="Móvil">
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-semibold"
                  inactiveProps={{ className: "text-navy hover:bg-navy/5 dark:text-cream dark:hover:bg-white/10" }}
                  activeProps={{ className: "bg-navy text-cream hover:bg-navy-mid dark:bg-gold dark:text-navy dark:hover:bg-gold" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/donaciones"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg bg-navy px-3 py-3 text-center text-base font-semibold text-cream dark:bg-gold dark:text-navy"
              >
                Donar
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 bg-navy text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="font-display text-lg text-gold">Contacto</h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/80">Administración y atención</p>
          <a className="mt-1 inline-flex items-center gap-2 text-sm font-semibold" href={`tel:${org.adminTel}`}>
            <Phone className="size-4 text-gold" aria-hidden="true" />
            {org.adminPhone}
          </a>
          <p className="mt-4 text-sm leading-relaxed text-cream/80">Oficina ejecutiva</p>
          <a className="mt-1 inline-flex items-center gap-2 text-sm font-semibold" href={`tel:${org.executiveTel}`}>
            <Phone className="size-4 text-gold" aria-hidden="true" />
            {org.executivePhone}
          </a>
          <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold" href={`mailto:${org.email}`}>
            <Mail className="size-4 text-gold" aria-hidden="true" />
            {org.email}
          </a>
          <div className="mt-5 flex gap-2">
            <a
              href={org.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de Fundación VNE"
              className="grid size-11 place-items-center rounded-full border border-gold/50"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href={`https://wa.me/${org.adminTel.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp de administración"
              className="grid size-11 place-items-center rounded-full border border-gold/50 text-xs font-bold"
            >
              WA
            </a>
            <Link to="/donaciones" aria-label="Donar por Zelle" className="grid size-11 place-items-center rounded-full border border-gold/50 text-xs font-bold">
              Zelle
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-gold">La organización</h2>
          <p className="mt-4 text-sm leading-7 text-cream/85">
            {org.name}
            <br />
            LLC con propósito social
            <br />
            Registrada en el Estado de Nueva York — {org.founded}
          </p>
          <p className="mt-4 text-sm leading-7 text-cream/85">
            {org.addressNy}
            <br />
            EIN: {org.ein}
          </p>
          <h3 className="mt-6 font-display text-base text-gold">Horario</h3>
          <p className="mt-2 text-sm leading-7 text-cream/85">{org.hours}</p>
        </div>

        <div>
          <h2 className="font-display text-lg text-gold">Cumplimiento</h2>
          <p className="mt-4 text-sm leading-7 text-cream/80">
            Operamos conforme a las regulaciones federales y estatales aplicables, con estándares internos de gobernanza, rendición de cuentas y transparencia.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {legalLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-gold underline-offset-4 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/solicitudes" className="text-cream/70 underline-offset-4 hover:underline">
                Solicitudes guardadas en este navegador
              </Link>
            </li>
          </ul>
          <p className="mt-8 font-display text-2xl tracking-tight text-gold">VNE</p>
        </div>
      </div>
      <div className="bg-card px-5 py-4 text-center text-xs leading-5 text-ink">
        © 2022–2026 {org.name}. Todos los derechos reservados.
        <br />
        Este sitio es informativo y no constituye un compromiso legal ni financiero.
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
        <p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">{kicker}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.15] font-semibold text-balance sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-cream/85">{lede}</p>
      </div>
    </section>
  );
}
