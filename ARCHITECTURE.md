# Arquitectura

## Aplicación activa

TanStack Start combina renderizado de servidor, React y funciones del servidor. Vite compila y Nitro adapta el resultado a Vercel. PostgreSQL de Neon almacena solicitudes y administración. PGLite proporciona una base desechable para desarrollo y pruebas; no es persistencia de producción.

| Ubicación                             | Responsabilidad                                                            |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `src/routes/`                         | Páginas, shell del documento y salud HTTP.                                 |
| `src/components/`                     | Navegación, multimedia y componentes administrativos.                      |
| `src/lib/volunteer-functions.ts`      | Frontera HTTP: validación y funciones del servidor de solicitudes/cuentas. |
| `src/lib/brevo-email.server.ts`         | Correo del servidor: confirmación y aviso interno al crear una solicitud; aviso al voluntario al pasar a `aceptada` o `descartada`. |
| `src/lib/volunteer-service.server.ts` | Acceso, roles, sesiones, límites, consultas y el disparo del aviso de estado.       |
| `src/lib/admin-totp*`                 | Inscripción, cifrado, validación y recuperación TOTP.                      |
| `src/lib/admin-operations*`           | Auditoría, política, cambio personal de contraseña y contenido de portada. |
| `src/lib/home-content*`               | Valores iniciales y lectura pública del contenido editorial.               |
| `src/lib/i18n/`                       | Catálogos, proveedor, traducción administrativa y SEO por idioma.          |
| `src/data/`                           | Contenido institucional fijo y catálogo multimedia.                        |
| `src/lib/db.ts`                       | Pool PostgreSQL/PGLite y normalización de resultados.                      |
| `migrations/*.sql`                    | Esquema versionado de la aplicación activa.                                |
| `server/middleware/`                  | Nonce CSP y cabeceras de seguridad de la aplicación.                        |
| `scripts/`                            | Migraciones, validación, navegador y utilidades de operación.              |
| `.github/workflows/`                  | Job `validate`, auditoría npm, revisión de dependencias, CodeQL y monitor de disponibilidad. |

## Autenticación activa

La autenticación del panel es propia: `volunteer-functions.ts` → `volunteer-service.server.ts`, cuentas `admin_users`, cookie `vne-admin-session` y módulos `admin-totp*`. Better Auth no es el sistema de autenticación del panel y no debe confundirse con este flujo. El despliegue activo se configura desde la raíz del repositorio; esta descripción no certifica si existieron o existen carpetas históricas fuera de ese ámbito. Para entregar el proyecto, usar [HANDOVER.md](HANDOVER.md).

## Flujos

Formulario → validación del servidor → Turnstile (`siteverify`, salvo el atajo de CI descrito abajo) con hostname de `TURNSTILE_EXPECTED_HOSTNAME` o de `SITE_URL` → control de origen/límites → inserción idempotente → si la solicitud se creó por primera vez, intento de confirmación al voluntario y aviso interno mediante Brevo → confirmación en pantalla. Un reintento con la misma clave no vuelve a enviar esos correos. Si Brevo no está configurado o falla, se conserva la solicitud y el formulario no se rechaza; el fallo solo se registra sin datos personales. `VERCEL_PROJECT_PRODUCTION_URL` puede completar el origen del sitemap, pero no el hostname de Turnstile.

Cambio de estado a `aceptada` o `descartada` → la fila y la auditoría ya están escritas → intento de correo solo al voluntario. `contactada`, el mismo estado, la papelera y la restauración no envían correo. Si Brevo falla, el estado no se revierte.

Login → límites → contraseña → segundo factor si está inscrito → sesión revocable → verificación de rol/política en cada operación. Los rechazos de credenciales/pruebas admitidos por los límites registran `login:failure` sin datos del intento. Si se exige 2FA y la cuenta no está inscrita, solo se permite gestionar la inscripción y cerrar sesión. Un código de recuperación aceptado registra `login:recovery-code`.

Editor de portada → autorización de propietario → validación de tres idiomas y revisión → escritura/auditoría → lectura pública al recargar inicio. Si la base está indisponible, la portada usa el contenido original y emite un evento genérico. El formulario y panel no confirman escrituras fallidas.

## Idiomas y SEO

`lang` admite `es`, `en` y `pt` en la query. Las canónicas y alternativas de cada idioma usan `?lang=es`, `?lang=en` y `?lang=pt`, para mantener una dirección inequívoca aunque cambie el idioma inicial. `x-default` apunta a la URL sin query. Sin query ni cookie se consulta el idioma inicial en `site_language` (editable por el propietario); si no es español se redirige a su URL explícita antes de renderizar. Ante fallo de lectura se usa español. El idioma explícito tiene prioridad sobre la preferencia guardada en una cookie de idioma y se conserva al navegar. El servidor renderiza el contenido y los metadatos del idioma solicitado. El selector actualiza la URL y una cookie de idioma (sin datos personales); la misma preferencia se lee en servidor y navegador para evitar diferencias de hidratación. Si se bloquean cookies, el enlace explícito sigue funcionando. No se traducen datos de usuarios.

El sitemap incluye las tres variantes y alternativas `hreflang`; necesita un origen de producción configurado. No se generan alternativas del panel privado. Las tarjetas sociales dependen de los metadatos y recursos públicos configurados en la aplicación.

## Datos

Las tablas centrales son `volunteer_requests`, `admin_users`, `admin_sessions`, `admin_events`, `request_limits`, `admin_totp_pending`, `admin_recovery_codes`, `admin_policy`, `site_content` y `site_language`. `_migrations` registra archivos aplicados. `volunteer_export_revision` protege la consistencia de los lotes CSV.

Las migraciones se aplican antes de publicar funciones del nuevo despliegue. No hay escrituras de archivos en tiempo de ejecución de producción. El contenido editable vive en Neon, no en un JSON generado durante el build.

## Pruebas

- Tipos y lint con `npm run check`.
- Pruebas de scripts, seguridad de peticiones, traducciones, CSV y consultas sobre PGLite.
- Servicios con PostgreSQL 17 en CI mediante `TEST_DATABASE_URL`, que solo permite una base local desechable y crea un esquema aleatorio por proceso.
- `.github/workflows/ci.yml` ejecuta el job `validate` en cada PR y push a `main`, usa Node.js 24 y `actions/checkout@v7` / `actions/setup-node@v7`, y prueba el navegador contra desarrollo y preview compilado. Con `TURNSTILE_TEST_MODE`, `CI` y `E2E_LOCAL_DATABASE`, el servidor no llama a `siteverify`.
- `src/lib/brevo-email.server.test.ts` simula la API de Brevo, incluidos los avisos de `aceptada` y `descartada`; no envía correos reales ni verifica la autenticación del dominio o la entrega del proveedor.
- Navegador sobre desarrollo y compilación: páginas/móvil, temas, idioma en SSR, formulario, cuentas, auditoría, portada, contraseñas, sesiones y TOTP. Las solicitudes de la aplicación no se simulan; recursos externos se excluyen de QA.

Los resultados deben consultarse en la ejecución del commit correspondiente. Un documento no sustituye logs de pruebas ni garantiza que producción use las mismas variables.
