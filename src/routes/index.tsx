import { MediaVideo } from "@/components/media-video";
import { media } from "@/data/media";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { org } from "@/data/site";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fundación VNE | Desarrollo social y económico sostenible" },
      {
        name: "description",
        content:
          "Fundación Venezuela Nueva Esperanza. Proyectos productivos, emprendimiento y autonomía a través de Casas VNE y Proyecto Génesis.",
      },
    ],
  }),
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
  return (
    <Shell>
      <section className="bg-navy text-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">Nueva York · Caracas · desde 2022</p>
            <h1 className="mt-4 font-display text-[2.6rem] leading-[1.08] font-semibold text-balance sm:text-6xl">
              Somos Fundación VNE, Venezuela Nueva Esperanza.
            </h1>
            <p className="editorial-justify mt-6 max-w-xl text-lg leading-relaxed text-cream/85">
              Empresa con propósito social. Diseñamos e implementamos proyectos de desarrollo sostenible mediante actividad productiva, alianzas y programas de servicio — no asistencia de corto plazo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/donaciones"
                className="inline-flex h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-bold text-navy"
              >
                Apoyar los proyectos
              </Link>
              <Link
                to="/casas"
                className="inline-flex h-12 items-center justify-center rounded-full border border-cream/30 px-6 text-sm font-bold text-cream"
              >
                Conocer Casas VNE
              </Link>
            </div>
          </div>
          <aside className="border-t border-white/15 pt-8 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <MediaVideo src={media.homeVideo} title="Presentación de Fundación VNE" />
            <dl className="mt-8 grid gap-6">
              <div>
                <dt className="text-xs tracking-[0.18em] text-gold uppercase">Figura</dt>
                <dd className="mt-1 font-display text-2xl">LLC con propósito social</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.18em] text-gold uppercase">Registro</dt>
                <dd className="mt-1 text-base leading-relaxed text-cream/85">
                  Estado de Nueva York, {org.founded}
                  <br />
                  EIN {org.ein}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.18em] text-gold uppercase">Sede</dt>
                <dd className="mt-1 text-base text-cream/85">{org.addressNy}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-4">
          <p className="text-xs font-bold tracking-[0.2em] text-gold-deep uppercase">Quiénes somos</p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-navy dark:text-cream">Impacto real, no alivio temporal.</h2>
        </div>
        <div className="editorial-justify space-y-5 text-lg leading-relaxed text-mist lg:col-span-8 dark:text-cream/80">
          <p>
            Cada proyecto es una oportunidad de crear un cambio que permanezca. Trabajamos en soluciones productivas basadas en el emprendimiento, la autonomía y el fortalecimiento de capacidades individuales y colectivas.
          </p>
          <p>
            No buscamos resolver solo la necesidad del día. Construimos estructuras para que personas y comunidades se desarrollen de forma digna, autosuficiente y sostenible.
          </p>
          <MediaVideo src={media.aboutVideo} title="Conoce Fundación VNE" />
        </div>
      </section>

      <section className="border-y border-line bg-card dark:border-white/10 dark:bg-navy">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <h2 className="font-display text-3xl text-navy dark:text-cream">Misión</h2>
          <p className="editorial-justify mt-4 max-w-3xl text-lg leading-relaxed text-mist dark:text-cream/80">
            Impulsar el desarrollo social y económico sostenible mediante proyectos productivos que fortalezcan capacidades, promuevan la autonomía y conviertan necesidades estructurales en oportunidades de largo plazo.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {pillars.map((item) => (
              <li key={item.n} className="rounded-card border border-line bg-paper p-6 dark:border-white/10 dark:bg-navy-deep">
                <p className="font-display text-sm text-gold-deep">{item.n}</p>
                <h3 className="mt-2 font-display text-2xl text-navy dark:text-cream">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-mist dark:text-cream/75">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <article className="flex flex-col rounded-card bg-navy p-8 text-cream">
          <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">Liderazgo</p>
          <h2 className="mt-3 font-display text-3xl">Wilmer Solórzano</h2>
          <p className="editorial-justify mt-4 leading-relaxed text-cream/80">
            CEO y fundador. Su trabajo orienta un modelo institucional de largo alcance: impacto real, escalable y capaz de transformar comunidades sin depender de la asistencia permanente.
          </p>
          <Link to="/liderazgo" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-gold">
            Estructura y equipo <ArrowUpRight className="size-4" />
          </Link>
        </article>
        <article className="flex flex-col rounded-card border border-line bg-card p-8 dark:border-white/10 dark:bg-navy">
          <img src={media.houses} alt="Modelo de Casas VNE" loading="lazy" className="mb-6 w-full rounded-card object-contain" />
          <p className="text-xs font-bold tracking-[0.2em] text-gold-deep uppercase">Modelo territorial</p>
          <h2 className="mt-3 font-display text-3xl text-navy dark:text-cream">Casas VNE</h2>
          <p className="editorial-justify mt-4 leading-relaxed text-mist dark:text-cream/80">
            No son centros asistenciales. Son núcleos donde educación, emprendimiento, producción y colaboración forman una microeconomía comunitaria.
          </p>
          <Link to="/casas" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-navy dark:text-gold">
            Explorar el modelo <ArrowUpRight className="size-4" />
          </Link>
        </article>
      </section>

      <section className="bg-forest text-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold tracking-[0.2em] text-gold uppercase">Proyecto Génesis</p>
            <h2 className="mt-3 font-display text-4xl leading-tight">Inversión social que produce, se sostiene y puede replicarse.</h2>
            <p className="editorial-justify mt-4 max-w-xl leading-relaxed text-cream/80">
              Un piloto agroturístico en zona rural de Nueva York como núcleo productivo: validar el modelo, generar ingresos propios y dejar evidencia para escalarlo.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-start">
            <Link to="/genesis" className="inline-flex h-12 items-center rounded-full bg-cream px-6 text-sm font-bold text-forest">
              Leer el proyecto
            </Link>
            <Link to="/voluntariado" className="inline-flex h-12 items-center rounded-full border border-cream/30 px-6 text-sm font-bold">
              Sumarme como voluntario
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:py-24">
        <h2 className="font-display text-4xl text-navy dark:text-cream">Dónde operamos</h2>
        <p className="editorial-justify mt-3 max-w-2xl leading-relaxed text-mist dark:text-cream/75">
          Una estructura internacional para articular visión estratégica y acción territorial.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Place
            label="Sede principal"
            place="Brooklyn, Nueva York"
            address={org.addressNy}
            map={org.mapNy}
          />
          <Place
            label="Sede operativa"
            place="Caracas, Venezuela"
            address={org.addressCcs}
            map={org.mapCcs}
          />
        </div>
      </section>
    </Shell>
  );
}

function Place({ label, place, address, map }: { label: string; place: string; address: string; map: string }) {
  return (
    <article className="overflow-hidden rounded-card border border-line bg-card dark:border-white/10 dark:bg-navy">
      <div className="p-6">
        <p className="text-xs font-bold tracking-[0.18em] text-gold-deep uppercase">{label}</p>
        <h3 className="mt-2 font-display text-2xl text-navy dark:text-cream">{place}</h3>
        <p className="mt-2 text-sm leading-relaxed text-mist dark:text-cream/75">{address}</p>
      </div>
      <iframe title={`Mapa de ${place}`} src={map} loading="lazy" className="h-64 w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
    </article>
  );
}
