import { useAdminLanguage } from "@/lib/i18n/admin";
import { useEffect, useState } from "react";
import {
  createAdminAccount,
  getAdminAccounts,
  updateAdminAccount,
} from "@/lib/volunteer-functions";
import type { AdminAccount } from "@/lib/admin-accounts";

const field =
  "mt-1 block h-12 w-full rounded-xl border border-line bg-paper px-3 dark:border-white/20 dark:bg-navy-deep";
const button =
  "rounded-full border border-line px-4 py-3 text-sm font-semibold disabled:opacity-40 dark:border-white/20";
export function AdminAccounts({
  currentId,
  onSignedOut,
}: {
  currentId: string;
  onSignedOut: () => void;
}) {
  const { t } = useAdminLanguage();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [target, setTarget] = useState("");
  const [replacement, setReplacement] = useState("");
  useEffect(() => {
    let active = true;
    void getAdminAccounts()
      .then((rows) => {
        if (active) setAccounts(rows);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar las cuentas.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setAccounts(await getAdminAccounts());
      setNotice(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-labelledby="accounts-heading"
      className="mt-8 rounded-card border border-line p-5 dark:border-white/20"
    >
      <h2 id="accounts-heading" className="font-display text-2xl">
        {t("Usuarios del panel")}
      </h2>
      <p className="mt-2 text-sm">
        {t(
          "Solo el propietario puede crear cuentas o cambiar el acceso. Las contraseñas se guardan protegidas y no pueden consultarse.",
        )}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-clay dark:text-cream">
          {t(error)}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3">
          {t(notice)}
        </p>
      )}
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await createAdminAccount({ data: { username, displayName, password } });
            setUsername("");
            setDisplayName("");
            setPassword("");
          }, "Usuario creado. Comparte sus credenciales de forma privada.");
        }}
      >
        <label>
          {t("Nombre de la persona")}
          <input
            className={field}
            required
            maxLength={100}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          {t("Nuevo usuario")}
          <input
            className={field}
            required
            minLength={3}
            maxLength={50}
            pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,49}"
            autoComplete="off"
            autoCapitalize="none"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          {t("Contraseña del nuevo usuario")}
          <input
            className={field}
            type="password"
            required
            minLength={14}
            maxLength={256}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="flex items-end">
          <button className={button} disabled={busy}>
            {t("Crear usuario")}
          </button>
        </div>
      </form>
      <ul className="mt-6 grid gap-3">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 dark:border-white/15"
          >
            <span className="min-w-0 break-words">
              {account.displayName} · <strong>{account.username}</strong> ·{" "}
              {account.role === "owner"
                ? t("Propietario")
                : account.enabled
                  ? t("Administrador activo")
                  : t("Desactivado")}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                className={button}
                disabled={busy}
                onClick={() => {
                  setTarget(account.id);
                  setReplacement("");
                  setNotice("");
                }}
              >
                {t("Cambiar contraseña de")} {account.username}
              </button>
              {account.role !== "owner" && (
                <button
                  className={button}
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `${t(account.enabled ? "¿Desactivar" : "¿Activar")} ${account.username}? ${t("Se cerrarán sus sesiones actuales.")}`,
                      )
                    )
                      void run(
                        () =>
                          updateAdminAccount({
                            data: { id: account.id, enabled: !account.enabled },
                          }),
                        "Acceso actualizado; sesiones anteriores revocadas.",
                      );
                  }}
                >
                  {account.enabled ? t("Desactivar") : t("Activar")} {account.username}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {target && (
        <form
          className="mt-5 max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            if (target === currentId) {
              setBusy(true);
              setError("");
              void updateAdminAccount({ data: { id: target, password: replacement } })
                .then(() => {
                  setReplacement("");
                  onSignedOut();
                })
                .catch((cause) =>
                  setError(
                    cause instanceof Error ? cause.message : t("No se pudo cambiar la contraseña."),
                  ),
                )
                .finally(() => setBusy(false));
            } else
              void run(async () => {
                await updateAdminAccount({ data: { id: target, password: replacement } });
                setTarget("");
                setReplacement("");
              }, "Contraseña actualizada; sesiones anteriores revocadas.");
          }}
        >
          <label>
            {t("Nueva contraseña de")} {accounts.find((account) => account.id === target)?.username}
            <input
              autoFocus
              type="password"
              className={field}
              autoComplete="new-password"
              required
              minLength={14}
              maxLength={256}
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
            />
          </label>
          <p className="mt-2 text-sm">
            {t("Al guardar se cerrarán todas las sesiones de esta cuenta")}
            {target === currentId ? t(", incluida la actual") : ""}.
          </p>
          <div className="mt-3 flex gap-2">
            <button className={button} disabled={busy}>
              {t("Guardar contraseña")}
            </button>
            <button
              type="button"
              className={button}
              disabled={busy}
              onClick={() => {
                setTarget("");
                setReplacement("");
              }}
            >
              {t("Cancelar")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
