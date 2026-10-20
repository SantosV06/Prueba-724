import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageIntro, Shell } from "@/components/shell";
import { mailtoFor, saveVolunteer } from "@/lib/volunteers";

export const Route = createFileRoute("/voluntariado")({
  head: () => ({
    meta: [
      { title: "Voluntariado | Proyecto Génesis · Fundación VNE" },
      {
        name: "description",
        content:
          "Solicitud de voluntariado para Proyecto Génesis y Fundación VNE. Formulario con envío por correo.",
      },
    ],
  }),
  component: Voluntariado,
});

type Fields = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  mensaje: string;
};

const empty: Fields = { nombre: "", apellido: "", correo: "", telefono: "", mensaje: "" };

function Voluntariado() {
  const [fields, setFields] = useState<Fields>(empty);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Fields | null>(null);

  function update(key: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const data = {
      nombre: fields.nombre.trim(),
      apellido: fields.apellido.trim(),
      correo: fields.correo.trim(),
      telefono: fields.telefono.trim(),
      mensaje: fields.mensaje.trim(),
    };
    if (!data.nombre || !data.apellido || !data.correo || !data.telefono) {
      setError("Completa nombre, apellido, correo y teléfono.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) {
      setError("El correo no tiene un formato válido.");
      return;
    }
    if (!/^\+\d[\d\s()-]{6,}$/.test(data.telefono)) {
      setError("El teléfono debe incluir código de país. Ejemplo: +1 917 555 0100.");
      return;
    }
    saveVolunteer(data);
    setError("");
    setSent(data);
    setFields(empty);
  }

  return (
    <Shell>
      <PageIntro
        tone="forest"
        kicker="Proyecto Génesis"
        title="Voluntariado con oficio, no solo con buena voluntad."
        lede="Buscamos personas dispuestas a aportar conocimiento, experiencia y tiempo a un modelo productivo. La solicitud queda guardada en este navegador y se prepara un correo para el equipo."
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-3xl text-navy dark:text-cream">Qué implica</h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-mist dark:text-cream/75">
            <li>Acompañar formación, producción o coordinación según tu experiencia.</li>
            <li>Respetar el marco ético y las políticas de la organización.</li>
            <li>No es un contrato laboral ni una plaza remunerada.</li>
          </ul>
        </div>

        <div className="lg:col-span-7">
          {sent ? (
            <div className="rounded-card border border-forest/30 bg-card p-6 dark:border-gold/30 dark:bg-navy" role="status">
              <h2 className="font-display text-2xl text-navy dark:text-cream">Solicitud registrada</h2>
              <p className="mt-3 leading-relaxed text-mist dark:text-cream/75">
                {sent.nombre}, guardamos tu solicitud en este dispositivo. Para que el equipo la reciba, envía el correo preparado.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href={mailtoFor(sent)} className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-5 text-sm font-bold text-cream">
                  Enviar correo al equipo
                </a>
                <button type="button" onClick={() => setSent(null)} className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-bold dark:border-white/15">
                  Nueva solicitud
                </button>
              </div>
              <Link to="/solicitudes" className="mt-4 inline-block text-sm font-semibold text-forest underline-offset-4 hover:underline dark:text-gold">
                Ver solicitudes de este navegador
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-card border border-line bg-card p-6 dark:border-white/10 dark:bg-navy" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" value={fields.nombre} onChange={(value) => update("nombre", value)} autoComplete="given-name" />
                <Field label="Apellido" value={fields.apellido} onChange={(value) => update("apellido", value)} autoComplete="family-name" />
                <Field label="Correo" type="email" value={fields.correo} onChange={(value) => update("correo", value)} autoComplete="email" />
                <Field label="Teléfono" type="tel" value={fields.telefono} onChange={(value) => update("telefono", value)} autoComplete="tel" hint="+1 347 555 0100" />
              </div>
              <label className="mt-4 block text-sm font-semibold text-navy dark:text-cream">
                Cómo puedes aportar
                <textarea
                  value={fields.mensaje}
                  onChange={(event) => update("mensaje", event.target.value)}
                  rows={4}
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-3 text-base font-normal text-ink outline-none dark:border-white/15 dark:bg-navy-deep dark:text-cream"
                />
              </label>
              {error ? (
                <p className="mt-3 text-sm font-semibold text-clay" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="mt-5 inline-flex h-12 items-center rounded-full bg-forest px-6 text-sm font-bold text-cream">
                Registrar solicitud
              </button>
            </form>
          )}
        </div>
      </section>
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-navy dark:text-cream">
      {label}
      <input
        required
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-12 w-full rounded-xl border border-line bg-paper px-3 text-base font-normal text-ink outline-none dark:border-white/15 dark:bg-navy-deep dark:text-cream"
      />
      {hint ? <span className="mt-1 block text-xs font-normal text-mist">{hint}</span> : null}
    </label>
  );
}
