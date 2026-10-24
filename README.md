# Fundación VNE · Prueba-724

Sitio institucional de Fundación Venezuela Nueva Esperanza y aplicación privada de gestión de voluntariado. Despliegue: **Vercel**. Datos persistentes: **Neon PostgreSQL**. Stack: React, TanStack Start/Router, TypeScript, Vite, Nitro y Tailwind CSS.

## Estado del repositorio y código activo

La aplicación desplegable está en la raíz (`src/`, `server/`, `migrations/` y la configuración de Vercel). La versión histórica de Cloudflare queda fuera del despliegue actual. El código de Better Auth, los conectores de sandbox y P2P no forman parte del flujo de autenticación del panel; el acceso real utiliza `volunteer-service.server.ts` y los módulos `admin-*`.

## Funciones actuales

- Páginas institucionales, programas, contacto, instrucciones para donar por Zelle y documentos públicos.
- Español, English y Português, idioma inicial configurable desde las herramientas del propietario, tema claro/oscuro y navegación móvil accesible.
- Enlaces por idioma: `/casas?lang=es`, `/casas?lang=en` y `/casas?lang=pt`. El HTML y los metadatos se traducen en el servidor; las canónicas y alternativas `hreflang` usan el dominio configurado.
- Formulario de voluntariado con validación del servidor, protección contra reintentos duplicados, campo trampa y límites por conexión/correo.
- Panel `/solicitudes`: búsqueda, estados, paginación, CSV por lotes, papelera, restauración y borrado definitivo de solicitudes en papelera.
- Cuentas individuales, propietario/administradores, restablecimiento por el propietario y cambio de contraseña personal. Los cambios revocan las sesiones de esa cuenta.
- TOTP con QR generado localmente, secretos cifrados y códigos de recuperación de un solo uso. El propietario puede exigirlo al equipo tras activarlo en su propia cuenta.
- Herramientas del propietario: cobertura de 2FA, visor de auditoría y editor del título e introducción de portada en los tres idiomas. No es un CMS completo.
- Diagnóstico genérico `/api/health`, comprobación horaria desde GitHub Actions y utilidades privadas de verificación de la base y retención.

**Formulario y correos transaccionales.** El formulario requiere Cloudflare Turnstile (`VITE_TURNSTILE_SITE_KEY` pública y `TURNSTILE_SECRET_KEY` privada). La integración Brevo está incorporada en `main`: cuando se crea una solicitud nueva y están configuradas las variables de Brevo, intenta enviar una confirmación al voluntario y un aviso interno. Si falta configuración o el proveedor falla, la solicitud guardada sigue siendo válida. Sigue [GUIA_INSTALACION_COMPLETA.md](GUIA_INSTALACION_COMPLETA.md) para desplegar desde cero y [BREVO_SETUP.md](BREVO_SETUP.md) para configurar las variables, autenticar el remitente y probar el envío real. El responsable informó que recibió al menos un correo en una prueba de Production; esto no demuestra que ambos mensajes o la idempotencia estén verificados. Estos correos no son recuperación de contraseña ni cambian el estado de la solicitud. Zelle sigue siendo una página de instrucciones: el sitio no procesa, confirma ni concilia pagos.

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
- [Entrega a otra empresa](HANDOVER.md): instalación independiente, transferencia y criterios de aceptación.
- [Configuración y despliegue](SETUP_DATABASE.md): variables, Neon, Vercel y primer acceso.
- [Operación y recuperación](OPERATIONS.md): panel, alertas, respaldos, restauración y conservación.
- [Seguridad](SECURITY.md): controles, límites y comunicación privada de incidencias.
- [Configuración de Brevo](BREVO_SETUP.md): variables privadas, autenticación del dominio y pruebas en Preview.
- [Arquitectura](ARCHITECTURE.md): rutas, servicios, datos y pruebas.
- [Multimedia](MULTIMEDIA.md): originales, derivados y reproducción.

La versión activa se despliega desde la raíz en Vercel. Los archivos históricos o de herramientas del generador no forman parte del contrato de despliegue.

## Validación y límites

GitHub Actions valida cada PR y cambio en `main` mediante `.github/workflows/ci.yml`: Node.js 24, instalación reproducible con `npm ci`, pruebas contra PostgreSQL 17 desechable, compilación y pruebas de navegador contra desarrollo y la compilación de preview. El workflow usa `actions/checkout@v7` y `actions/setup-node@v7`; `.github/workflows/availability.yml` es un monitor horario independiente, no un requisito de CI. Las credenciales de CI son ficticias y exclusivas de pruebas. Las pruebas de Brevo simulan la API y nunca demuestran entrega real. Los mapas y scripts externos se sustituyen en QA; el formulario y el backend sí se ejecutan.

Una validación verde no acredita configuración de producción, accesibilidad completa, carga máxima ni restauración de Neon. La ejecución de producción y la custodia de secretos deben comprobarse por separado. El repositorio no incluye una licencia de redistribución; las condiciones de uso de contenido y marcas corresponden a sus titulares.
