import { T, useLanguage } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, Shell } from "@/components/shell";
import { org } from "@/data/site";

export const Route = createFileRoute("/soporte")({
  head: () => ({
    meta: [
      { title: "Soporte | Fundación VNE" },
      {
        name: "description",
        content:
          "Canales de información institucional y soporte técnico del sitio de Fundación VNE.",
      },
    ],
  }),
  component: Soporte,
});

function Soporte() {
  const { t } = useLanguage();
  return (
    <Shell>
      <PageIntro
        kicker={t("Atención")}
        title={t("Información clara y un canal si algo del sitio falla.")}
        lede={t(
          "Desde aquí puedes hablar con el equipo sobre el trabajo de la fundación o reportar un error de visualización o funcionamiento de la página.",
        )}
      />
      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-14 sm:px-6 md:grid-cols-2">
        <article className="rounded-card bg-navy p-8 text-cream">
          <h2 className="font-display text-3xl">
            <T>Más información</T>
          </h2>
          <p className="editorial-justify mt-3 leading-relaxed text-cream/80">
            <T>
              Orientación institucional y detalle sobre programas, sedes y formas de participar.
            </T>
          </p>
          <a
            href={org.infoWa}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-gold px-5 text-sm font-bold text-navy"
          >
            <T>Escribir por WhatsApp</T>
          </a>
        </article>
        <article className="rounded-card border border-line bg-card p-8 dark:border-white/10 dark:bg-navy">
          <h2 className="font-display text-3xl text-navy dark:text-cream">
            <T>Soporte del sitio</T>
          </h2>
          <p className="editorial-justify mt-3 leading-relaxed text-mist dark:text-cream/75">
            <T>
              Si ves un error, un enlace roto o un problema al navegar, este canal es el correcto.
            </T>
          </p>
          <a
            href={org.webWa}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex h-12 items-center rounded-full border border-navy px-5 text-sm font-bold text-navy dark:border-gold dark:text-gold"
          >
            <T>Reportar un problema</T>
          </a>
          <p className="mt-6 text-sm text-mist dark:text-cream/60">
            <T>También puedes escribir a </T>
            <a
              className="font-semibold underline-offset-4 hover:underline"
              href={`mailto:${org.email}`}
            >
              <T>{org.email}</T>
            </a>
            <T>. Horario: </T>
            <T>{org.hours}</T>
          </p>
        </article>
      </section>
    </Shell>
  );
}
