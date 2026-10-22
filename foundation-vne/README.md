# Archivo histórico · Cloudflare Pages y D1

Esta carpeta conserva una implementación anterior. **No es el backend activo** de Prueba-724 en Vercel y no debe configurarse como Root Directory, directorio público o fuente de migraciones de Neon.

La aplicación vigente vive en `src/`, con Neon PostgreSQL, cuentas individuales, TOTP, auditoría y contenido de portada. Sus migraciones están en `migrations/*.sql`.

- [Descripción actual](../README.md)
- [Configuración de Neon y Vercel](../SETUP_DATABASE.md)
- [Operación y recuperación](../OPERATIONS.md)
- [Seguridad](../SECURITY.md)

No ejecutes `schema.sql` de este archivo histórico sobre Neon ni copies estas funciones a las rutas activas. Si todavía existe un despliegue Cloudflare separado, su acceso y retirada deben comprobarse en la cuenta correspondiente. Conservar archivos en Git no demuestra que sus endpoints estén publicados ni que estén protegidos por las medidas de la aplicación nueva.

Los cambios nuevos deben realizarse en la aplicación activa; esta carpeta se mantiene como referencia histórica.
