import { localizedHead } from "@/lib/i18n/seo";
import { T, useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageIntro, Shell } from "@/components/shell";
import { isInternationalPhone, normalizePhone } from "@/lib/phone";
import { submitVolunteer } from "@/lib/volunteer-functions";

export const Route = createFileRoute("/voluntariado")({
  head: ({ matches }) =>
    localizedHead(
      {
        meta: [
          { title: "Voluntariado | Proyecto Génesis · Fundación VNE" },
          {
            name: "description",
            content:
              "Solicitud de voluntariado para Proyecto Génesis y Fundación VNE. Registro de solicitudes en línea.",
          },
        ],
      },
      matches.at(-1)?.search ?? {},
    ),
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
  const { t } = useLanguage();
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
    if (!isInternationalPhone(data.telefono)) {
      setError("Incluye el código de país y entre 8 y 15 dígitos. Ejemplo: +507 6000 0000.");
      return;
    }
    data.telefono = normalizePhone(data.telefono);
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
        kicker={t("Proyecto Génesis")}
        title={t("Voluntariado con oficio, no solo con buena voluntad.")}
        lede={t(
          "Buscamos personas dispuestas a aportar conocimiento, experiencia y tiempo a un modelo productivo. La solicitud se guarda de forma segura y centralizada para que nuestro equipo pueda revisarla.",
        )}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-3xl text-navy dark:text-cream">
            <T>Qué implica</T>
          </h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-mist dark:text-cream/75">
            <li>
              <T>Acompañar formación, producción o coordinación según tu experiencia.</T>
            </li>
            <li>
              <T>Respetar el marco ético y las políticas de la organización.</T>
            </li>
            <li>
              <T>No es un contrato laboral ni una plaza remunerada.</T>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-7">
          {sent ? (
            <div
              className="rounded-card border border-forest/30 bg-card p-6 dark:border-gold/30 dark:bg-navy"
              role="status"
            >
              <h2 className="font-display text-2xl text-navy dark:text-cream">
                <T>Solicitud registrada</T>
              </h2>
              <p className="editorial-justify mt-3 leading-relaxed text-mist dark:text-cream/75">
                {sent.nombre}
                <T>
                  , tu solicitud quedó registrada correctamente. El equipo podrá consultarla desde
                  el panel administrativo.
                </T>
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSent(null)}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm font-bold dark:border-white/15"
                >
                  <T>Nueva solicitud</T>
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
                  label={t("Nombre")}
                  value={fields.nombre}
                  onChange={(value) => update("nombre", value)}
                  disabled={sending || !interactive}
                  autoComplete="given-name"
                />
                <Field
                  label={t("Apellido")}
                  value={fields.apellido}
                  onChange={(value) => update("apellido", value)}
                  disabled={sending || !interactive}
                  autoComplete="family-name"
                />
                <Field
                  label={t("Correo")}
                  type="email"
                  value={fields.correo}
                  onChange={(value) => update("correo", value)}
                  disabled={sending || !interactive}
                  autoComplete="email"
                />
                <Field
                  label={t("Teléfono")}
                  type="tel"
                  value={fields.telefono}
                  onChange={(value) => update("telefono", value)}
                  disabled={sending || !interactive}
                  autoComplete="tel"
                  hint="+1 347 555 0100"
                />
              </div>
              <label className="mt-4 block text-sm font-semibold text-navy dark:text-cream">
                <T>Cómo puedes aportar</T>
                <textarea
                  value={fields.mensaje}
                  onChange={(event) => update("mensaje", event.target.value)}
                  rows={4}
                  disabled={sending || !interactive}
                  maxLength={2000}
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-3 text-base font-normal text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold dark:border-white/15 dark:bg-navy-deep dark:text-cream"
                />
              </label>
              <label className="absolute -left-[9999px]" aria-hidden="true">
                <T>Sitio web</T>
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
              <p className="mt-4 text-sm text-mist dark:text-cream/75">
                <T>Usaremos tus datos para gestionar tu solicitud. Consulta la</T>
                <T> </T>
                <Link to="/legal/$slug" params={{ slug: "privacidad" }} className="underline">
                  <T>política de privacidad</T>
                </Link>
                <T>.</T>
              </p>
              {error ? (
                <p className="mt-3 text-sm font-semibold text-clay" role="alert">
                  <T>{error}</T>
                </p>
              ) : null}
              <button
                type="submit"
                disabled={sending || !interactive}
                className="mt-5 inline-flex h-12 items-center rounded-full bg-forest px-6 text-sm font-bold text-cream"
              >
                <T>{sending ? "Registrando…" : "Registrar solicitud"}</T>
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
      <T>{label}</T>
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
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-mist">
          <T>{hint}</T>
        </span>
      ) : null}
    </label>
  );
}
