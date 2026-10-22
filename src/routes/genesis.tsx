import { localizedHead } from "@/lib/i18n/seo";
import { T, useLanguage } from "@/lib/i18n";
import { media } from "@/data/media";
import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, Shell } from "@/components/shell";

export const Route = createFileRoute("/genesis")({
  head: ({ matches }) =>
    localizedHead(
      {
        meta: [
          { title: "Proyecto Génesis | Inversión social productiva" },
          {
            name: "description",
            content:
              "Iniciativa de inversión social privada de Fundación VNE: productividad real, empresas y autosostenibilidad, con piloto en Nueva York.",
          },
        ],
      },
      matches.at(-1)?.search ?? {},
    ),
  component: Genesis,
});

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
      <h2 className="font-display text-3xl text-navy dark:text-cream">
        <T>{title}</T>
      </h2>
      <div className="editorial-justify mt-4 space-y-4 text-base leading-relaxed text-mist dark:text-cream/80">
        {children}
      </div>
    </section>
  );
}

function Genesis() {
  const { t } = useLanguage();
  return (
    <Shell>
      <PageIntro
        tone="forest"
        kicker={t("Inversión social productiva")}
        title={t("Proyecto Génesis")}
        lede={t(
          "Una iniciativa privada con impacto económico: sistemas productivos autosostenibles, medibles y con vocación de política pública, sin ampliar la estructura del Estado.",
        )}
      />

      <Block title={t("Qué es")}>
        <img
          src={media.genesisLogo}
          alt={t("Proyecto Génesis")}
          className="mx-auto max-h-40 max-w-full object-contain"
        />
        <p>
          <T>
            Génesis propone una alternativa estructural a la asistencia prolongada. El eje es
            productividad real, creación de empresas e ingresos propios, para que poblaciones hoy
            excluidas operen como emprendedores y actores económicos formales.
          </T>
        </p>
        <p>
          <T>
            El diseño prioriza la autosuficiencia, la responsabilidad económica progresiva y la
            integración productiva, sin depender de financiamiento público permanente.
          </T>
        </p>
        <p>
          <a
            className="font-semibold text-forest underline underline-offset-4 dark:text-gold"
            href={media.genesisPdf}
            download
          >
            <T>Descargar el documento completo del Proyecto Génesis (PDF)</T>
          </a>
        </p>
      </Block>

      <section className="bg-card dark:bg-navy">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-navy dark:text-cream">
              <T>A dónde va el capital</T>
            </h2>
            <ul className="mt-5 space-y-3 leading-relaxed text-mist dark:text-cream/80">
              <li>
                <T>
                  Infraestructura productiva inicial: complejo agroturístico, emprendimientos y
                  servicios.
                </T>
              </li>
              <li>
                <T>Incubación de microemprendimientos formales.</T>
              </li>
              <li>
                <T>Actividad económica que genera ingresos y se reinvierte.</T>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl text-navy dark:text-cream">
              <T>Cómo se lee el retorno</T>
            </h2>
            <ul className="mt-5 space-y-3 leading-relaxed text-mist dark:text-cream/80">
              <li>
                <T>Sostenibilidad financiera del ecosistema.</T>
              </li>
              <li>
                <T>Menor dependencia de la asistencia.</T>
              </li>
              <li>
                <T>Nuevas unidades económicas formales.</T>
              </li>
              <li>
                <T>
                  Evidencia para replicar el modelo y, más adelante, adoptarlo institucionalmente.
                </T>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Block title={t("Piloto en el estado de Nueva York")}>
        <p>
          <T>
            La primera fase es un complejo agroturístico sostenible en zona rural de Nueva York.
            Funciona como núcleo productivo, motor financiero y plataforma de validación.
          </T>
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <T>Producción agroalimentaria</T>
          </li>
          <li>
            <T>Transformación básica de productos</T>
          </li>
          <li>
            <T>Turismo experiencial</T>
          </li>
          <li>
            <T>Comercialización directa</T>
          </li>
          <li>
            <T>Servicios asociados</T>
          </li>
        </ul>
        <p>
          <T>
            Esa mezcla permite una microeconomía capaz de adaptarse a la demanda local y regional.
          </T>
        </p>
      </Block>

      <Block title={t("Autosostenibilidad")}>
        <p>
          <T>
            Los ingresos del complejo deben cubrir costos operativos, reinvertirse en
            infraestructura y facilitar nuevos microemprendimientos.
          </T>
        </p>
        <p>
          <T>
            La meta son unidades económicas formales, dentro del marco legal estadounidense, sin
            subsidios continuos.
          </T>
        </p>
      </Block>

      <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-6">
        <div className="rounded-card bg-forest p-8 text-cream sm:p-10">
          <h2 className="font-display text-3xl">
            <T>Escalabilidad</T>
          </h2>
          <p className="editorial-justify mt-4 max-w-3xl leading-relaxed text-cream/85">
            <T>
              Génesis no es una intervención aislada. El diseño modular permite empezar en pequeño,
              validar con evidencia y sumar módulos productivos. Puede adaptarse a otros territorios
              de Estados Unidos y, después, replicarse en América Latina — Panamá y Venezuela entre
              ellos — sin perder coherencia operativa ni financiera.
            </T>
          </p>
        </div>
      </section>

      <Block title={t("Valor institucional")}>
        <img
          src={media.scalability}
          alt={t("Escalabilidad del modelo Génesis")}
          loading="lazy"
          className="w-full rounded-card"
        />
        <img
          src={media.impact}
          alt={t("Impacto del programa Proyecto Génesis")}
          loading="lazy"
          className="w-full rounded-card"
        />
        <p>
          <T>
            El proyecto ofrece una herramienta de integración económica basada en resultados
            medibles, responsabilidad fiscal y actividad formal. La evidencia sirve para decidir
            mejor y para mostrar que existen salidas estructurales a la asistencia prolongada.
          </T>
        </p>
      </Block>

      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-6">
        <h2 className="font-display text-3xl text-navy dark:text-cream">
          <T>Quién puede participar</T>
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Inversores sociales privados",
            "Empresarios",
            "Aliados estratégicos",
            "Instituciones interesadas en desarrollo económico sostenible",
          ].map((item) => (
            <li
              key={item}
              className="rounded-card border border-line bg-card px-5 py-4 font-semibold text-navy dark:border-white/10 dark:bg-navy dark:text-cream"
            >
              <T>{item}</T>
            </li>
          ))}
        </ul>
        <p className="editorial-justify mt-6 max-w-3xl leading-relaxed text-mist dark:text-cream/75">
          <T>
            La participación se acuerda con esquemas claros, alineados con la sostenibilidad
            financiera, el impacto medible y el horizonte largo del modelo. No publicamos cifras de
            otros programas: el impacto de Génesis se medirá con los resultados del piloto.
          </T>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/voluntariado"
            className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-sm font-bold text-cream"
          >
            <T>Postularme al voluntariado</T>
          </Link>
          <Link
            to="/donaciones"
            className="inline-flex h-12 items-center justify-center rounded-full border border-forest px-6 text-sm font-bold text-forest dark:border-gold dark:text-gold"
          >
            <T>Apoyar con una donación</T>
          </Link>
        </div>
      </section>
    </Shell>
  );
}
