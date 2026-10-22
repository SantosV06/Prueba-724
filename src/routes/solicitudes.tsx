import { useAdminLanguage } from "@/lib/i18n/admin";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminAccounts } from "@/components/admin-accounts";
import type { AdminIdentity } from "@/lib/admin-accounts";
import { Shell } from "@/components/shell";
import {
  getAdminStatus,
  loginAdmin,
  logoutAdmin,
  listVolunteerRequests,
  removeVolunteerRequest,
  restoreVolunteerRequest,
  updateVolunteerStatus,
  exportVolunteerRequests,
  purgeVolunteerRequest,
} from "@/lib/volunteer-functions";
import { volunteersToCsv } from "@/lib/volunteers";
import type { VolunteerRequest, RequestFilters, RequestStatus } from "@/lib/volunteer-schema";

export const Route = createFileRoute("/solicitudes")({
  head: () => ({
    meta: [
      { title: "Administración de solicitudes | Fundación VNE" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Solicitudes,
});
const states: RequestStatus[] = ["pendiente", "contactada", "aceptada", "descartada"];
const initialFilters: RequestFilters = { page: 1, search: "", status: "", trash: false };
const inputStyle =
  "h-12 rounded-xl border border-line bg-paper px-3 text-ink focus-visible:outline-2 focus-visible:outline-gold dark:border-white/15 dark:bg-navy-deep dark:text-cream";
const buttonStyle =
  "rounded-full border border-line px-5 py-3 text-sm font-semibold disabled:opacity-40 dark:border-white/20";
function Solicitudes() {
  const { t, language } = useAdminLanguage();
  const [rows, setRows] = useState<VolunteerRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("admin");
  const [user, setUser] = useState<AdminIdentity | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    try {
      const result = await listVolunteerRequests({ data: filters });
      if (!mounted.current || sequence !== requestSequence.current) return;
      setRows(result.rows);
      setTotal(result.total);
      setPageSize(result.pageSize);
      if (result.page !== filters.page)
        setFilters((current) => ({ ...current, page: result.page }));
    } finally {
      if (mounted.current && sequence === requestSequence.current) setLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    let active = true;
    void getAdminStatus()
      .then((status) => {
        if (active) {
          setAuthenticated(status.authenticated);
          setUser(status.user);
        }
      })
      .catch((cause) => {
        if (active) setError(message(cause));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!authenticated) return;
    void refresh().catch((cause) => {
      if (mounted.current) setError(message(cause));
    });
  }, [authenticated, refresh]);
  // Clear personal data from the screen when a session expires or access is revoked.
  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    let checking = false;
    const verify = async () => {
      if (document.hidden || checking) return;
      checking = true;
      try {
        const status = await getAdminStatus();
        if (active && !status.authenticated) {
          requestSequence.current++;
          setRows([]);
          setTotal(0);
          setShowAccounts(false);
          setUser(null);
          setAuthenticated(false);
          setError("Tu sesión terminó. Inicia sesión nuevamente.");
        }
      } catch {
        // An intermittent network failure is not proof that the session was revoked.
      } finally {
        checking = false;
      }
    };
    const check = () => {
      void verify();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [authenticated]);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginAdmin({ data: { username, password } });
      const status = await getAdminStatus();
      setUser(status.user);
      setPassword("");
      setAuthenticated(status.authenticated);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await logoutAdmin();
      requestSequence.current++;
      setRows([]);
      setTotal(0);
      setAuthenticated(false);
      setUser(null);
      setShowAccounts(false);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError("");
    try {
      const chunks: BlobPart[] = ["\uFEFF"];
      let bytes = 0;
      let revision: string | undefined;
      let first = true;
      let cursor: { fecha: string; id: string } | undefined;
      let snapshot: string | undefined;
      do {
        const result = await exportVolunteerRequests({
          data: { ...filters, cursor, snapshot, revision },
        });
        let csv = volunteersToCsv(result.rows);
        if (!first) csv = "\r\n" + csv.slice(csv.indexOf("\r\n") + 2);
        if (!first && !result.rows.length) csv = "";
        const chunk = new Blob([csv]);
        bytes += chunk.size;
        if (bytes > 25 * 1024 * 1024)
          throw new Error(
            "El CSV supera 25 MB. Filtra los resultados para descargarlos en grupos más pequeños.",
          );
        chunks.push(chunk);
        first = false;
        revision = result.revision;
        cursor = result.next ?? undefined;
        snapshot = result.snapshot;
      } while (cursor);
      const blob = new Blob(chunks, { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "voluntarios-vne.csv";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell>
      <section lang={language} className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-deep">
          {t("Administración privada")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-navy dark:text-cream">
          {t("Solicitudes de voluntariado")}
        </h1>
        <p className="mt-4 max-w-2xl text-mist dark:text-cream/75">
          {t("Revisa las solicitudes, registra su avance y conserva un seguimiento del equipo.")}
        </p>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-clay p-3 text-clay dark:text-cream"
          >
            {t(error)}
          </p>
        )}
        {!ready ? (
          <p className="mt-6" role="status">
            {t("Verificando sesión…")}
          </p>
        ) : !authenticated ? (
          <form
            onSubmit={login}
            className="mt-8 max-w-md rounded-card border border-line bg-card p-6 dark:border-white/10 dark:bg-navy"
          >
            <label className="mb-4 block text-sm font-semibold">
              {t("Usuario")}
              <input
                autoComplete="username"
                autoCapitalize="none"
                required
                maxLength={50}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={`mt-2 w-full ${inputStyle}`}
              />
            </label>
            <label className="block text-sm font-semibold">
              {t("Contraseña administrativa")}
              <input
                autoComplete="current-password"
                type="password"
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`mt-2 w-full ${inputStyle}`}
              />
            </label>
            <button
              disabled={busy}
              type="submit"
              className="mt-5 h-12 rounded-full bg-navy px-6 font-semibold text-cream disabled:opacity-50 dark:bg-gold dark:text-navy"
            >
              {busy ? t("Verificando…") : t("Iniciar sesión")}
            </button>
            <p className="mt-4 text-sm text-mist dark:text-cream/75">
              {t(
                "¿Olvidaste tu contraseña? Pide al propietario que la restablezca. Si eres el propietario, consulta la guía de recuperación del repositorio.",
              )}
            </p>
          </form>
        ) : (
          <>
            <p className="mt-6 text-sm">
              {t("Sesión de")} {user?.displayName} ({user?.username})
            </p>
            {user?.role === "owner" && (
              <button
                className={`mt-4 ${buttonStyle}`}
                onClick={() => setShowAccounts((value) => !value)}
                aria-expanded={showAccounts}
              >
                {showAccounts ? t("Ocultar usuarios") : t("Administrar usuarios")}
              </button>
            )}
            {showAccounts && user && (
              <AdminAccounts
                currentId={user.id}
                onSignedOut={() => {
                  requestSequence.current++;
                  setAuthenticated(false);
                  setUser(null);
                  setRows([]);
                  setTotal(0);
                  setShowAccounts(false);
                }}
              />
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                disabled={!total || busy || loading}
                onClick={() => void download()}
                className="rounded-full bg-navy px-5 py-3 text-sm font-bold text-cream disabled:opacity-40 dark:bg-gold dark:text-navy"
              >
                {busy ? t("Procesando…") : t("Exportar resultados CSV")}
              </button>
              <button
                disabled={busy || loading}
                onClick={() =>
                  setFilters((current) => ({ ...current, trash: !current.trash, page: 1 }))
                }
                className={buttonStyle}
              >
                {filters.trash ? t("Ver solicitudes activas") : t("Ver papelera")}
              </button>
              <button disabled={busy} onClick={() => void logout()} className={buttonStyle}>
                {t("Cerrar sesión")}
              </button>
              <Link
                to="/voluntariado"
                className="px-3 py-3 text-sm font-semibold text-forest dark:text-gold"
              >
                {t("Abrir formulario")}
              </Link>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                setFilters((current) => ({ ...current, page: 1, search }));
              }}
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <label className="flex-1 text-sm font-semibold">
                {t("Buscar por nombre, correo o teléfono")}
                <input
                  type="search"
                  maxLength={100}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className={`mt-2 w-full ${inputStyle}`}
                />
              </label>
              <label className="text-sm font-semibold">
                {t("Estado")}
                <select
                  value={filters.status}
                  disabled={busy}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      page: 1,
                      status: event.target.value as RequestStatus | "",
                    }))
                  }
                  className={`mt-2 block w-full ${inputStyle}`}
                >
                  <option value="">{t("Todos")}</option>
                  {states.map((state) => (
                    <option key={t(state)} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={busy || loading} type="submit" className={buttonStyle}>
                {t("Buscar")}
              </button>
            </form>
            <p className="mt-6 text-sm text-mist dark:text-cream/75" role="status">
              {loading
                ? t("Cargando…")
                : `${total} ${t("solicitudes")}${filters.trash ? ` ${t("en papelera")}` : ""}. ${t("Página")} ${filters.page} ${t("de")} ${Math.max(1, Math.ceil(total / pageSize))}.`}
            </p>
            <ul className="mt-6 grid gap-4" aria-busy={loading}>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-card border border-line bg-card p-5 dark:border-white/10 dark:bg-navy"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="break-words font-display text-2xl text-navy dark:text-cream">
                      {row.nombre} {row.apellido}
                    </h2>
                    <time dateTime={row.fecha} className="text-xs text-mist dark:text-cream/70">
                      {new Date(row.fecha).toLocaleString(
                        language === "es" ? "es-PA" : language === "en" ? "en-US" : "pt-BR",
                      )}
                    </time>
                  </div>
                  <p className="mt-2 break-words text-sm">
                    {row.correo} · {row.telefono}
                  </p>
                  {row.mensaje && (
                    <p className="mt-3 whitespace-pre-wrap break-words">{row.mensaje}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-end gap-4">
                    {!filters.trash && (
                      <label className="text-sm font-semibold">
                        {t("Estado de")} {row.nombre}
                        <select
                          value={row.status}
                          disabled={busy || loading}
                          onChange={(event) =>
                            void mutate(() =>
                              updateVolunteerStatus({
                                data: { id: row.id, status: event.target.value as RequestStatus },
                              }),
                            )
                          }
                          className={`mt-2 block ${inputStyle}`}
                        >
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <button
                      disabled={busy || loading}
                      onClick={() => {
                        if (filters.trash)
                          void mutate(() => restoreVolunteerRequest({ data: { id: row.id } }));
                        else if (
                          window.confirm(
                            t("¿Mover esta solicitud a la papelera? Podrás restaurarla."),
                          )
                        )
                          void mutate(() => removeVolunteerRequest({ data: { id: row.id } }));
                      }}
                      className={buttonStyle}
                    >
                      {filters.trash ? t("Restaurar") : t("Mover a papelera")}
                    </button>
                    {filters.trash && user?.role === "owner" && (
                      <button
                        disabled={busy || loading}
                        className={buttonStyle}
                        onClick={() => {
                          if (
                            window.confirm(
                              t(
                                "¿Eliminar definitivamente los datos personales de esta solicitud? Esta acción no se puede deshacer.",
                              ),
                            )
                          )
                            void mutate(() => purgeVolunteerRequest({ data: { id: row.id } }));
                        }}
                      >
                        {t("Eliminar definitivamente")}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {!rows.length && !loading && (
              <p className="mt-6">{t("No hay solicitudes que coincidan con estos filtros.")}</p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                disabled={busy || loading || filters.page <= 1}
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                className={buttonStyle}
              >
                {t("Anterior")}
              </button>
              <button
                disabled={busy || loading || filters.page * pageSize >= total}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                className={buttonStyle}
              >
                {t("Siguiente")}
              </button>
            </div>
          </>
        )}
      </section>
    </Shell>
  );
}
function message(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "No se pudo completar la operación. Inténtalo nuevamente.";
}
