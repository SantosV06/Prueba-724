import { MediaVideo } from "@/components/media-video";
import { media } from "@/data/media";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, Shell } from "@/components/shell";

export const Route = createFileRoute("/casas")({
  head: () => ({
    meta: [
      { title: "Casas VNE | Modelo comunitario autosostenible" },
      {
        name: "description",
        content:
          "Las Casas VNE integran formación, economía local y participación social para generar autonomía y cohesión comunitaria.",
      },
    ],
  }),
  component: Casas,
});

const parts = [
  {
    title: "Formación para niños y jóvenes",
    text: "Habilidades prácticas, pensamiento productivo y valores para integrarse a la vida económica y social.",
  },
  {
    title: "Participación de adultos",
    text: "Profesionales, emprendedores y voluntarios actúan como formadores, mentores y ejecutores de proyectos.",
  },
  {
    title: "Colaboración comunitaria",
    text: "Cada miembro tiene un rol activo. La cooperación es funcional y está orientada a sostener el sistema.",
  },
  {
    title: "Recurso humano",
    text: "El modelo crece con quienes deciden aportar conocimiento, experiencia o trabajo. No excluye.",
  },
];

const sectors = [
  {
    name: "Sector primario",
    video: media.primaryVideo,
    text: "Agricultura, producción de alimentos y aprovechamiento responsable del territorio.",
  },
  {
    name: "Sector secundario",
    video: media.secondaryVideo,
    text: "Transformación, manufactura ligera y valor agregado a lo que se produce localmente.",
  },
  {
    name: "Sector terciario",
    video: media.tertiaryVideo,
    text: "Comercio, servicios, turismo y actividades que completan la economía del lugar.",
  },
];

function Casas() {
  return (
    <Shell>
      <PageIntro
        kicker="Modelo territorial"
        title="Un sistema integrado de desarrollo social y económico."
        lede="Una Casa VNE articula formación, actividad económica y participación en un mismo territorio, para generar autonomía, productividad y cohesión. Está pensada para crecer, adaptarse y replicarse."
      />

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <h2 className="font-display text-3xl text-navy dark:text-cream">Componentes del modelo</h2>
        <MediaVideo src={media.housesVideo} title="Modelo de Casas VNE" />
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {parts.map((item, index) => (
            <li key={item.title} className="rounded-card border-t-4 border-gold bg-card p-6 dark:bg-navy">
              <p className="font-display text-sm text-gold-deep">0{index + 1}</p>
              <h3 className="mt-2 font-display text-2xl text-navy dark:text-cream">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-mist dark:text-cream/75">{item.text}</p>
            </li>
          ))}
        </ol>
        <Link
          to="/voluntariado"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-navy px-6 text-sm font-bold text-cream dark:bg-gold dark:text-navy"
        >
          Quiero ser voluntario
        </Link>
      </section>

      <section className="bg-card dark:bg-navy">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl text-navy dark:text-cream">Hacia una microeconomía que se sostiene sola</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-mist dark:text-cream/75">
            Las casas evolucionan articulando varios sectores productivos en el mismo espacio, junto con educación continua, emprendimiento y organización comunitaria.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {sectors.map((sector) => (
              <article key={sector.name} className="rounded-card bg-paper p-6 dark:bg-navy-deep">
                <h3 className="font-display text-xl text-navy dark:text-cream">{sector.name}</h3>
                <p className="mt-3 leading-relaxed text-mist dark:text-cream/75">{sector.text}</p>
                <MediaVideo src={sector.video} title={sector.name} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-3xl text-navy dark:text-cream">Un piloto con visión de sistema</h2>
          <p className="mt-4 leading-relaxed text-mist dark:text-cream/75">
            Las Casas VNE son el punto de partida de un modelo mayor: un laboratorio donde se diseñan, prueban y ajustan estructuras que pueden escalar a nivel regional y nacional, a partir de experiencia real.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link to="/genesis" className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-sm font-bold text-cream">
            Ver Proyecto Génesis
          </Link>
          <Link
            to="/donaciones"
            className="inline-flex h-12 items-center justify-center rounded-full border border-navy px-6 text-sm font-bold text-navy dark:border-gold dark:text-gold"
          >
            Contribuir al modelo
          </Link>
        </div>
      </section>
    </Shell>
  );
}
