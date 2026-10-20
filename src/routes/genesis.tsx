import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, Shell } from "@/components/shell";
import { org } from "@/data/site";

export const Route = createFileRoute("/genesis")({
  head: () => ({
    meta: [
      { title: "Proyecto Génesis | Inversión social productiva" },
      {
        name: "description",
        content:
          "Iniciativa de inversión social privada de Fundación VNE: productividad real, empresas y autosostenibilidad, con piloto en Nueva York.",
      },
    ],
  }),
  component: Genesis,
});

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-6">
      <h2 className="font-display text-3xl text-navy dark:text-cream">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-mist dark:text-cream/80">{children}</div>
    </section>
  );
}

function Genesis() {
  return (
    <Shell>
      <PageIntro
        tone="forest"
        kicker="Inversión social productiva"
        title="Proyecto Génesis"
        lede="Una iniciativa privada con impacto económico: sistemas productivos autosostenibles, medibles y con vocación de política pública, sin ampliar la estructura del Estado."
      />

      <Block title="Qué es">
        <p>
          Génesis propone una alternativa estructural a la asistencia prolongada. El eje es productividad real, creación de empresas e ingresos propios, para que poblaciones hoy excluidas operen como emprendedores y actores económicos formales.
        </p>
        <p>
          El diseño prioriza la autosuficiencia, la responsabilidad económica progresiva y la integración productiva, sin depender de financiamiento público permanente.
        </p>
        <p>
          El documento extenso del proyecto se entrega a solicitud. Escríbenos y lo compartimos:{" "}
          <a className="font-semibold text-forest underline-offset-4 hover:underline dark:text-gold" href={`mailto:${org.email}?subject=Solicitud%20PDF%20Proyecto%20G%C3%A9nesis`}>
            {org.email}
          </a>
          .
        </p>
      </Block>

      <section className="bg-card dark:bg-navy">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-navy dark:text-cream">A dónde va el capital</h2>
            <ul className="mt-5 space-y-3 leading-relaxed text-mist dark:text-cream/80">
              <li>Infraestructura productiva inicial: complejo agroturístico, emprendimientos y servicios.</li>
              <li>Incubación de microemprendimientos formales.</li>
              <li>Actividad económica que genera ingresos y se reinvierte.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl text-navy dark:text-cream">Cómo se lee el retorno</h2>
            <ul className="mt-5 space-y-3 leading-relaxed text-mist dark:text-cream/80">
              <li>Sostenibilidad financiera del ecosistema.</li>
              <li>Menor dependencia de la asistencia.</li>
              <li>Nuevas unidades económicas formales.</li>
              <li>Evidencia para replicar el modelo y, más adelante, adoptarlo institucionalmente.</li>
            </ul>
          </div>
        </div>
      </section>

      <Block title="Piloto en el estado de Nueva York">
        <p>
          La primera fase es un complejo agroturístico sostenible en zona rural de Nueva York. Funciona como núcleo productivo, motor financiero y plataforma de validación.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Producción agroalimentaria</li>
          <li>Transformación básica de productos</li>
          <li>Turismo experiencial</li>
          <li>Comercialización directa</li>
          <li>Servicios asociados</li>
        </ul>
        <p>Esa mezcla permite una microeconomía capaz de adaptarse a la demanda local y regional.</p>
      </Block>

      <Block title="Autosostenibilidad">
        <p>Los ingresos del complejo deben cubrir costos operativos, reinvertirse en infraestructura y facilitar nuevos microemprendimientos.</p>
        <p>La meta son unidades económicas formales, dentro del marco legal estadounidense, sin subsidios continuos.</p>
      </Block>

      <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-6">
        <div className="rounded-card bg-forest p-8 text-cream sm:p-10">
          <h2 className="font-display text-3xl">Escalabilidad</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-cream/85">
            Génesis no es una intervención aislada. El diseño modular permite empezar en pequeño, validar con evidencia y sumar módulos productivos. Puede adaptarse a otros territorios de Estados Unidos y, después, replicarse en América Latina — Panamá y Venezuela entre ellos — sin perder coherencia operativa ni financiera.
          </p>
        </div>
      </section>

      <Block title="Valor institucional">
        <p>
          El proyecto ofrece una herramienta de integración económica basada en resultados medibles, responsabilidad fiscal y actividad formal. La evidencia sirve para decidir mejor y para mostrar que existen salidas estructurales a la asistencia prolongada.
        </p>
      </Block>

      <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-6">
        <h2 className="font-display text-3xl text-navy dark:text-cream">Quién puede participar</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {["Inversores sociales privados", "Empresarios", "Aliados estratégicos", "Instituciones interesadas en desarrollo económico sostenible"].map((item) => (
            <li key={item} className="rounded-card border border-line bg-card px-5 py-4 font-semibold text-navy dark:border-white/10 dark:bg-navy dark:text-cream">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl leading-relaxed text-mist dark:text-cream/75">
          La participación se acuerda con esquemas claros, alineados con la sostenibilidad financiera, el impacto medible y el horizonte largo del modelo. No publicamos cifras de otros programas: el impacto de Génesis se medirá con los resultados del piloto.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/voluntariado" className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-6 text-sm font-bold text-cream">
            Postularme al voluntariado
          </Link>
          <Link to="/donaciones" className="inline-flex h-12 items-center justify-center rounded-full border border-forest px-6 text-sm font-bold text-forest dark:border-gold dark:text-gold">
            Apoyar con una donación
          </Link>
        </div>
      </section>
    </Shell>
  );
}
