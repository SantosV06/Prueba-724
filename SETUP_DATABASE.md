# Configuración · Vercel y Neon

Esta es la guía del despliegue actual. No utilices el esquema D1 de `foundation-vne/` en Neon. No se configuran tablas a mano: `migrations/*.sql` es la fuente del esquema.

## 1. Vercel

Importa `SantosV06/Prueba-724`, rama `main`, Root Directory en la raíz. Usa Node **24.x**. `vercel.json` instala también las herramientas de validación con `npm ci --include=dev --no-audit --no-fund`. El comando de compilación es `npm run build`; Nitro genera `.vercel/output` con el preset de Vercel. No selecciones `foundation-vne` ni fuerces una salida estática `dist`.

## 2. Variables de Production

| Variable                    | Configuración                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`              | Conexión privada de Neon PostgreSQL, endpoint agrupado `-pooler` y `sslmode=require` o verificación SSL más estricta.                                                                                           |
| `ADMIN_PASSWORD`            | Contraseña inicial de 14–256 caracteres. Solo crea el propietario cuando todavía no existe ninguna cuenta. No funciona como acceso alternativo después.                                                         |
| `ADMIN_SESSION_SECRET`      | Secreto aleatorio de al menos 32 caracteres. Rotarlo invalida todas las sesiones.                                                                                                                               |
| `ADMIN_TOTP_ENCRYPTION_KEY` | Clave aleatoria de 32 bytes en Base64. Necesaria para configurar y verificar autenticadores. No es el secreto de sesión.                                                                                        |
| `SITE_URL`                  | Origen HTTPS de producción, sin ruta ni parámetros. Ejemplo: `https://prueba-724.vercel.app`. Se usa para canónicas, alternativas y sitemap. Sin esta variable se intenta usar `VERCEL_PROJECT_PRODUCTION_URL`. |
| `VITE_TURNSTILE_SITE_KEY`  | Clave pública/site key de Cloudflare Turnstile para el hostname de Production. Necesaria para renderizar el widget; se incorpora durante el build. |
| `TURNSTILE_SECRET_KEY`     | Clave secreta del mismo widget Turnstile. Necesaria para validar el token en el servidor; nunca usar prefijo `VITE_`. |
| `BREVO_API_KEY`            | API key privada de Brevo. Necesaria para enviar correo transaccional. |
| `BREVO_SENDER_EMAIL`       | Remitente autenticado/verificado en Brevo. |
| `BREVO_SENDER_NAME`        | Opcional: nombre visible del remitente. |
| `VOLUNTEER_NOTIFICATION_EMAIL` | Buzón interno que recibe avisos de nuevas solicitudes. |
| `DATA_RETENTION_DAYS`       | Opcional: entero de 30–3650 días. La organización debe aprobar el plazo. Configurarlo no activa borrados ni un cron.                                                                                            |

Las cadenas de conexión, contraseñas, secretos de sesión/cifrado, `TURNSTILE_SECRET_KEY` y `BREVO_API_KEY` deben configurarse como secretos del servidor. No uses el prefijo `VITE_` para claves privadas ni las escribas en el código o las compartas por chat. `VITE_TURNSTILE_SITE_KEY` es pública y se incluye durante el build; `SITE_URL` y el plazo no son secretos. Después de cambiar variables, realiza un nuevo despliegue.

Genera claves desde una terminal privada con Node instalado:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Ejecuta el comando por separado para cada secreto. Guarda una copia segura de la clave de cifrado TOTP: perderla impide descifrar los factores existentes. Su rotación requiere un proceso de recifrado o recuperación controlada; no basta con sustituirla.

## 3. Neon y migraciones

Crea o utiliza la base asociada al proyecto. Copia su conexión **pooled** con SSL a `DATABASE_URL` de Production. El despliegue rechaza también una `ADMIN_TOTP_ENCRYPTION_KEY` ausente, de tamaño incorrecto o Base64 no canónico, sin imprimirla. Valida la configuración y aplica pendientes con `pg_advisory_xact_lock` dentro de una transacción. `_migrations` registra las versiones aplicadas.

| Migración | Finalidad                                                                       |
| --------- | ------------------------------------------------------------------------------- |
| `0001`    | Solicitudes y límites de peticiones.                                            |
| `0002`    | Estados, papelera, sesiones y auditoría.                                        |
| `0003`    | Cuentas individuales y roles; invalida una vez las sesiones del modelo antiguo. |
| `0004`    | Revisión de datos para exportaciones consistentes.                              |
| `0005`    | TOTP, configuración pendiente y códigos de recuperación.                        |
| `0006`    | Versiones de seguridad y revocación de sesiones mediante triggers.              |
| `0007`    | Política de 2FA, índices de auditoría y contenido editable de portada.          |
| `0008`    | Idioma predeterminado del sitio y revisión para evitar ediciones simultáneas.   |

`0007` es aditiva: conserva solicitudes y credenciales y deja 2FA obligatorio desactivado. No edites migraciones aplicadas. Los cambios futuros necesitan un archivo nuevo y compatibilidad con las funciones todavía activas durante el despliegue.

## 4. Primer acceso y equipo

1. Espera a que el despliegue de `main` esté Ready.
2. Abre `/solicitudes`, usuario `admin`, contraseña inicial `ADMIN_PASSWORD`.
3. El primer acceso correcto crea el propietario. Después administra las cuentas desde **Administrar usuarios**.
4. Abre **Seguridad de mi cuenta · 2FA**, introduce tu contraseña y configura el autenticador mediante QR o clave manual.
5. Confirma con un código de seis dígitos. Guarda los diez códigos de recuperación fuera del teléfono. Se muestran una sola vez; todas tus sesiones se cierran.
6. Inicia sesión de nuevo. El código usado para activar 2FA ya está consumido: espera al siguiente o utiliza un código de recuperación.
7. En **Herramientas del propietario → Seguridad del equipo** puedes exigir 2FA confirmando tu contraseña. Las cuentas sin factor podrán iniciar una sesión limitada para configurarlo, pero el servidor les negará solicitudes, exportaciones y otras funciones administrativas.

El propietario puede crear administradores, restablecer contraseñas y desactivar cuentas. Cada persona puede cambiar su propia contraseña con la actual. Los cambios de contraseña no retiran 2FA. La interfaz no permite al propietario consultar contraseñas, secretos ni códigos de recuperación ajenos.

## 5. Preview y desarrollo

En Preview utiliza una rama Neon independiente y secretos distintos. Solo después configura `PREVIEW_DATABASE_ISOLATED=true` en ese entorno. Sin esta confirmación el formulario, el panel y las migraciones quedan bloqueados en Preview.

Esta variable no compara automáticamente conexiones: el operador debe confirmar que la base realmente está aislada. No la habilites con la conexión de producción. Los robots de Preview reciben `Disallow: /`.

En desarrollo, sin conexión externa, se usa PGLite en memoria. En una compilación local que necesite probar el backend con esa base se permite `E2E_LOCAL_DATABASE=true` únicamente fuera de Vercel. No configures esa excepción en producción.

## 6. Comprobación posterior

- Visita las páginas públicas y `/api/health`; la salud responde `{"status":"ok"}` o HTTP 503 con un mensaje genérico.
- Comprueba idiomas con `?lang=en` y `?lang=pt`, canónicas, `hreflang`, sitemap y el login privado.
- Si se ha restaurado una base, ejecuta `npm run db:verify` con conexión y clave TOTP privadas del entorno correcto. Este comando no escribe datos ni imprime credenciales.
- Verifica formulario y administración con datos de prueba identificados y elimina esos datos de forma controlada al terminar.
- Sigue [OPERATIONS.md](OPERATIONS.md) para alertas, restauración, recuperación y retención.

El correo transaccional está implementado mediante Brevo, pero solo intenta enviar mensajes en entornos con la configuración necesaria. No es parte de la configuración obligatoria de la base de datos. Antes de habilitarlo, sigue [BREVO_SETUP.md](BREVO_SETUP.md), configura los secretos del servidor y completa una prueba de aceptación con destinatarios controlados. No copies API keys a `VITE_` ni al repositorio.

## 7. Validar el formulario y los correos en Production

El formulario requiere las dos claves de Cloudflare Turnstile: `VITE_TURNSTILE_SITE_KEY` (pública, disponible durante el build) y `TURNSTILE_SECRET_KEY` (secreta, solo servidor). Para correo transaccional también se necesitan `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `VOLUNTEER_NOTIFICATION_EMAIL`; `BREVO_SENDER_NAME` es opcional. Sigue [BREVO_SETUP.md](BREVO_SETUP.md) para obtener y validar estas claves.

Después de configurar variables en **Settings → Environment Variables**, selecciona el ámbito **Production** y ejecuta un nuevo despliegue. Prueba con datos ficticios y un correo que controles:

1. Confirma que Turnstile carga y permite enviar el formulario.
2. Envía una solicitud una sola vez y verifica que se guarda en `/solicitudes`.
3. Comprueba por separado la confirmación al correo del formulario y el aviso al buzón interno.
4. Revisa logs de Vercel sin exponer datos personales o secretos.
5. Elimina la solicitud de prueba de forma controlada cuando termine la comprobación.

El responsable del proyecto informó de una prueba real en Production en la que recibió al menos un correo. Eso no acredita por sí solo que ambos destinatarios, los reintentos o los errores del proveedor hayan sido probados. Para una guía completa de instalación desde cero, consulta [GUIA_INSTALACION_COMPLETA.md](GUIA_INSTALACION_COMPLETA.md).
