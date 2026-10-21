# Activación de la base de datos en Vercel

Este sitio usa **Neon PostgreSQL** con la variable `DATABASE_URL`. Las solicitudes
de `/voluntariado` se guardan en `volunteer_requests`; el personal autorizado las
consulta, exporta o elimina en `/solicitudes`.

## 1. Crear Neon
1. Abre https://console.neon.tech y crea un proyecto (plan gratuito si está disponible).
2. En el panel de Neon elige **Connect**, selecciona la base de datos y copia la
   cadena PostgreSQL **pooled** (con `-pooler` y `sslmode=require`).
3. No copies la conexión en GitHub, el código o un archivo público.

## 2. Añadir variables en Vercel
Abre https://vercel.com/dashboard → proyecto Prueba-724 → Settings → Environment Variables.
Define en **Production** (y, para probar en vista previa, también en **Preview**):

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | Cadena PostgreSQL obtenida en Neon |
| `ADMIN_PASSWORD` | Contraseña propia robusta de **14 caracteres o más** |
| `ADMIN_SESSION_SECRET` | Secreto aleatorio de **32 caracteres o más**; genera uno con `openssl rand -hex 32` |

> Las variables son de servidor: no uses prefijos `VITE_` ni `NEXT_PUBLIC_`.
> No compartas sus valores por chat ni los incorpores al repositorio.

## 3. Publicar
- Fusiona el pull request con los cambios a `main` (si todavía no se fusionó).
- En Vercel abre **Deployments → Redeploy** o espera el despliegue de `main`.
- `npm run build` aplica automáticamente `migrations/0001_volunteer_requests.sql`
  a Neon utilizando `scripts/migrate.mjs`. No necesitas ejecutar SQL manualmente.
- Si falta la variable o falla una migración, revisa el **Build Log** en Vercel.

## 4. Probar
1. Abre `https://TU_DOMINIO/voluntariado`; llena el formulario.
2. Debe aparecer **Solicitud registrada** solo después de que responda el servidor.
3. Abre `https://TU_DOMINIO/solicitudes`, introduce `ADMIN_PASSWORD`.
4. Verifica el registro, exporta el CSV y cierra la sesión.
5. En Neon → **SQL Editor** ejecuta `SELECT COUNT(*) FROM volunteer_requests;`
   para corroborar que los datos permanecen centralizados.

## Avisos
- Los registros antiguos en `localStorage` de cada navegador **no se migran**
  automáticamente. Exporta o conserva esos datos por separado antes de borrarlos.
- La vista previa local puede usar PGLite temporal; producción bloquea ese modo
  para no perder datos en reinicios de Vercel.
- El panel está limitado a 1.000 solicitudes por consulta; no incorpora paginación.
- Hay límites básicos de envíos (5/hora/IP) y accesos (8/15 min/IP).
- El panel usa una cookie firmada, HttpOnly, SameSite=Strict, con duración de 8 horas.
- El formulario no envía correos automáticos; registra solicitudes en la base.
