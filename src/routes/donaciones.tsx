import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageIntro, Shell } from "@/components/shell";
import { org } from "@/data/site";

export const Route = createFileRoute("/donaciones")({
  head: () => ({
    meta: [
      { title: "Donaciones | Fundación VNE" },
      {
        name: "description",
        content:
          "Donaciones voluntarias a Fundación VNE por Zelle. Número, banco y concepto, sin solicitar datos bancarios.",
      },
    ],
  }),
  component: Donaciones,
});

const facts = [
  { label: "Plataforma", value: "Zelle" },
  { label: "Número asociado", value: org.zelle },
  { label: "Banco", value: org.bank },
  { label: "Concepto sugerido", value: "Donación Fundación VNE" },
];

function Donaciones() {
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(org.zelle);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Shell>
      <PageIntro
        kicker="Transparencia"
        title="Tu aporte sostiene programas productivos, no una campaña pasajera."
        lede="Las donaciones son voluntarias y se hacen solo desde Zelle. La fundación no pide contraseñas, códigos ni información bancaria."
      />

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <article key={fact.label} className="rounded-card border border-line bg-card p-6 dark:border-white/10 dark:bg-navy">
              <p className="text-xs font-bold tracking-[0.16em] text-gold-deep uppercase">{fact.label}</p>
              <p className="mt-2 font-display text-3xl text-navy dark:text-cream">{fact.value}</p>
            </article>
          ))}
        </div>

        <p className="editorial-justify mt-8 max-w-3xl leading-relaxed text-mist dark:text-cream/75">
          Los fondos se usan exclusivamente para desarrollar y sostener los programas sociales, comunitarios y productivos, conforme a los estatutos y a las políticas internas de gobernanza.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={copyNumber}
            className="inline-flex h-12 items-center justify-center rounded-full bg-navy px-6 text-sm font-bold text-cream dark:bg-gold dark:text-navy"
          >
            {copied ? "Número copiado" : "Copiar número de Zelle"}
          </button>
          <a
            href="https://www.zellepay.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full border border-navy px-6 text-sm font-bold text-navy dark:border-gold dark:text-gold"
          >
            Abrir Zelle
          </a>
          <a
            href={org.infoWa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full border border-line px-6 text-sm font-bold text-navy dark:border-white/15 dark:text-cream"
          >
            Consulta administrativa
          </a>
        </div>
      </section>
    </Shell>
  );
}
