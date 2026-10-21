import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageIntro, Shell } from "@/components/shell";
import { submitVolunteer } from "@/lib/volunteer-functions";

export const Route = createFileRoute("/voluntariado")({
  head: () => ({
    meta: [
      { title: "Voluntariado | Proyecto Génesis · Fundación VNE" },
      {
        name: "description",
        content:
          "Solicitud de voluntariado para Proyecto Génesis y Fundación VNE. Registro de solicitudes en línea.",
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
  const [sending, setSending] = useState(false);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  const [website, setWebsite] = useState("");
  const requestKey = useRef<string | null>(null);
  const submitting = useRef(false);

  function update(key: keyof Fields, value: string) {
    requestKey.current = null;
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
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
    submitting.current = true;
    requestKey.current ??= crypto.randomUUID();
    setSending(true);
    try {
      await submitVolunteer({ data: { ...data, website, requestKey: requestKey.current } });
      setError("");
      setSent(data);
      setFields(empty);
      setWebsite("");
      requestKey.current = null;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la solicitud. Inténtalo nuevamente.",
      );
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  return (
    <Shell>
      <PageIntro
        tone="forest"
        kicker="Proyecto Génesis"
        title="Voluntariado con oficio, no solo con buena voluntad."
        lede="Buscamos personas dispuestas a aportar conocimiento, experiencia y tiempo a un modelo productivo. La solicitud se guarda de forma segura y centralizada para que nuestro equipo pueda revisarla."
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
            <div
              className="rounded-card border border-forest/30 bg-card p-6 dark:border-gold/30 dark:bg-navy"
              role="status"
            >
              <h2 className="font-display text-2xl text-navy dark:text-cream">
                Solicitud registrada
              </h2>
              <p className="editorial-justify mt-3 leading-relaxed text-mist dark:text-cream/75">
                {sent.nombre}, tu solicitud quedó registrada correctamente. El equipo podrá
                consultarla desde el panel administrativo.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSent(null)}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-bold dark:border-white/15"
                >
                  Nueva solicitud
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-card border border-line bg-card p-6 dark:border-white/10 dark:bg-navy"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  value={fields.nombre}
                  onChange={(value) => update("nombre", value)}
                  disabled={sending}
                  autoComplete="given-name"
                />
                <Field
                  label="Apellido"
                  value={fields.apellido}
                  onChange={(value) => update("apellido", value)}
                  disabled={sending}
                  autoComplete="family-name"
                />
                <Field
                  label="Correo"
                  type="email"
                  value={fields.correo}
                  onChange={(value) => update("correo", value)}
                  disabled={sending}
                  autoComplete="email"
                />
                <Field
                  label="Teléfono"
                  type="tel"
                  value={fields.telefono}
                  onChange={(value) => update("telefono", value)}
                  disabled={sending}
                  autoComplete="tel"
                  hint="+1 347 555 0100"
                />
              </div>
              <label className="mt-4 block text-sm font-semibold text-navy dark:text-cream">
                Cómo puedes aportar
                <textarea
                  value={fields.mensaje}
                  onChange={(event) => update("mensaje", event.target.value)}
                  rows={4}
                  disabled={sending}
                  maxLength={2000}
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-3 text-base font-normal text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:border-white/15 dark:bg-navy-deep dark:text-cream"
                />
              </label>
              <label className="absolute -left-[9999px]" aria-hidden="true">
                Sitio web
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
              <p className="mt-4 text-sm text-mist dark:text-cream/75">
                Usaremos tus datos para gestionar tu solicitud. Consulta la{" "}
                <Link to="/legal/$slug" params={{ slug: "privacidad" }} className="underline">
                  política de privacidad
                </Link>
                .
              </p>
              {error ? (
                <p className="mt-3 text-sm font-semibold text-clay" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={sending || !interactive}
                className="mt-5 inline-flex h-12 items-center rounded-full bg-forest px-6 text-sm font-bold text-cream"
              >
                {sending ? "Registrando…" : "Registrar solicitud"}
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-navy dark:text-cream">
      {label}
      <input
        maxLength={type === "email" ? 254 : type === "tel" ? 40 : 100}
        required
        disabled={disabled}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-12 w-full rounded-xl border border-line bg-paper px-3 text-base font-normal text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:border-white/15 dark:bg-navy-deep dark:text-cream"
      />
      {hint ? <span className="mt-1 block text-xs font-normal text-mist">{hint}</span> : null}
    </label>
  );
}
