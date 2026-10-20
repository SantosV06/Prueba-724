import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, Shell } from "@/components/shell";
import { org } from "@/data/site";

export const Route = createFileRoute("/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte | Fundación VNE" },
      {
        name: "description",
        content: "Canales de información institucional y soporte técnico del sitio de Fundación VNE.",
      },
    ],
  }),
  component: Soporte,
});

function Soporte() {
  return (
    <Shell>
      <PageIntro
        kicker="Atención"
        title="Información clara y un canal si algo del sitio falla."
        lede="Desde aquí puedes hablar con el equipo sobre el trabajo de la fundación o reportar un error de visualización o funcionamiento de la página."
      />
      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:px-6 md:grid-cols-2">
        <article className="rounded-card bg-navy p-8 text-cream">
          <h2 className="font-display text-3xl">Más información</h2>
          <p className="mt-3 leading-relaxed text-cream/80">Orientación institucional y detalle sobre programas, sedes y formas de participar.</p>
          <a href={org.infoWa} target="_blank" rel="noreferrer" className="mt-8 inline-flex h-12 items-center rounded-full bg-gold px-5 text-sm font-bold text-navy">
            Escribir por WhatsApp
          </a>
        </article>
        <article className="rounded-card border border-line bg-card p-8 dark:border-white/10 dark:bg-navy">
          <h2 className="font-display text-3xl text-navy dark:text-cream">Soporte del sitio</h2>
          <p className="mt-3 leading-relaxed text-mist dark:text-cream/75">Si ves un error, un enlace roto o un problema al navegar, este canal es el correcto.</p>
          <a
            href={org.webWa}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex h-12 items-center rounded-full border border-navy px-5 text-sm font-bold text-navy dark:border-gold dark:text-gold"
          >
            Reportar un problema
          </a>
          <p className="mt-6 text-sm text-mist dark:text-cream/60">
            También puedes escribir a <a className="font-semibold underline-offset-4 hover:underline" href={`mailto:${org.email}`}>{org.email}</a>. Horario: {org.hours}
          </p>
        </article>
      </section>
    </Shell>
  );
}
