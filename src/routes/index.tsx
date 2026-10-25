import { localizedHead } from "@/lib/i18n/seo";
import { getPublicHomeContent } from "@/lib/home-content-functions";
import { T, useLanguage } from "@/lib/i18n";
import { MediaVideo } from "@/components/media-video";
import { media } from "@/data/media";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { org } from "@/data/site";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({
  head: ({ matches }) =>
    localizedHead(
      {
        meta: [
          { title: "Fundación VNE | Desarrollo social y económico sostenible" },
          {
            name: "description",
            content:
              "Fundación Venezuela Nueva Esperanza. Proyectos productivos, emprendimiento y autonomía a través de Casas VNE y Proyecto Génesis.",
          },
        ],
      },
      matches.at(-1)?.search ?? {},
    ),
  loader: () => getPublicHomeContent(),
  component: Home,
});

const pillars = [
  {
    n: "01",
    title: "Impacto que dura",
    text: "Desarrollo social y económico más allá de la asistencia inmediata.",
  },
  {
    n: "02",
    title: "Capacidad propia",
    text: "Fortalecimiento de habilidades productivas, autonomía y dignidad.",
  },
  {
    n: "03",
    title: "Modelos que viajan",
    text: "Estructuras escalables y replicables en distintos territorios.",
  },
  {
    n: "04",
    title: "Comunidades resilientes",
    text: "Organización inclusiva, capaz de sostenerse cuando cambia el contexto.",
  },
];

function Home() {
  const { t, language } = useLanguage();
  const content = Route.useLoaderData();
  return (
    <Shell>
      <section className="vne-hero relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-navy text-cream">
        <img
          src={media.impact}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-deep/95 via-navy/85 to-navy/45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-deep/75 via-transparent to-navy-deep/25" />
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-8">
            <p className="inline-flex items-center gap-3 text-[11px] font-bold tracking-[0.28em] text-gold uppercase">
              <span className="h-px w-8 bg-gold" />
              <T>Nueva York · Caracas · desde 2022</T>
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.8rem,7vw,6.8rem)] leading-[0.98] font-medium tracking-[-0.045em] text-balance">
              {content.title[language]}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-cream/85 sm:text-lg sm:leading-8">
              {content.description[language]}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/donaciones"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-navy transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#d4b77f]"
              >
                <T>Apoyar los proyectos</T>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/casas"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-cream/40 bg-cream/5 px-7 py-3 text-sm font-semibold text-cream backdrop-blur-sm transition-colors hover:bg-cream/10"
              >
                <T>Conocer Casas VNE</T>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/20 pt-6 text-sm text-cream/75">
              <span><strong className="font-display text-xl text-gold">01</strong><span className="ml-3"><T>Autonomía</T></span></span>
              <span><strong className="font-display text-xl text-gold">02</strong><span className="ml-3"><T>Emprendimiento</T></span></span>
              <span><strong className="font-display text-xl text-gold">03</strong><span className="ml-3"><T>Impacto sostenible</T></span></span>
            </div>
          </div>
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="ml-auto max-w-xs rounded-2xl border border-white/20 bg-navy-deep/55 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
              <p className="text-[10px] font-bold tracking-[0.24em] text-gold uppercase"><T>Una visión a largo plazo</T></p>
              <p className="mt-4 font-display text-3xl leading-tight text-cream"><T>Construir oportunidades. Crear futuro.</T></p>
              <div className="mt-6 border-t border-white/15 pt-5">
                <p className="text-xs uppercase tracking-[0.18em] text-cream/60"><T>Figura institucional</T></p>
                <p className="mt-2 text-sm font-semibold"><T>LLC con propósito social</T></p>
                <p className="mt-1 text-sm text-cream/70"><T>Registrada en Nueva York, </T><T>{org.founded}</T></p>
              </div>
            </div>
          </aside>
        </div>
        <a href="#sobre-vne" aria-label={t("Descubrir Fundación VNE")} className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[10px] font-semibold tracking-[0.2em] text-cream/65 uppercase lg:flex">
          <span className="h-px w-8 bg-gold/70" /><T>Descubrir</T><span className="h-px w-8 bg-gold/70" />
        </a>
      </section>

      <section id="sobre-vne" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-4">
          <p className="text-xs font-bold tracking-[0.2em] text-gold-deep uppercase">
            <T>Quiénes somos</T>
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-navy dark:text-cream">
            <T>Impacto real, no alivio temporal.</T>
          </h2>
        </div>
        <div className="editorial-justify space-y-5 text-lg leading-relaxed text-mist lg:col-span-8 dark:text-cream/80">
          <p>
            <T>
              Cada proyecto es una oportunidad de crear un cambio que permanezca. Trabajamos en
              soluciones productivas basadas en el emprendimiento, la autonomía y el fortalecimiento
              de capacidades individuales y colectivas.
            </T>
          </p>
          <p>
            <T>
              No buscamos resolver solo la necesidad del día. Construimos estructuras para que
              personas y comunidades se desarrollen de forma digna, autosuficiente y sostenible.
            </T>
          </p>
          <MediaVideo src={media.aboutVideo} title={t("Conoce Fundación VNE")} />
        </div>
      </section>

      <section className="border-y border-line bg-card py-2 dark:border-white/10 dark:bg-navy">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <h2 className="font-display text-3xl text-navy dark:text-cream">
            <T>Misión</T>
          </h2>
          <p className="editorial-justify mt-4 max-w-3xl text-lg leading-relaxed text-mist dark:text-cream/80">
            <T>
              Impulsar el desarrollo social y económico sostenible mediante proyectos productivos
              que fortalezcan capacidades, promuevan la autonomía y conviertan necesidades
              estructurales en oportunidades de largo plazo.
            </T>
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {pillars.map((item) => (
              <li
                key={item.n}
                className="rounded-card border border-line bg-paper p-6 dark:border-white/10 dark:bg-navy-deep"
              >
                <p className="font-display text-sm text-gold-deep">
                  <T>{item.n}</T>
                </p>
                <h3 className="mt-2 font-display text-2xl text-navy dark:text-cream">
                  <T>{item.title}</T>
                </h3>
                <p className="mt-2 leading-relaxed text-mist dark:text-cream/75">
                  <T>{item.text}</T>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <article className="flex flex-col rounded-card bg-navy p-8 text-cream">
          <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
            <T>Liderazgo</T>
          </p>
          <h2 className="mt-3 font-display text-3xl">
            <T>Wilmer Solórzano</T>
          </h2>
          <p className="editorial-justify mt-4 leading-relaxed text-cream/80">
            <T>
              CEO y fundador. Su trabajo orienta un modelo institucional de largo alcance: impacto
              real, escalable y capaz de transformar comunidades sin depender de la asistencia
              permanente.
            </T>
          </p>
          <Link
            to="/liderazgo"
            className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-gold"
          >
            <T>Estructura y equipo </T>
            <ArrowUpRight className="size-4" />
          </Link>
        </article>
        <article className="flex flex-col rounded-card border border-line bg-card p-8 dark:border-white/10 dark:bg-navy">
          <img
            src={media.houses}
            alt={t("Modelo de Casas VNE")}
            loading="lazy"
            className="mb-6 w-full rounded-card object-contain"
          />
          <p className="text-xs font-bold tracking-[0.2em] text-gold-deep uppercase">
            <T>Modelo territorial</T>
          </p>
          <h2 className="mt-3 font-display text-3xl text-navy dark:text-cream">
            <T>Casas VNE</T>
          </h2>
          <p className="editorial-justify mt-4 leading-relaxed text-mist dark:text-cream/80">
            <T>
              No son centros asistenciales. Son núcleos donde educación, emprendimiento, producción
              y colaboración forman una microeconomía comunitaria.
            </T>
          </p>
          <Link
            to="/casas"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-navy dark:text-gold"
          >
            <T>Explorar el modelo </T>
            <ArrowUpRight className="size-4" />
          </Link>
        </article>
      </section>

      <section className="bg-forest text-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">
              <T>Proyecto Génesis</T>
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight">
              <T>Inversión social que produce, se sostiene y puede replicarse.</T>
            </h2>
            <p className="editorial-justify mt-4 max-w-xl leading-relaxed text-cream/80">
              <T>
                Un piloto agroturístico en zona rural de Nueva York como núcleo productivo: validar
                el modelo, generar ingresos propios y dejar evidencia para escalarlo.
              </T>
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-start">
            <Link
              to="/genesis"
              className="inline-flex h-12 items-center rounded-full bg-cream px-6 text-sm font-bold text-forest"
            >
              <T>Leer el proyecto</T>
            </Link>
            <Link
              to="/voluntariado"
              className="inline-flex h-12 items-center rounded-full border border-cream/30 px-6 text-sm font-bold"
            >
              <T>Sumarme como voluntario</T>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-24">
        <h2 className="font-display text-4xl text-navy dark:text-cream">
          <T>Dónde operamos</T>
        </h2>
        <p className="editorial-justify mt-3 max-w-2xl leading-relaxed text-mist dark:text-cream/75">
          <T>
            Una estructura internacional para articular visión estratégica y acción territorial.
          </T>
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Place
            label={t("Sede principal")}
            place={t("Brooklyn, Nueva York")}
            address={org.addressNy}
            map={org.mapNy}
          />
          <Place
            label={t("Sede operativa")}
            place={t("Caracas, Venezuela")}
            address={org.addressCcs}
            map={org.mapCcs}
          />
        </div>
      </section>
    </Shell>
  );
}

function Place({
  label,
  place,
  address,
  map,
}: {
  label: string;
  place: string;
  address: string;
  map: string;
}) {
  const { t } = useLanguage();
  return (
    <article className="overflow-hidden rounded-card border border-line bg-card dark:border-white/10 dark:bg-navy">
      <div className="p-6">
        <p className="text-xs font-bold tracking-[0.18em] text-gold-deep uppercase">
          <T>{label}</T>
        </p>
        <h3 className="mt-2 font-display text-2xl text-navy dark:text-cream">
          <T>{place}</T>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-mist dark:text-cream/75">
          <T>{address}</T>
        </p>
      </div>
      <iframe
        title={t("Mapa de {place}").replace("{place}", place)}
        src={map}
        loading="lazy"
        className="h-64 w-full border-0"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </article>
  );
}
