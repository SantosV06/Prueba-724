import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import {
  getAdminStatus, loginAdmin, logoutAdmin,
  listVolunteerRequests, removeVolunteerRequest,
} from "@/lib/volunteer-functions";
import { volunteersToCsv } from "@/lib/volunteers";
import type { VolunteerRequest } from "@/lib/volunteer-service.server";

export const Route = createFileRoute("/solicitudes")({
  head: () => ({ meta: [
    { title: "Administración de solicitudes | Fundación VNE" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: Solicitudes,
});

function Solicitudes() {
  const [rows, setRows] = useState<VolunteerRequest[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const records = await listVolunteerRequests();
    setRows(records);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const status = await getAdminStatus();
        if (!active) return;
        setAuthenticated(status.authenticated);
        if (status.authenticated) {
          const records = await listVolunteerRequests();
          if (active) setRows(records);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Error de conexión");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await loginAdmin({ data: { password } });
      setAuthenticated(true);
      setPassword("");
      await refresh();
    } catch (cause) {
      setAuthenticated(false);
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar sesión");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try {
      await logoutAdmin();
      setRows([]); setAuthenticated(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cerrar sesión");
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta solicitud permanentemente?")) return;
    setBusy(true); setError("");
    try {
      await removeVolunteerRequest({ data: { id } });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar");
    } finally { setBusy(false); }
  }

  function download() {
    const blob = new Blob([volunteersToCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "voluntarios-vne.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <Shell>
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">Administración privada</p>
      <h1 className="mt-3 font-display text-4xl text-navy dark:text-cream">Solicitudes de voluntariado</h1>
      <p className="mt-4 max-w-2xl text-mist dark:text-cream/75">
        Datos centralizados en PostgreSQL. El acceso requiere credenciales administrativas.
      </p>
      {error && <p role="alert" className="mt-5 rounded-lg border border-clay p-3 text-clay dark:text-cream">{error}</p>}
      {!ready ? <p className="mt-6">Verificando sesión…</p> : !authenticated ? (
        <form onSubmit={login} className="mt-8 max-w-md rounded-card border border-line bg-card p-6 dark:border-white/10 dark:bg-navy">
          <label className="block text-sm font-semibold">Contraseña administrativa
            <input autoComplete="current-password" type="password" required value={password}
              onChange={event => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-line bg-paper px-3 text-ink dark:border-white/15 dark:bg-navy-deep dark:text-cream" />
          </label>
          <button disabled={busy} type="submit" className="mt-5 h-11 rounded-full bg-navy px-6 font-semibold text-cream disabled:opacity-50 dark:bg-gold dark:text-navy">
            {busy ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>
      ) : <>
        <div className="mt-7 flex flex-wrap gap-3">
          <button disabled={!rows.length || busy} onClick={download} className="rounded-full bg-navy px-5 py-3 text-sm font-bold text-cream disabled:opacity-40 dark:bg-gold dark:text-navy">Exportar CSV</button>
          <button disabled={busy} onClick={logout} className="rounded-full border border-line px-5 py-3 text-sm font-semibold dark:border-white/20">Cerrar sesión</button>
          <Link to="/voluntariado" className="px-3 py-3 text-sm font-semibold text-forest dark:text-gold">Abrir formulario</Link>
        </div>
        <p className="mt-6 text-sm text-mist dark:text-cream/75">{rows.length} solicitudes (máximo 1000 recientes)</p>
        <ul className="mt-6 grid gap-4">
          {rows.map(row => <li key={row.id} className="rounded-card border border-line bg-card p-5 dark:border-white/10 dark:bg-navy">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl text-navy dark:text-cream">{row.nombre} {row.apellido}</h2>
              <time className="text-xs text-mist">{new Date(row.fecha).toLocaleString("es")}</time>
            </div>
            <p className="mt-2 text-sm">{row.correo} · {row.telefono}</p>
            {row.mensaje && <p className="mt-3 whitespace-pre-wrap">{row.mensaje}</p>}
            <button disabled={busy} onClick={() => void remove(row.id)} className="mt-4 text-sm font-semibold text-clay dark:text-gold">Eliminar</button>
          </li>)}
        </ul>
        {rows.length === 0 && <p className="mt-6">Todavía no hay solicitudes registradas.</p>}
      </>}
    </section>
  </Shell>;
}
