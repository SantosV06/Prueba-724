# Fundación VNE · Prueba-724

Sitio institucional de Fundación Venezuela Nueva Esperanza y aplicación privada de gestión de voluntariado. Despliegue: **Vercel**. Datos persistentes: **Neon PostgreSQL**. Stack: React, TanStack Start/Router, TypeScript, Vite, Nitro y Tailwind CSS.

## Estado del repositorio y código activo

La aplicación desplegable está configurada desde la raíz del repositorio (`src/`, `server/`, `migrations/` y configuración de Vercel). Esta descripción define el ámbito de despliegue; por sí sola no afirma que una carpeta histórica siga existiendo en el árbol actual. La autenticación del panel utiliza el servicio propio `volunteer-service.server.ts` y los módulos `admin-*`; no depende de Better Auth ni de conectores de sandbox o P2P.

## Funciones actuales

- Páginas públicas: inicio, Casas VNE, Proyecto Génesis, liderazgo, soporte, donaciones (instrucciones Zelle; el sitio no cobra), voluntariado y documentos en `/legal/privacidad`, `/legal/terminos`, `/legal/conflicto` y `/legal/no-discriminacion`.
- Español, English y Português, idioma inicial configurable desde las herramientas del propietario, tema claro/oscuro y navegación móvil accesible.
- Enlaces por idioma: `/casas?lang=es`, `/casas?lang=en` y `/casas?lang=pt`. El HTML y los metadatos se traducen en el servidor; las canónicas y alternativas `hreflang` usan el dominio configurado.
- Formulario de voluntariado con validación del servidor, protección contra reintentos duplicados, campo trampa y límites por conexión/correo.
- Panel `/solicitudes`: búsqueda, estados, paginación, CSV por lotes, papelera, restauración y borrado definitivo de solicitudes en papelera.
- Cuentas individuales, propietario/administradores, restablecimiento por el propietario y cambio de contraseña personal. Los cambios revocan las sesiones de esa cuenta.
- TOTP con QR generado localmente, secretos cifrados y códigos de recuperación de un solo uso. El propietario puede exigirlo al equipo tras activarlo en su propia cuenta.
- Herramientas del propietario: cobertura de 2FA, visor de auditoría y editor del título e introducción de portada en los tres idiomas. No es un CMS completo.
- Diagnóstico genérico `/api/health`, comprobación horaria desde GitHub Actions y utilidades privadas de verificación de la base y retención.

**Formulario y correos transaccionales.** El formulario exige Cloudflare Turnstile: `VITE_TURNSTILE_SITE_KEY` (pública, incluida en el build) y `TURNSTILE_SECRET_KEY` (solo servidor). También hace falta un hostname esperado, tomado de `TURNSTILE_EXPECTED_HOSTNAME` o, si falta, del hostname de `SITE_URL`. `VERCEL_PROJECT_PRODUCTION_URL` sirve como respaldo del sitemap y las canónicas, pero no sustituye esa comprobación de Turnstile. La integración Brevo está en `main`. Al crear una solicitud nueva, si existen `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `VOLUNTEER_NOTIFICATION_EMAIL`, intenta enviar la confirmación al voluntario y un aviso interno sin el mensaje personal. Al guardar un cambio real de estado a `aceptada` o `descartada`, intenta avisar solo al voluntario con `BREVO_API_KEY` y `BREVO_SENDER_EMAIL`; no lo hace para `contactada`, si el estado no cambia, ni al usar la papelera. Si falta configuración o el proveedor falla, la solicitud o el cambio de estado ya guardados siguen siendo válidos. Estos correos no recuperan contraseñas ni modifican el estado por sí mismos. Sigue [GUIA_INSTALACION_COMPLETA.md](GUIA_INSTALACION_COMPLETA.md) para desplegar desde cero y [BREVO_SETUP.md](BREVO_SETUP.md) para autenticar el remitente y probar el envío real. En una prueba real de Production, el responsable confirmó que la solicitud se guardó y llegó al menos un correo. Eso valida ese recorrido concreto; no demuestra ambos mensajes de alta, el aviso de estado, la idempotencia ni los fallos del proveedor. Zelle sigue siendo una página de instrucciones: el sitio no procesa, confirma ni concilia pagos.

## Empezar

Requiere Node **24.x** y npm **11.9.0**. Ejecuta `npm ci --include=dev` y `npm run dev`. Sin `DATABASE_URL`, desarrollo utiliza PGLite en memoria; sus datos se pierden al reiniciar. Usa únicamente credenciales ficticias en desarrollo y pruebas.

Para cargar un archivo privado local, copia `.env.example` a `.env.local`, completa credenciales ficticias y ejecuta `node --env-file=.env.local --run dev`. Los scripts de operación requieren cargar ese archivo explícitamente; Vercel usa sus propias variables.

Para formulario y panel local, proporciona `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` mediante variables del proceso. Para probar TOTP añade una clave local `ADMIN_TOTP_ENCRYPTION_KEY`. No subas archivos de secretos a Git.

## Comandos

| Comando                                      | Función                                                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                              | Tipos, lint y pruebas de scripts, validación y servicios con base desechable.                                                                  |
| `npm run build`                              | Comprobaciones, compilación de Vercel y migraciones según el entorno.                                                                          |
| `npm run test:e2e`                           | Chromium: páginas, idiomas, formulario, panel, usuarios, editor, auditoría, contraseñas y 2FA. Requiere servidor local y contraseña de prueba. |
| `npm run test:postgres`                      | Servicios contra PostgreSQL local desechable si se proporciona `TEST_DATABASE_URL`. Nunca admite una URL remota.                               |
| `npm run db:migrate`                         | Aplica migraciones pendientes con transacción y bloqueo.                                                                                       |
| `npm run db:verify`                          | Verificación privada de solo lectura de migraciones, recuentos y secretos TOTP después de restaurar.                                           |
| `npm run data:retention`                     | Cuenta solicitudes en papelera que superan `DATA_RETENTION_DAYS`. No borra.                                                                    |
| `npm run data:retention -- --apply`          | Borra únicamente esa papelera antigua y registra el resultado atómicamente.                                                                    |
| `npm run admin:recover -- admin`             | Recuperación privada del propietario con acceso directo a Neon. Conserva 2FA.                                                                  |
| `npm run admin:recover -- admin --reset-2fa` | Recuperación de emergencia: nueva contraseña, retirada del factor y revocación de sesiones.                                                    |

## Guías vigentes

- [Instalación completa desde cero](GUIA_INSTALACION_COMPLETA.md): GitHub, Vercel, Neon, Turnstile, Brevo y prueba del formulario.
- Guías en inglés: [README](README.en.md), [installation from scratch](INSTALLATION_GUIDE.en.md) y [Brevo setup](BREVO_SETUP.en.md).
- [Entrega a otra empresa](HANDOVER.md): instalación independiente, transferencia y criterios de aceptación.
- [Configuración y despliegue](SETUP_DATABASE.md): variables, Neon, Vercel y primer acceso.
- [Operación y recuperación](OPERATIONS.md): panel, alertas, respaldos, restauración y conservación.
- [Seguridad](SECURITY.md): controles, límites y comunicación privada de incidencias.
- [Configuración de Brevo](BREVO_SETUP.md): variables privadas, autenticación del dominio y pruebas en Preview.
- [Arquitectura](ARCHITECTURE.md): rutas, servicios, datos y pruebas.
- [Informe de auditoría del repositorio (26-10-2026)](docs/REPOSITORY_AUDIT_2026-10-26.md): errores documentales confirmados, riesgos operativos y verificaciones pendientes. La revisión es estática y no sustituye CI ni pruebas dinámicas.
- [Multimedia](MULTIMEDIA.md): originales, derivados y reproducción.

La versión activa se despliega desde la raíz en Vercel. La configuración de despliegue y el árbol actual de Git son las fuentes para determinar qué archivos existen y qué se publica; no se debe inferir la presencia de directorios históricos a partir de menciones en documentación.

## Validación y límites

`.github/workflows/ci.yml` valida cada pull request y cada push a `main` (job `validate`): Node.js 24, `npm ci`, pruebas contra PostgreSQL 17 desechable, compilación y navegador contra desarrollo y la preview compilada. Usa `actions/checkout@v7` y `actions/setup-node@v7`. En ese job, `TURNSTILE_TEST_MODE` junto con `CI` y `E2E_LOCAL_DATABASE` no llama a `siteverify`: acepta un token de prueba. El SDK del widget, los mapas y la analítica externa se sustituyen; el formulario y el resto del backend sí se ejecutan. Las pruebas de Brevo simulan la API y no demuestran entrega real. Las credenciales de CI son ficticias.

Otros workflows, distintos del check `validate`: `.github/workflows/availability.yml` (cada hora y manual; por defecto `https://prueba-724.vercel.app`, o `MONITOR_SITE_URL`), `.github/workflows/security-audit.yml` (`npm audit --audit-level=high` en PR, `main` y los lunes), `.github/workflows/dependency-review.yml` (solo PR, severidad alta) y `.github/workflows/codeql.yml` (Actions, JavaScript/TypeScript y Python, en PR, `main` y los sábados). `.github/dependabot.yml` abre pull requests semanales de npm y Actions. Ninguno acredita la configuración de producción.

Una validación verde no acredita configuración de producción, accesibilidad completa, carga máxima ni restauración de Neon. La ejecución de producción y la custodia de secretos deben comprobarse por separado. El repositorio no incluye una licencia de redistribución; las condiciones de uso de contenido y marcas corresponden a sus titulares.
