import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { clearVolunteers, listVolunteers, mailtoFor, removeVolunteer, volunteersToCsv, type Volunteer } from "@/lib/volunteers";

export const Route = createFileRoute("/solicitudes")({
  head: () => ({
    meta: [
      { title: "Solicitudes locales | Fundación VNE" },
      { name: "description", content: "Solicitudes de voluntariado guardadas solo en este navegador." },
    ],
  }),
  component: Solicitudes,
});

function Solicitudes() {
  const [rows, setRows] = useState<Volunteer[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRows(listVolunteers());
    setReady(true);
  }, []);

  function download() {
    const blob = new Blob([volunteersToCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "voluntarios-vne.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <p className="text-xs font-bold tracking-[0.18em] text-gold-deep uppercase">Solo este dispositivo</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl text-navy dark:text-cream">Solicitudes de voluntariado</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-mist dark:text-cream/75">
          Estas fichas viven en el navegador donde se enviaron. No hay servidor ni contraseña: en GitHub Pages no se puede guardar una base de datos. Exporta el CSV o reenvía cada correo a info@foundationvne.com.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={download}
            disabled={!rows.length}
            className="inline-flex h-11 items-center rounded-full bg-navy px-5 text-sm font-bold text-cream disabled:opacity-40 dark:bg-gold dark:text-navy"
          >
            Descargar CSV
          </button>
          <button
            type="button"
            onClick={() => {
              clearVolunteers();
              setRows([]);
            }}
            disabled={!rows.length}
            className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm font-bold disabled:opacity-40 dark:border-white/15"
          >
            Borrar todas
          </button>
          <Link to="/voluntariado" className="inline-flex h-11 items-center text-sm font-bold text-forest dark:text-gold">
            Nueva solicitud
          </Link>
        </div>

        {!ready ? <p className="mt-8 text-mist">Cargando…</p> : null}
        {ready && rows.length === 0 ? (
          <p className="mt-10 rounded-card border border-dashed border-line p-8 text-mist dark:border-white/15">No hay solicitudes en este navegador.</p>
        ) : null}

        <ul className="mt-8 grid gap-4">
          {rows.map((row) => (
            <li key={row.id} className="rounded-card border border-line bg-card p-5 dark:border-white/10 dark:bg-navy">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl text-navy dark:text-cream">
                  {row.nombre} {row.apellido}
                </h2>
                <time className="text-xs text-mist" dateTime={row.fecha}>
                  {new Date(row.fecha).toLocaleString("es")}
                </time>
              </div>
              <p className="mt-2 text-sm text-mist dark:text-cream/75">
                {row.correo} · {row.telefono}
              </p>
              {row.mensaje ? <p className="mt-3 leading-relaxed">{row.mensaje}</p> : null}
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold">
                <a href={mailtoFor(row)} className="text-forest dark:text-gold">
                  Preparar correo
                </a>
                <button
                  type="button"
                  className="text-clay"
                  onClick={() => setRows(removeVolunteer(row.id))}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
