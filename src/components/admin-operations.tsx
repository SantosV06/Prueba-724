import { useEffect, useState } from "react";
import { useAdminLanguage } from "@/lib/i18n/admin";
import {
  getAuditEvents,
  getOperationsStatus,
  setTwoFactorPolicy,
  getHomeContent,
  updateHomeContent,
  changeMyPassword,
  getSiteLanguage,
  updateSiteLanguage,
} from "@/lib/admin-operations-functions";
import type { AuditEvent, HomeContent } from "@/lib/admin-operations";
import { isLanguage, languageOptions, type Language } from "@/lib/i18n/translate";
import { defaultHomeContent } from "@/lib/home-content";

const field =
  "mt-2 block min-h-12 w-full rounded-xl border border-line bg-paper p-3 text-ink dark:border-white/20 dark:bg-navy-deep dark:text-cream";
const button =
  "min-h-12 rounded-full border border-line px-5 py-3 text-sm font-semibold disabled:opacity-40 dark:border-white/20";
const panel = "mt-6 rounded-card border border-line p-5 dark:border-white/20";
const message = (cause: unknown) =>
  cause instanceof Error ? cause.message : "No se pudo completar la operación.";

export function MyPassword({ onSignedOut }: { onSignedOut: () => void }) {
  const { t } = useAdminLanguage();
  const [currentPassword, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <details className={`${panel} max-w-lg`}>
      <summary className="cursor-pointer py-2 font-semibold">{t("Cambiar mi contraseña")}</summary>
      <form
        className="mt-4 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          if (password !== confirmation) {
            setError("Las contraseñas no coinciden.");
            return;
          }
          setBusy(true);
          try {
            await changeMyPassword({ data: { currentPassword, password } });
            setCurrent("");
            setPassword("");
            setConfirmation("");
            onSignedOut();
          } catch (cause) {
            setError(message(cause));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          {t("Contraseña actual")}
          <input
            type="password"
            required
            autoComplete="current-password"
            maxLength={256}
            className={field}
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="block">
          {t("Nueva contraseña")}
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={14}
            maxLength={256}
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block">
          {t("Repetir nueva contraseña")}
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={14}
            maxLength={256}
            className={field}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </label>
        <p className="text-sm">
          {t("Al guardar se cerrarán todas tus sesiones. El segundo factor se conserva.")}
        </p>
        {error && <p role="alert">{t(error)}</p>}
        <button disabled={busy} className={button}>
          {t(busy ? "Procesando…" : "Guardar mi contraseña")}
        </button>
      </form>
    </details>
  );
}

export function AdminOperations() {
  const { t } = useAdminLanguage();
  const [tab, setTab] = useState<"security" | "audit" | "content" | "language" | null>("security");
  return (
    <section className={panel} aria-label={t("Herramientas del propietario")}>
      <h2 className="font-display text-2xl">{t("Herramientas del propietario")}</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {(
          [
            ["security", "Seguridad del equipo"],
            ["audit", "Historial de actividad"],
            ["content", "Editar portada"],
            ["language", "Idioma predeterminado"],
          ] as const
        ).map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-expanded={tab === id}
            aria-controls={`owner-tool-${id}`}
            className={button}
            onClick={() => setTab((current) => (current === id ? null : id))}
          >
            {t(label)}
          </button>
        ))}
      </div>
      {tab && (
        <div id={`owner-tool-${tab}`}>
          {tab === "security" ? (
            <SecurityPolicy />
          ) : tab === "audit" ? (
            <AuditViewer />
          ) : tab === "content" ? (
            <HomeEditor />
          ) : (
            <SiteLanguage />
          )}
        </div>
      )}
    </section>
  );
}

function SecurityPolicy() {
  const { t } = useAdminLanguage();
  const [status, setStatus] = useState<Awaited<ReturnType<typeof getOperationsStatus>> | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void getOperationsStatus()
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((cause) => {
        if (active) setError(message(cause));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="mt-5 space-y-4">
      {error && <p role="alert">{t(error)}</p>}
      {!status ? (
        <p role="status">{t("Cargando…")}</p>
      ) : (
        <>
          <p>
            {t("Cuentas activas con 2FA")}: {status.protectedAccounts} / {status.activeAccounts}
          </p>
          <p>
            {t("2FA obligatorio")}: {t(status.required ? "Activado" : "Desactivado")}
          </p>
          <p className="max-w-2xl text-sm">
            {t(
              "Al exigir 2FA, las cuentas sin autenticador solo podrán configurarlo y cerrar sesión. Sus solicitudes y exportaciones quedarán bloqueadas.",
            )}
          </p>
          <p className="text-sm">
            {status.retentionDays
              ? `${t("Plazo configurado para solicitudes en papelera")}: ${status.retentionDays} ${t("días")}.`
              : t(
                  "No hay un plazo de conservación configurado. No se eliminan solicitudes automáticamente.",
                )}
          </p>
          <form
            className="max-w-lg space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              try {
                await setTwoFactorPolicy({ data: { required: !status.required, password } });
                setPassword("");
                setStatus(await getOperationsStatus());
              } catch (cause) {
                setError(message(cause));
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="block">
              {t("Contraseña para cambiar la política")}
              <input
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                className={field}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className={button} disabled={busy || !status.configured}>
              {t(status.required ? "Dejar 2FA opcional" : "Exigir 2FA al equipo")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function AuditViewer() {
  const { t, language } = useAdminLanguage();
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [filters, setFilters] = useState({ page: 1, actor: "", action: "" });
  const [result, setResult] = useState<{
    rows: AuditEvent[];
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setResult(null);
    void getAuditEvents({ data: filters })
      .then((value) => {
        if (active) setResult(value);
      })
      .catch((cause) => {
        if (active) setError(message(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters]);
  return (
    <div className="mt-5">
      <p className="text-sm">
        {t(
          "Este historial muestra acciones y responsables. No muestra contraseñas, códigos ni mensajes de voluntarios.",
        )}
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ page: 1, actor, action });
        }}
      >
        <label className="flex-1">
          {t("Usuario exacto")}
          <input
            maxLength={50}
            className={field}
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </label>
        <label className="flex-1">
          {t("Acción exacta")}
          <input
            maxLength={60}
            className={field}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </label>
        <button className={button} disabled={loading}>
          {t("Buscar")}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4">
          {t(error)}
        </p>
      )}
      {loading ? (
        <p className="mt-4" role="status">
          {t("Cargando…")}
        </p>
      ) : (
        result && (
          <>
            <p className="mt-4" role="status">
              {result.total} {t("eventos")}
            </p>
            <ul className="mt-4 space-y-3">
              {result.rows.map((row) => (
                <li
                  key={row.id}
                  className="break-words border-t border-line pt-3 dark:border-white/20"
                >
                  <strong>{row.action}</strong> · {row.actor ?? t("Sistema")}
                  <time dateTime={row.date} className="mt-1 block text-sm">
                    {new Date(row.date).toLocaleString(
                      language === "es" ? "es-PA" : language === "pt" ? "pt-BR" : "en-US",
                    )}
                  </time>
                  {row.requestId && (
                    <p className="text-sm">
                      {t("Identificador de solicitud")}: {row.requestId}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {!result.rows.length && <p className="mt-4">{t("No hay eventos que coincidan.")}</p>}
            <div className="mt-4 flex gap-3">
              <button
                className={button}
                disabled={result.page <= 1}
                onClick={() => setFilters({ ...filters, page: result.page - 1 })}
              >
                {t("Anterior")}
              </button>
              <button
                className={button}
                disabled={result.page * result.pageSize >= result.total}
                onClick={() => setFilters({ ...filters, page: result.page + 1 })}
              >
                {t("Siguiente")}
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}

function HomeEditor() {
  const { t } = useAdminLanguage();
  const [content, setContent] = useState<HomeContent>(defaultHomeContent);
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    void getHomeContent()
      .then((value) => {
        if (active) {
          setContent(value.content ?? defaultHomeContent);
          setRevision(value.revision);
          setReady(true);
        }
      })
      .catch((cause) => {
        if (active) setError(message(cause));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <form
      className="mt-5 space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");
        try {
          await updateHomeContent({ data: { content, revision } });
          const latest = await getHomeContent();
          setContent(latest.content ?? defaultHomeContent);
          setRevision(latest.revision);
          setNotice("Portada guardada. Los cambios aparecen al volver a cargar el inicio.");
        } catch (cause) {
          setError(message(cause));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm">
        {t(
          "Edita el título y la introducción de la portada en los tres idiomas. Se publica texto sin formato.",
        )}
      </p>
      {(["es", "en", "pt"] as const).map((lang) => (
        <fieldset key={lang} className="space-y-3" disabled={!ready || busy}>
          <legend className="font-semibold">
            {lang === "es" ? "Español" : lang === "en" ? "English" : "Português"}
          </legend>
          <label className="block">
            {t("Título de portada")} ({lang})
            <input
              required
              maxLength={160}
              className={field}
              value={content.title[lang]}
              onChange={(e) =>
                setContent({ ...content, title: { ...content.title, [lang]: e.target.value } })
              }
            />
          </label>
          <label className="block">
            {t("Introducción de portada")} ({lang})
            <textarea
              required
              maxLength={700}
              rows={4}
              className={field}
              value={content.description[lang]}
              onChange={(e) =>
                setContent({
                  ...content,
                  description: { ...content.description, [lang]: e.target.value },
                })
              }
            />
          </label>
        </fieldset>
      ))}
      {error && <p role="alert">{t(error)}</p>}
      {notice && <p role="status">{t(notice)}</p>}
      <button className={button} disabled={!ready || busy}>
        {t("Guardar portada")}
      </button>
    </form>
  );
}

function SiteLanguage() {
  const { t } = useAdminLanguage();
  const [language, setLanguage] = useState<Language>("es");
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    void getSiteLanguage()
      .then((value) => {
        if (active) {
          setLanguage(value.language);
          setRevision(value.revision);
          setReady(true);
        }
      })
      .catch((cause) => {
        if (active) setError(message(cause));
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <form
      className="mt-5 max-w-lg space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");
        try {
          const result = await updateSiteLanguage({ data: { language, revision } });
          setRevision(result.revision);
          setNotice("Idioma predeterminado guardado.");
        } catch (cause) {
          setError(message(cause));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm">
        {t(
          "Se aplica a visitantes sin idioma elegido. Los enlaces con idioma y las preferencias guardadas tienen prioridad.",
        )}
      </p>
      <label className="block font-semibold">
        {t("Idioma predeterminado")}
        <select
          aria-label={t("Idioma predeterminado")}
          className={field}
          value={language}
          disabled={!ready || busy}
          onChange={(event) => {
            if (isLanguage(event.target.value)) {
              setLanguage(event.target.value);
              setNotice("");
            }
          }}
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code} lang={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{t(error)}</p>}
      {notice && <p role="status">{t(notice)}</p>}
      <button className={button} disabled={!ready || busy}>
        {t(busy ? "Procesando…" : "Guardar idioma predeterminado")}
      </button>
    </form>
  );
}
