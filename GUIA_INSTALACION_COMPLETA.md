# Instalación completa desde cero: GitHub, Neon, Turnstile, Brevo y Vercel

Esta guía permite preparar una instalación nueva de Prueba-724. Describe la aplicación activa en la raíz del repositorio; la versión histórica de Cloudflare no forma parte del despliegue. Para detalles operativos consulta [OPERATIONS.md](OPERATIONS.md), [SECURITY.md](SECURITY.md) y [BREVO_SETUP.md](BREVO_SETUP.md).

## 1. Qué necesitas antes de empezar

- Una cuenta GitHub con acceso a `SantosV06/Prueba-724` (o un fork autorizado).
- Una cuenta Vercel vinculada con ese repositorio.
- Una cuenta Neon para PostgreSQL.
- Una cuenta Cloudflare para Turnstile.
- Una cuenta Brevo si deseas enviar correos transaccionales.
- Un dominio/hostname que controles y un lugar seguro para guardar contraseñas, API keys y claves de cifrado.
- Para trabajar localmente: Git, Node.js **24.x** y npm **11.9.0**.

No necesitas editar el esquema a mano ni pegar SQL histórico. Las migraciones actuales están en `migrations/*.sql` y se aplican mediante el proceso de build.

## 2. Preparar el repositorio

1. Abre el repositorio en GitHub.
2. Si necesitas una instalación independiente, crea un **fork** en tu cuenta/organización; no copies solo una carpeta del proyecto.
3. En Vercel, selecciona **Add New → Project → Import Git Repository** y autoriza el acceso al fork o repositorio que administrarás.
4. Selecciona la rama `main`, configura **Root Directory** como la raíz (`./`) y utiliza Node.js 24.x.
5. Conserva el comando de instalación de `vercel.json`: `npm ci --include=dev --no-audit --no-fund`.
6. Usa `npm run build` como comando de build. No fuerces un despliegue estático con salida `dist`; Nitro prepara la salida de Vercel.

## 3. Crear PostgreSQL en Neon

1. En Neon, crea un proyecto PostgreSQL nuevo para esta instalación.
2. Conserva una rama/base dedicada a Production.
3. En **Connect**, copia la cadena de conexión **pooled** para esa base; el host suele incluir `-pooler` y terminar en `.neon.tech`.
4. Comprueba que la cadena utiliza SSL (`sslmode=require` o una verificación más estricta).
5. Guarda la cadena como secreto; contiene usuario/contraseña.
6. No ejecutes manualmente esquemas SQL históricos ni crees las tablas una por una.

Las migraciones del proyecto se aplican durante `npm run build`. Si la instalación ya contiene datos, no la apuntes a esa base hasta tener autorización y respaldo.

## 4. Crear las claves de seguridad del panel

Desde una terminal privada con Node.js 24, ejecuta dos veces:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Guarda el primer valor como `ADMIN_SESSION_SECRET` y el segundo como `ADMIN_TOTP_ENCRYPTION_KEY`. No los intercambies ni reutilices el mismo valor. La clave TOTP debe conservarse en un gestor seguro: cambiarla sin un procedimiento de recifrado puede impedir descifrar factores existentes.

Crea una contraseña inicial para `ADMIN_PASSWORD` de 14 a 256 caracteres. Esta contraseña solo permite crear la cuenta de propietario cuando aún no existen cuentas; cambiar la variable más tarde **no** cambia una cuenta existente.

## 5. Configurar Cloudflare Turnstile (necesario para el formulario)

1. En el panel de Cloudflare, crea un widget Turnstile.
2. Añade el hostname exacto de Production (y, si corresponde, uno separado para Preview).
3. Copia la **Site Key** y la **Secret Key** correspondientes.
4. Guarda la Site Key como `VITE_TURNSTILE_SITE_KEY` y la Secret Key como `TURNSTILE_SECRET_KEY` en Vercel.
5. La Site Key es pública y se incorpora al cliente durante el build; la Secret Key es privada y solo debe estar disponible en el servidor.
6. No uses las claves oficiales de prueba que aparecen en CI para el sitio público de producción.

Si la clave pública cambia, vuelve a compilar y desplegar. Si el formulario carga sin Turnstile o el servidor rechaza el token, revisa el hostname, que ambas claves pertenezcan al mismo widget y los logs de Vercel.

## 6. Configurar Brevo (necesario para enviar los correos)

Si no deseas correos automáticos, puedes omitir esta sección; la recepción y el guardado de solicitudes no dependen de que Brevo esté disponible. Si sí los necesitas:

1. En Brevo, autentica el dominio remitente y publica los registros SPF/DKIM que indique el proveedor. Revisa los registros existentes antes de modificar SPF y configura DMARC según la política del dominio.
2. Verifica la dirección que usarás como remitente.
3. Crea una API key para la **API** de Brevo (no la contraseña SMTP).
4. Guarda estos valores para Vercel: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `VOLUNTEER_NOTIFICATION_EMAIL` y, opcionalmente, `BREVO_SENDER_NAME`.
5. Usa un buzón interno que el equipo controle para `VOLUNTEER_NOTIFICATION_EMAIL`.

La aplicación intenta enviar una confirmación a la persona voluntaria y un aviso interno después de guardar una solicitud nueva. Un fallo de correo no invalida una solicitud guardada. El aviso interno omite el mensaje personal. No se envía correo al cambiar estados ni para recuperar contraseñas. Sigue [BREVO_SETUP.md](BREVO_SETUP.md) para validar el flujo y solucionar problemas.

## 7. Añadir variables de entorno en Vercel

En el proyecto de Vercel, abre **Settings → Environment Variables**. Añade cada variable con el nombre exacto y selecciona **Production**. No incluyas comillas alrededor de los valores.

| Variable | Requerida | Valor / origen | Tipo |
| --- | --- | --- | --- |
| `DATABASE_URL` | Sí | URL pooled de Neon de Production con SSL. | Secreto |
| `ADMIN_PASSWORD` | Sí para el primer acceso | Contraseña inicial robusta (14–256 caracteres). | Secreto |
| `ADMIN_SESSION_SECRET` | Sí | Secreto aleatorio de 32 bytes o más. | Secreto |
| `ADMIN_TOTP_ENCRYPTION_KEY` | Sí | 32 bytes aleatorios en Base64. | Secreto |
| `SITE_URL` | Recomendada | URL HTTPS canónica, sin ruta ni parámetros. | Pública |
| `VITE_TURNSTILE_SITE_KEY` | Sí para el formulario | Site Key pública del widget para el hostname correcto. | Pública |
| `TURNSTILE_SECRET_KEY` | Sí para el formulario | Secret Key del mismo widget. | Secreto |
| `BREVO_API_KEY` | Sí para correo | API key de Brevo. | Secreto |
| `BREVO_SENDER_EMAIL` | Sí para correo | Dirección autenticada en Brevo. | Configuración |
| `BREVO_SENDER_NAME` | Opcional | Nombre visible del remitente. | Pública |
| `VOLUNTEER_NOTIFICATION_EMAIL` | Sí para aviso interno | Buzón que recibe los avisos de solicitudes nuevas. | Configuración |
| `DATA_RETENTION_DAYS` | Opcional | Entero de 30 a 3650 si la organización aprobó el plazo. | Pública |

Para `SITE_URL`, utiliza por ejemplo `https://tu-proyecto.vercel.app` o el dominio personalizado que hayas configurado. No incluyas `/voluntariado`, una barra de ruta, query ni fragmento.

**Reglas para los secretos:**
- No uses `VITE_` en claves privadas. La única variable de esta tabla con prefijo `VITE_` es la Site Key pública de Turnstile.
- No guardes valores reales en `.env.example`, commits, Issues, capturas o chats.
- Mantén separadas las credenciales de Production, Preview y local.
- Si cambias una variable, crea un nuevo despliegue para que se aplique al código/cliente publicado.

## 8. Desplegar y comprobar migraciones

1. Guarda todas las variables de Production.
2. En Vercel, abre **Deployments** y ejecuta un nuevo despliegue de `main` (o **Redeploy** de un commit correcto).
3. Espera el estado **Ready** y revisa los logs si hay error.
4. Durante el build, el proyecto valida configuración y aplica las migraciones pendientes en Neon. No borres tablas para resolver un fallo.
5. Abre `https://TU-DOMINIO/api/health`. Debe devolver estado `ok` cuando el esquema está operativo; una respuesta 503 indica que debes revisar configuración y logs.

No se debe considerar funcional el formulario solo porque la portada cargue o `/api/health` responda. Turnstile, base de datos y la ruta de envío también deben verificarse.

## 9. Primera sesión administrativa

1. Abre `https://TU-DOMINIO/solicitudes`.
2. Inicia sesión con usuario `admin` y la contraseña inicial de `ADMIN_PASSWORD`.
3. El primer inicio válido crea la cuenta de propietario si no existen cuentas todavía.
4. En **Seguridad de mi cuenta → 2FA**, registra una aplicación de autenticación y confirma un código.
5. Guarda los códigos de recuperación en un lugar seguro, fuera del teléfono. Se muestran una sola vez.
6. Inicia sesión de nuevo para confirmar que la contraseña y el factor funcionan.
7. Crea cuentas individuales para el equipo. Activa la política obligatoria de 2FA solo después de preparar la cuenta del propietario y coordinar la inscripción de administradores.

Cambiar `ADMIN_PASSWORD` en Vercel no restablece la contraseña de una cuenta existente. Para recuperación consulta [OPERATIONS.md](OPERATIONS.md).

## 10. Prueba de aceptación del formulario y del correo

Haz una prueba controlada con un correo que controles y datos ficticios marcados como prueba:

1. Abre `/voluntariado` en Production y confirma que Turnstile se muestra y permite enviar.
2. Completa el formulario y envía una solicitud una sola vez.
3. Comprueba que aparece el mensaje de éxito y que la solicitud se guarda una sola vez en `/solicitudes`.
4. Confirma que llegó la confirmación al correo introducido.
5. Confirma por separado que llegó el aviso a `VOLUNTEER_NOTIFICATION_EMAIL`.
6. Comprueba que el aviso interno no contiene el mensaje personal y que el enlace al panel es correcto.
7. Si un mensaje no llega, revisa Spam/Promociones, configuración del remitente y logs de Vercel/Brevo sin publicar datos privados.
8. Elimina la solicitud de prueba de forma controlada cuando hayas terminado, conforme a la política de la organización.

Una prueba real reportada por el responsable confirmó que se recibió al menos un correo en Production. No debe afirmarse que ambos mensajes, la idempotencia o los fallos del proveedor quedaron validados a menos que se comprueben por separado. No uses el formulario público para probar reintentos con la misma clave: cada envío normal puede generar una clave nueva.

## 11. Preview y desarrollo local

### Preview

- Crea una rama/base de Neon separada de Production.
- Usa claves, contraseñas y destinatarios de prueba propios.
- Solo después de verificar manualmente el aislamiento, configura `PREVIEW_DATABASE_ISOLATED=true` en el entorno Preview.
- Configura las claves Turnstile para el hostname de Preview si vas a probar el widget allí.
- No habilites envíos reales de Brevo en Preview salvo que hayas autorizado expresamente una prueba y controlado los destinatarios.

`PREVIEW_DATABASE_ISOLATED=true` no comprueba que la base sea distinta; esa verificación corresponde al operador. Nunca uses la URL de Production en Preview.

### Local

```bash
git clone https://github.com/SantosV06/Prueba-724.git
cd Prueba-724
npm ci --include=dev
Copy-Item .env.example .env.local   # PowerShell
# En Bash/macOS/Linux: cp .env.example .env.local
```

Completa `.env.local` con credenciales locales de prueba. No reutilices secretos de Production. Para arrancar con el archivo:

```bash
node --env-file=.env.local --run dev
```

Sin `DATABASE_URL`, el desarrollo utiliza PGLite en memoria; los datos se pierden al reiniciar. Los scripts operativos no cargan `.env.local` automáticamente, así que usa `node --env-file=.env.local --run db:verify` o `node --env-file=.env.local --run db:migrate` solo después de confirmar la base destino. Nunca ejecutes E2E de escritura contra Production.

## 12. Actualizaciones y recuperación

- Los cambios en `main` pueden activar un despliegue automático según la integración GitHub/Vercel.
- Los cambios de variables requieren un nuevo despliegue.
- `npm run admin:recover -- admin` recupera el propietario desde una terminal privada; con pérdida del segundo factor, consulta el procedimiento `npm run admin:recover -- admin --reset-2fa` en [OPERATIONS.md](OPERATIONS.md).
- `npm run data:retention` solo informa; `npm run data:retention -- --apply` aplica el borrado aprobado. No hay borrado automático por cron.
- Zelle es una página de instrucciones: la aplicación no procesa, confirma ni concilia pagos.

Antes de entregar la instalación, documenta quién controla GitHub, Vercel, Neon, Cloudflare y Brevo; quién custodia los secretos; cómo se respaldan los datos; y qué pruebas se ejecutaron realmente.
