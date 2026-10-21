# Fundación VNE

Web institucional con TanStack Start, React, Vite y Nitro para Vercel. Neon PostgreSQL almacena solicitudes de voluntariado; `/solicitudes` permite acceso administrativo, filtros, estados, exportación CSV y papelera recuperable.

## Desarrollo y validación

Node 24, npm 11.9.0. Instala con `npm ci`. `npm run dev` inicia el desarrollo; sin Neon usa PGLite local temporal. Para probar formulario y administración local, proporciona credenciales de prueba mediante variables del proceso (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`), nunca archivos de secretos versionados.

- `npm run check`: tipos, lint y pruebas, incluidas consultas PostgreSQL en PGLite desechable.
- `npm run build`: comprobaciones, compilación y migraciones según ambiente.
- `npm run test:e2e -- http://127.0.0.1:8080`: revisión de navegador sobre desarrollo local (requiere Chromium de Playwright y `E2E_ADMIN_PASSWORD` de pruebas). Mapas y script externo de marca se sustituyen solo en QA; las funciones y consultas de la aplicación se ejecutan realmente.
- `npm run db:migrate`: migraciones pendientes con bloqueo transaccional.

Consulta [SETUP_DATABASE.md](SETUP_DATABASE.md) para producción, aislamiento de Preview y tareas del propietario; [MULTIMEDIA.md](MULTIMEDIA.md) para recursos optimizados.

Las migraciones nuevas preservan registros existentes. GitHub Actions valida cada PR y cada cambio en `main` sin secretos de producción. El build de Vercel también ejecuta las comprobaciones.
