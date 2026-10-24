# Mantenimiento de Prueba-724

Este repositorio contiene la aplicación activa de Fundación VNE, desplegada desde la raíz en Vercel y conectada a Neon PostgreSQL.

## Fuentes vigentes

Lee `README.md`, `SETUP_DATABASE.md`, `OPERATIONS.md`, `SECURITY.md`, `ARCHITECTURE.md` y `MULTIMEDIA.md` según el alcance del trabajo. Actualiza las guías afectadas cuando cambie el comportamiento. Distingue lo implementado, lo comprobado y lo que requiere operación externa.

## Contratos

- Node 24.x y npm 11.9.0. Usa `npm ci --include=dev` y conserva el lockfile.
- Desarrollo con `npm run dev`, compilación con `npm run build`; conserva la preparación de multimedia y `startup.sh`.
- Desarrollo en `0.0.0.0:8080); preview local de compilación en `127.0.0.1:8081). Mantén Nitro limitado a build/preview y `serverDir: './server'`.
- La aplicación activa está en `src/`; no despliegues `foundation-vne/` ni migres su esquema D1 a Neon.
- El panel utiliza `volunteer-service.server.ts` y los módulos `admin-*`; Better Auth no es el sistema de autenticación activo.
- No guardes secretos ni datos reales en Git, pruebas, logs, capturas o documentación. No expongas variables del servidor con `VITE_`.
- No ejecutes E2E de escritura ni utilidades destructivas contra producción para validar un cambio. Usa bases y credenciales desechables.

## Backend y seguridad

Cada función administrativa debe comprobar sesión y permiso en el servidor. La política de 2FA se aplica también al API; la inscripción tiene una excepción limitada y explícita. No añadas recuperación por contraseña de entorno ni un bypass de factores.

Valida entradas, utiliza parámetros SQL y limita paginación/exportaciones. Los eventos de auditoría no deben copiar contraseñas, factores o mensajes de voluntarios. Mantén escrituras/auditoría atómicas y pruebas de concurrencia donde afectan a códigos o datos.

Nuevos cambios de esquema requieren migraciones aditivas. No edites archivos aplicados ni configures Preview con Production. Las pruebas de escritura deben usar bases desechables.
