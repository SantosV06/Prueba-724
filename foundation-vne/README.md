# Archivo histórico: versión Cloudflare

Esta carpeta conserva la implementación anterior basada en Cloudflare Pages y D1.
No es el backend activo del despliegue Vercel de Prueba-724 y no debe configurarse
como Root Directory ni como directorio público de ese proyecto.

La aplicación actual vive en `src/`; el formulario y el panel usan
`src/lib/volunteer-functions.ts` y `src/lib/volunteer-service.server.ts` con Neon
PostgreSQL. Su esquema se mantiene en `migrations/*.sql` y las instrucciones
vigentes están en `../SETUP_DATABASE.md`.

No ejecutes `schema.sql` de esta carpeta sobre Neon ni copies estas funciones a
las rutas del sitio actual. Si todavía existe un despliegue Cloudflare separado,
su acceso y retirada deben comprobarse en esa cuenta: conservar estos archivos
en Git no demuestra que esos endpoints estén publicados.
