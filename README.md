# Fundación VNE · Prueba-724

Sitio institucional de Fundación Venezuela Nueva Esperanza y aplicación privada de gestión de voluntariado. Despliegue: **Vercel**. Datos persistentes: **Neon PostgreSQL**. Stack: React, TanStack Start/Router, TypeScript, Vite, Nitro y Tailwind CSS.

## Funciones actuales

- Páginas institucionales, programas, contacto, instrucciones para donar por Zelle y documentos públicos.
- Español, English y Português, idioma inicial configurable desde las herramientas del propietario, tema claro/oscuro y navegación móvil accesible.
- Enlaces por idioma: `/casas?lang=es`, `/casas?lang=en` y `/casas?lang=pt`. El HTML y los metadatos se traducen en el servidor; las canónicas y alternativas `hreflang` usan el dominio configurado.
- Formulario de voluntariado con validación en servidor mediante Cloudflare Turnstile, protección contra reintentos duplicados, campo trampa y límites por conexión/correo. El token se verifica antes de guardar en Neon y nunca se persiste.
- Panel `/solicitudes`: búsqueda, estados, paginación, CSV por lotes, papelera, restauración y borrado definitivo de solicitudes en papelera.
- Cuentas individuales, propietario/administradores, restablecimiento por el propietario y cambio de contraseña personal. Los cambios revocan las sesiones de esa cuenta.
- TOTP con QR generado localmente, secretos cifrados y códigos de recuperación de un solo uso. El propietario puede exigirlo al equipo tras activarlo en su propia cuenta.
- Herramientas del propietario: cobertura de 2FA, visor de auditoría y editor del título e introducción de portada en los tres idiomas. No es un CMS completo.
- Diagnóstico genérico `/api/health`, comprobación horaria desde GitHub Actions y utilidades privadas de verificación de la base y retención.

**Correos automáticos pendientes de definir con el propietario.** No hay proveedor de correo, SMTP, recuperación por email ni envíos. Zelle es una página de instrucciones: el sitio no procesa, confirma ni concilia pagos.

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

## Cloudflare Turnstile

El formulario de `/voluntariado` requiere un widget de Turnstile y el servidor valida el token con `siteverify` antes de escribir en Neon. Para producción:

1. En Cloudflare Turnstile crea un widget de tipo adecuado para el formulario.
2. Añade `prueba-724.vercel.app` a **Allowed Hostnames** para el despliegue de esta versión en Vercel. El dominio `foundation.vne` apunta a la versión histórica alojada en Cloudflare, no a esta aplicación; no lo añadas al widget de Prueba-724 solo por ser el dominio institucional. Añádelo únicamente si decides servir también esta versión de Vercel bajo ese hostname. Los hostnames se registran sin `https://` ni rutas.
3. En Vercel → Project → Settings → Environment Variables, añade `VITE_TURNSTILE_SITE_KEY` con la **Site Key** pública y `TURNSTILE_SECRET_KEY` con la **Secret Key** privada, ambas para **Production**. Mantén la secreta como Secret y no uses el prefijo `VITE_` para ella.
4. Guarda los cambios y despliega de nuevo para que la clave pública esté disponible en la compilación y el servidor reciba la secreta.
5. Comprueba `/voluntariado` en el dominio real y envía una solicitud de prueba controlada. No uses claves de prueba de CI en producción.

La CSP de `vercel.json` permite `https://challenges.cloudflare.com` en `script-src`, `frame-src` y `connect-src`; no desactives la CSP para solucionar errores del widget.

> **Registro de batalla:** React decía «no», Cloudflare pedía pruebas, la CSP cerraba la puerta y GitHub Actions no perdonaba. Todo para guardar un formulario. En Prueba-724 hasta el captcha necesita pasar CI antes de dejarte trabajar. 😂

## Guías vigentes

- [Instalación completa desde cero](GUIA_INSTALACION_COMPLETA.md): clonación, Vercel, Neon y autenticación.
- [Entrega a otra empresa](HANDOVER.md): instalación independiente, transferencia y criterios de aceptación.
- [Configuración y despliegue](SETUP_DATABASE.md): variables, Neon, Vercel y primer acceso.
- [Operación y recuperación](OPERATIONS.md): panel, alertas, respaldos, restauración y conservación.
- [Seguridad](SECURITY.md): controles, límites y comunicación privada de incidencias.
- [Arquitectura](ARCHITECTURE.md): rutas, servicios, datos y pruebas.
- [Multimedia](MULTIMEDIA.md): originales, derivados y reproducción.
- [Instrucciones de mantenimiento](AGENTS.md): contratos que debe preservar quien modifique el código.

`foundation-vne/` es la versión histórica de Cloudflare y no se despliega. `.project-tools/` conserva herramientas y plantillas heredadas del generador; no describe el entorno actual ni sustituye estas guías.

## Validación y límites

GitHub Actions valida cada PR y cambio en `main`: pruebas con PGLite, servicios sobre PostgreSQL 17 desechable, compilación y navegador en desarrollo/compilación. CI usa exclusivamente las claves oficiales de prueba de Turnstile; nunca las uses en producción. Las pruebas de navegador interceptan el SDK de Cloudflare para no depender del servicio real. En producción, configura el widget de Turnstile de esta aplicación para `prueba-724.vercel.app` y define `VITE_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en Vercel. `foundation.vne` sigue apuntando a la versión histórica de Cloudflare y debe conservar su configuración independiente. La clave `VITE_` es pública; la clave secreta es exclusivamente del servidor.

Una validación verde no acredita configuración de producción, accesibilidad completa, carga máxima ni restauración de Neon. La ejecución de producción y la custodia de secretos deben comprobarse por separado. El repositorio no incluye una licencia de redistribución; las condiciones de uso de contenido y marcas corresponden a sus titulares.
