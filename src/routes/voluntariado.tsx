import { localizedHead } from "@/lib/i18n/seo";
import { T, useLanguage } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageIntro, Shell } from "@/components/shell";
import {
  formatNationalPhone,
  isInternationalPhone,
  normalizePhone,
  PHONE_COUNTRIES,
} from "@/lib/phone";
import { submitVolunteer } from "@/lib/volunteer-functions";
import { Turnstile } from "@marsidev/react-turnstile";

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
  const { t, language } = useLanguage();
  const [fields, setFields] = useState<Fields>(empty);
  const [phoneCountryCode, setPhoneCountryCode] = useState("US");
  const phoneCountry =
    PHONE_COUNTRIES.find((country) => country.code === phoneCountryCode) ?? PHONE_COUNTRIES[0]!;
  const countryNames = new Intl.DisplayNames([language], { type: "region" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Fields | null>(null);
  const [sending, setSending] = useState(false);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  const [website, setWebsite] = useState("");
  const requestKey = useRef<string | null>(null);
  const submitting = useRef(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  function update(key: keyof Fields, value: string) {
    requestKey.current = null;
    setFields((current) => ({ ...current, [key]: value }));
  }

  function updatePhone(rawValue: string) {
    let country = phoneCountry;
    let digits = rawValue.replace(/\D/g, "");
    const isInternational = rawValue.trim().startsWith("+") || rawValue.trim().startsWith("00");
    if (isInternational) {
      const internationalDigits = rawValue.trim().startsWith("00") ? digits.slice(2) : digits;
      const matches = PHONE_COUNTRIES
        .filter((candidate) => internationalDigits.startsWith(candidate.dialCode))
        .sort((a, b) => b.dialCode.length - a.dialCode.length);
      const match =
        matches.find((candidate) => candidate.code === phoneCountry.code) ?? matches[0];
      if (match) {
        country = match;
        setPhoneCountryCode(match.code);
        digits = internationalDigits.slice(match.dialCode.length);
      }
    }
    requestKey.current = null;
    setFields((current) => ({ ...current, telefono: formatNationalPhone(digits, country) }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const data = {
      nombre: fields.nombre.trim(),
      apellido: fields.apellido.trim(),
      correo: fields.correo.trim(),
      telefono: `+${phoneCountry.dialCode}${fields.telefono.replace(/\D/g, "")}`,
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
    if (!turnstileToken) {
      setError("Completa la verificación de seguridad de Cloudflare.");
      return;
    }
    data.telefono = normalizePhone(data.telefono);
    submitting.current = true;
    requestKey.current ??= crypto.randomUUID();
    setError("");
    setSending(true);
    try {
      await submitVolunteer({
        data: { ...data,
               website,
               requestKey: requestKey.current,
               turnstileToken,
              }
      });
      setError("");
      setSent(data);
      setFields(empty);
      setWebsite("");
      requestKey.current = null;
      setTurnstileToken("");
      setTurnstileKey((current) => current + 1);
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
                <label className="block text-sm font-semibold text-navy dark:text-cream">
                  <T>Teléfono</T>
                  <div className="mt-1.5 flex h-12 w-full overflow-hidden rounded-xl border border-line bg-paper focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold dark:border-white/15 dark:bg-navy-deep">
                    <select
                      aria-label={t("País y código telefónico")}
                      value={phoneCountry.code}
                      disabled={sending || !interactive}
                      onChange={(event) => {
                        const nextCountry = PHONE_COUNTRIES.find((country) => country.code === event.target.value);
                        if (!nextCountry) return;
                        setPhoneCountryCode(nextCountry.code);
                        requestKey.current = null;
                        setFields((current) => ({
                          ...current,
                          telefono: formatNationalPhone(current.telefono, nextCountry),
                        }));
                      }}
                      className="w-[42%] min-w-0 shrink-0 truncate border-r border-line bg-transparent px-3 text-sm font-medium text-ink outline-none dark:border-white/15 dark:text-cream"
                    >
                      {PHONE_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} +{country.dialCode}
                        </option>
                      ))}
                    </select>
                    <span
                      aria-hidden="true"
                      className="flex shrink-0 items-center px-2.5 text-sm font-medium tabular-nums text-mist"
                    >
                      +{phoneCountry.dialCode}
                    </span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      maxLength={24}
                      disabled={sending || !interactive}
                      value={fields.telefono}
                      onChange={(event) => updatePhone(event.target.value)}
                      placeholder="555 123 4567"
                      aria-label={t("Número de teléfono")}
                      className="min-w-0 flex-1 bg-transparent px-2.5 text-base font-normal text-ink outline-none placeholder:text-mist/70 dark:text-cream"
                    />
                  </div>
                  <span className="mt-1 block text-xs font-normal text-mist">
                    <T>Elige tu país; el código internacional y el formato se ajustan automáticamente.</T>
                  </span>
                </label>
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
              
              <div className="mt-5">
                  <p className="mb-2 text-sm font-semibold text-navy dark:text-cream">
                    <T>Verificación de seguridad</T>
                  </p>
                  
                  <Turnstile
                    key={turnstileKey}
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                    onSuccess={(token: string) => {
                      setTurnstileToken(token);
                      setError("");
                    }}
                    onExpire={() => {
                      setTurnstileToken("");
                      setError("La verificación expiró. Vuelve a verificarte.");
                    }}
                    onError={() => {
                      setTurnstileToken("");
                      setError("No se pudo cargar la verificación de seguridad.");
                    }}
                    options={{
                      theme: "auto",
                      size: "flexible",
                    }}
                    />
                </div>
              
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
                disabled={sending || !interactive || !turnstileToken}
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
