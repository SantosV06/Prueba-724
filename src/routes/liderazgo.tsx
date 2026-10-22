import { T, useLanguage } from "@/lib/i18n";
import { media } from "@/data/media";
import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, Shell } from "@/components/shell";

export const Route = createFileRoute("/liderazgo")({
  head: () => ({
    meta: [
      { title: "Liderazgo | Fundación VNE" },
      {
        name: "description",
        content:
          "Wilmer Solórzano, CEO y fundador, y la estructura institucional de Fundación Venezuela Nueva Esperanza.",
      },
    ],
  }),
  component: Liderazgo,
});

const people = [
  {
    initials: "WS",
    photo: media.director,
    role: "Dirección y liderazgo",
    name: "Wilmer Solórzano",
    charge: "CEO y fundador",
    text: "Responsable de la visión estratégica, las decisiones institucionales y la proyección de largo plazo.",
  },
  {
    initials: "SS",
    photo: media.coordinator,
    role: "Coordinación general",
    name: "Stefany Solorzano",
    charge: "Planificación estratégica",
    text: "Planificación institucional, coordinación de proyectos y alineación entre las áreas de la organización.",
  },
];

function Liderazgo() {
  const { t } = useLanguage();
  return (
    <Shell>
      <PageIntro
        kicker={t("Estructura institucional")}
        title={t("Wilmer Solórzano, CEO y fundador.")}
        lede={t(
          "Líder venezolano nacido en 1983 en el estado Guárico. Su trayectoria está marcada por una idea concreta: servir, construir y transformar realidades con estructuras que se sostienen.",
        )}
      />

      <section className="editorial-justify mx-auto max-w-3xl space-y-5 px-5 py-14 text-lg leading-relaxed text-mist sm:px-6 dark:text-cream/80">
        <img
          src={media.ceo}
          alt={t("Wilmer Solórzano, CEO y fundador")}
          className="mx-auto max-h-96 max-w-full rounded-card object-contain"
        />
        <p>
          <T>
            Desde temprano mostró sensibilidad social y un sentido fuerte de responsabilidad
            familiar y comunitaria. Esos valores se volvieron una filosofía de cambio, perseverancia
            y acción, y hoy dan forma a Fundación VNE.
          </T>
        </p>
        <p>
          <T>
            Su liderazgo se apoya en principios éticos, una visión humanista del desarrollo y la
            convicción de que el progreso llega cuando las personas tienen oportunidades,
            herramientas y estructuras para avanzar por sí mismas.
          </T>
        </p>
        <p>
          <T>
            Concibe la fundación no como un proyecto aislado, sino como un modelo institucional de
            largo alcance, diseñado para generar impacto estructural y contribuir a la
            transformación social y económica de comunidades y países.
          </T>
        </p>
      </section>

      <section className="bg-card dark:bg-navy">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
          <h2 className="font-display text-3xl text-navy dark:text-cream">
            <T>Cómo está organizada</T>
          </h2>
          <p className="editorial-justify mt-4 max-w-3xl leading-relaxed text-mist dark:text-cream/75">
            <T>
              Áreas estratégicas permanentes garantizan coherencia, continuidad y escalabilidad. El
              equipo reúne profesionales, colaboradores y aliados. Cada persona tiene un rol
              específico, bajo responsabilidad institucional y ética. La representación pública se
              limita a cargos estratégicos.
            </T>
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {people.map((person) => (
              <article
                key={person.initials}
                className="rounded-card border border-line bg-paper p-6 dark:border-white/10 dark:bg-navy-deep"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={person.photo}
                    alt={t(person.name)}
                    loading="lazy"
                    width={64}
                    height={64}
                    className="size-16 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-gold-deep uppercase">
                      <T>{person.role}</T>
                    </p>
                    <h3 className="font-display text-2xl text-navy dark:text-cream">
                      <T>{person.name}</T>
                    </h3>
                    <p className="text-sm text-mist dark:text-cream/70">
                      <T>{person.charge}</T>
                    </p>
                  </div>
                </div>
                <p className="editorial-justify mt-4 leading-relaxed text-mist dark:text-cream/75">
                  <T>{person.text}</T>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
