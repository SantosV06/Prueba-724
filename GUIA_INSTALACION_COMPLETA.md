# Instalación completa de Prueba-724 (GitHub + Vercel + Neon)

Esta guía complementa [SETUP_DATABASE.md](SETUP_DATABASE.md), [OPERATIONS.md](OPERATIONS.md) y [SECURITY.md). Sigue el código actual del proyecto, no la versión histórica `foundation-vne/`.

## 1. Requisitos

- Acceso al repositorio GitHub `SantosV06/Prueba-724`.
- Cuenta Vercel vinculada con GitHub y cuenta Neon PostgreSQL.
- Para desarrollo local: Node.js **24.x**, npm **11.9.0** y Git.
- Custodia segura de contraseñas y secretos. Nunca pegarlos en Issues, commits, capturas ni chats.

## 2. Crear la base de datos en Neon

1. Entra a Neon y crea un proyecto PostgreSQL (o selecciona el existente).
2. Selecciona la rama de producción y su base de datos.
3. En **Connect**, copia la cadena PostgreSQL **pooled** (el host debe contener `-pooler` y terminar en `.neon.tech`).
4. Confirma que la URL contiene `sslmode=require` (o `verify-ca` / `verify-full`). La URL contiene credenciales: trátala como secreto.
5. **No pegues manualmente** el SQL histórico de `foundation-vne/schema.sql`. Las tablas actuales se crean mediante `migrations/*.sql`.

## 3. Importar el repositorio en Vercel

1. En Vercel, **Add New → Project → Import Git Repository**.
2. Autoriza GitHub si se solicita y elige tu copia autorizada de `Prueba-724` (o `SantosV06/Prueba-724` si mantienes el proyecto original).
3. Usa la rama `main` y **Root Directory: `./`** (raíz).
4. Configura **Node.js 24.x** en Project Settings.
5. Mantén el comando de instalación definido en `vercel.json`: `npm ci --include=dev --no-audit --no-fund`.
6. Usa el comando de compilación `npm run build`. No configures `dist` como salida estática: Nitro genera la salida para Vercel.

## 4. Variables de entorno en Vercel

En **Project → Settings → Environment Variables**, configura para **Production**:

| Nombre                      | Valor                                                           | ¿Secreto? |
| --------------------------- | --------------------------------------------------------------- | --------- |
| `DATABASE_URL`              | Cadena pooled de Neon con SSL                                   | Sí        |
| `ADMIN_PASSWORD`            | Contraseña inicial robusta de 14 a 256 caracteres               | Sí        |
| `ADMIN_SESSION_SECRET`      | Valor aleatorio de al menos 32 caracteres                       | Sí        |
| `ADMIN_TOTP_ENCRYPTION_KEY` | 32 bytes aleatorios codificados en Base64                       | Sí        |
| `SITE_URL`                  | URL HTTPS pública, por ejemplo `https://prueba-724.vercel.app`  | No        |
| `DATA_RETENTION_DAYS`       | Opcional, entero de 30 a 3650; **no activa** borrado automático | No        |

Para generar cada secreto aleatorio desde una terminal privada con Node:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Ejecuta **dos veces** y guarda valores diferentes para `ADMIN_SESSION_SECRET` y `ADMIN_TOTP_ENCRYPTION_KEY`. No uses la contraseña del administrador como clave de sesión. Conserva especialmente la clave TOTP: perderla impide descifrar los autenticadores existentes. Guarda los cuatro valores sensibles como **Secret** (antes **Sensitive**). Deben quedar únicamente en el servidor y no llevar prefijo `VITE_`.

## 5. Configurar Turnstile para la versión de Vercel

El formulario de esta aplicación usa Cloudflare Turnstile y verifica el token en el servidor antes de guardar solicitudes.

1. En Cloudflare Turnstile, crea o selecciona el widget destinado a la aplicación desplegada en Vercel.
2. En **Allowed Hostnames**, incluye `prueba-724.vercel.app` (sin protocolo ni ruta).
3. En Vercel → Project → Settings → Environment Variables, configura `VITE_TURNSTILE_SITE_KEY` con la Site Key pública y `TURNSTILE_SECRET_KEY` con la Secret Key privada. La secreta debe ser de tipo Secret y nunca llevar prefijo `VITE_`.
4. Vuelve a desplegar para que la clave pública se incorpore al build y el servidor reciba la clave secreta. Prueba el formulario en `https://prueba-724.vercel.app/voluntariado`.

**Importante sobre `foundation.vne`:** ese dominio sigue mostrando la versión histórica alojada en Cloudflare, no esta versión de Prueba-724 en Vercel. No lo configures como hostname de este widget por defecto ni cambies el sitio histórico. Si en el futuro migras el dominio o decides servir esta versión también en `foundation.vne`, configura el hostname y el enrutamiento de forma deliberada, y vuelve a probarlo.

## 6. Desplegar y crear las tablas

1. Inicia el despliegue o ejecuta **Redeploy** tras guardar las variables.
2. Comprueba que la compilación finaliza correctamente en Vercel.
3. El script `npm run build` ejecuta comprobaciones, compila y llama a `npm run db:migrate`.
4. Las migraciones pendientes se aplican transaccionalmente a Neon y se registran en `_migrations`. No edites migraciones ya aplicadas ni ejecutes scripts de la versión histórica.
5. Si falla la compilación, revisa primero `DATABASE_URL`, SSL, credenciales, conexión de Neon y logs de Vercel. **No borres las tablas para intentar arreglarlo**.

## 7. Primer acceso al panel

1. Abre `https://TU-DOMINIO/solicitudes`.
2. Entra con usuario `admin` y la contraseña configurada en `ADMIN_PASSWORD`. El primer acceso válido crea el propietario cuando no existen cuentas.
3. En el panel, configura **Seguridad de mi cuenta → 2FA** con una aplicación de autenticación.
4. Confirma el código TOTP y guarda los diez códigos de recuperación fuera del teléfono.
5. Vuelve a iniciar sesión con el código siguiente del autenticador.
6. Desde las herramientas del propietario, crea cuentas individuales y, si corresponde, exige 2FA al equipo.

`ADMIN_PASSWORD` **no es una puerta trasera**: una vez creada la cuenta, cambiar esa variable no sustituye la contraseña guardada. Para recuperar el propietario sigue [OPERATIONS.md](OPERATIONS.md).

## 8. Verificar funcionamiento

- Visita la portada, navegación, imágenes y páginas públicas.
- Abre `/api/health`; debería responder con estado `ok` cuando el esquema está operativo, o con HTTP 503 genérico si no lo está.
- Prueba los idiomas con `?lang=en` y `?lang=pt`.
- Envía una solicitud ficticia identificada como prueba, comprueba su aparición en `/solicitudes` y elimínala controladamente.
- Revisa los registros de funciones y compilación en Vercel sin exponer datos personales.
- Confirma en Neon la política de respaldos y recuperación que ofrece tu plan.
- Si necesitas verificar una restauración, usa `npm run db:verify` con las credenciales privadas de la **rama correcta**.

## 9. Previews y desarrollo local

Para **Preview**, usa una rama Neon separada, con sus propias credenciales y secretos. Solo tras confirmar el aislamiento establece `PREVIEW_DATABASE_ISOLATED=true` en Preview. Esta variable no comprueba por sí sola que la base sea distinta; nunca apuntes un Preview de pruebas a producción.

En local:

```bash
git clone https://github.com/SantosV06/Prueba-724.git
cd Prueba-724
npm ci --include=dev
npm run dev
```

Para cargar credenciales locales, copia `.env.example` a `.env.local` (`cp .env.example .env.local` en Bash o `Copy-Item .env.example .env.local` en PowerShell). Completa el archivo con un editor privado y valores ficticios; arranca con `node --env-file=.env.local --run dev`. No reutilices credenciales de producción.

Los comandos privados de Node no cargan `.env.local` automáticamente. Por ejemplo: `node --env-file=.env.local --run db:verify` o `node --env-file=.env.local --run db:migrate`. Verifica antes que la conexión corresponde a la rama que quieres operar. Las variables ya presentes en el proceso tienen prioridad sobre ese archivo; no mezcles una terminal con credenciales de producción con pruebas locales.

Sin `DATABASE_URL`, el desarrollo usa PGLite en memoria y pierde los datos al reiniciar. Para probar el panel proporciona localmente `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` mediante variables de entorno privadas; para 2FA añade `ADMIN_TOTP_ENCRYPTION_KEY`. No subas archivos de secretos.

## 10. Actualizaciones, recuperación y límites

- Los cambios incorporados a `main` activan el flujo de despliegue vinculado a Vercel.
- Los cambios de variables de entorno requieren un nuevo despliegue.
- El comando de recuperación privada es `npm run admin:recover -- admin`; con pérdida del segundo factor, `npm run admin:recover -- admin --reset-2fa`. Requiere una terminal interactiva y conexión privada a Neon; nunca lo expongas como endpoint.
- La eliminación por antigüedad **no es automática**: `npm run data:retention` informa y `npm run data:retention -- --apply` aplica el borrado según la política.
- Actualmente **no hay correos automáticos** ni procesamiento de pagos Zelle. No configures proveedores de correo o cobro como si ya estuvieran implementados.

Consulta [OPERATIONS.md](OPERATIONS.md) para copias de seguridad, incidentes, retención y recuperación; [SECURITY.md](SECURITY.md) para medidas y límites de seguridad.

## 11. Entrega a otro equipo

Sigue [HANDOVER.md](HANDOVER.md) para distinguir una instalación vacía de la transferencia del servicio existente, comprobar autenticación y datos, proteger `main` y registrar aceptación.
