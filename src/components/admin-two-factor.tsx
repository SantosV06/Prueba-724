import { useAdminLanguage } from "@/lib/i18n/admin";
import { useEffect, useState } from "react";
import {
  getTwoFactorStatus,
  beginTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
} from "@/lib/admin-totp-functions";
const inputStyle =
  "mt-2 h-12 w-full rounded-xl border border-line bg-paper px-3 text-ink dark:border-white/15 dark:bg-navy-deep dark:text-cream";
const buttonStyle =
  "min-h-12 rounded-full border border-line px-5 py-3 text-sm font-semibold disabled:opacity-40 dark:border-white/20";
export function AdminTwoFactor({ onSignedOut }: { onSignedOut: (codes?: string[]) => void }) {
  const { t } = useAdminLanguage();
  const [status, setStatus] = useState<{
    enabled: boolean;
    configured: boolean;
    remaining: number;
  } | null>(null);
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void getTwoFactorStatus()
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch(() => {
        if (active) setError("No se pudo consultar la configuración 2FA.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (status?.enabled) {
        await disableTwoFactor({ data: { password, code } });
        onSignedOut();
      } else if (setup) {
        const result = await confirmTwoFactor({ data: { password, code } });
        setSetup(null);
        setPassword("");
        setCode("");
        onSignedOut(result.codes);
      } else {
        setSetup(await beginTwoFactor({ data: { password } }));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="mt-5 max-w-lg rounded-card border border-line bg-card p-5 dark:border-white/15 dark:bg-navy">
      <summary className="cursor-pointer py-2 font-semibold">
        {t("Seguridad de mi cuenta · 2FA")}
      </summary>
      {error && (
        <p role="alert" className="mt-3 text-clay dark:text-cream">
          {t(error)}
        </p>
      )}
      {!status ? (
        <p role="status">{t("Consultando seguridad…")}</p>
      ) : (
        <>
          <p className="mt-3 text-sm">
            {status.enabled
              ? t("2FA activo. Códigos de recuperación restantes: {count}.").replace(
                  "{count}",
                  String(status.remaining),
                )
              : t("2FA desactivado. Protege tu cuenta con una app de autenticación.")}
          </p>
          {!status.configured && (
            <p className="mt-3 text-sm">
              {t("La configuración del autenticador no está disponible. Contacta al operador.")}
            </p>
          )}
          {(status.configured || status.enabled) && (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">
                {t("Contraseña actual")}
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  maxLength={256}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputStyle}
                />
              </label>
              {setup && (
                <div className="space-y-3">
                  <p className="text-sm">
                    {t(
                      "Escanea este código con tu app de autenticación. La configuración caduca en 10 minutos.",
                    )}
                  </p>
                  <img
                    src={setup.qr}
                    alt={t("Código QR para configurar tu autenticador de Fundación VNE")}
                    width={256}
                    height={256}
                    className="max-w-full rounded-lg"
                  />
                  <p className="text-sm">
                    {t("En este mismo teléfono puedes introducir esta clave manualmente:")}
                  </p>
                  <code className="block break-all rounded-lg border border-line p-3 text-sm">
                    {setup.secret}
                  </code>
                  <p className="text-sm">
                    {t("Guarda esta clave de forma privada. No la compartas.")}
                  </p>
                </div>
              )}
              {(setup || status.enabled) && (
                <label className="block text-sm font-semibold">
                  {status.enabled
                    ? t("Código del autenticador o de recuperación")
                    : t("Código del autenticador")}
                  <input
                    required
                    autoComplete="one-time-code"
                    inputMode={status.enabled ? "text" : "numeric"}
                    pattern={status.enabled ? undefined : "[0-9]{6}"}
                    minLength={6}
                    maxLength={status.enabled ? 100 : 6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={inputStyle}
                  />
                </label>
              )}
              {status.enabled && (
                <p className="text-sm">
                  {t(
                    "Puedes usar un código de recuperación sin utilizar si perdiste el autenticador. Desactivar 2FA elimina tus códigos de recuperación y cierra todas tus sesiones. Si acabas de iniciar sesión, espera al siguiente código.",
                  )}
                </p>
              )}
              <button disabled={busy} className={buttonStyle} type="submit">
                {busy
                  ? t("Procesando…")
                  : status.enabled
                    ? t("Desactivar 2FA y cerrar sesiones")
                    : setup
                      ? t("Confirmar y activar 2FA")
                      : t("Configurar autenticador")}
              </button>
              {setup && (
                <button
                  type="button"
                  disabled={busy}
                  className={buttonStyle}
                  onClick={() => {
                    setSetup(null);
                    setCode("");
                    setPassword("");
                  }}
                >
                  {t("Cancelar")}
                </button>
              )}
            </form>
          )}
        </>
      )}
    </details>
  );
}
