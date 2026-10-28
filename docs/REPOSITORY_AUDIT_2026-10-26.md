# Revisión documental de Prueba-724 — 26 de octubre de 2026

> **Actualización 28 de octubre de 2026.** DOC-01 y DOC-02 ya no están en `main`: la guía de instalación numera Turnstile de forma consecutiva y `BREVO_SETUP.md` no tiene el paréntesis sobrante. El cierre original de este informe describía una rama de mantenimiento que no se integraba; eso vale solo para la sesión del 26 de octubre. La comparación posterior con el código está al final, en «Actualización frente al código».

## Alcance y límites

Revisión estática de documentación y configuración accesible en la rama `main`: `README.md`, `README.en.md`, `ARCHITECTURE.md`, `OPERATIONS.md`, `SECURITY.md`, `package.json`, `GUIA_INSTALACION_COMPLETA.md`, `BREVO_SETUP.md`, `.gitignore` y `.github/workflows/ci.yml`. También se hicieron búsquedas puntuales de referencias de archivos y de tareas pendientes.

No se descargó ni ejecutó el repositorio completo y no se inspeccionó cada archivo de código. Este informe no equivale a una auditoría integral, un análisis dinámico, una prueba de penetración ni una validación del despliegue. No se afirma que CI esté verde ni que producción esté correctamente configurada.

## Hallazgos confirmados

### DOC-01 — Numeración duplicada en la guía de instalación

**Severidad: baja · Documentación**

En la versión de `main` revisada, la lista de Turnstile tenía numeración duplicada. La rama de mantenimiento renumera los pasos consecutivamente; confirmar que esta corrección se mantiene en el diff antes de integrar.

### DOC-02 — Error tipográfico en BREVO_SETUP.md

**Severidad: baja · Documentación**

En la versión de `main` revisada, la mención de `ADMIN_TOTP_ENCRYPTION_KEY` tenía un paréntesis sobrante. La rama de mantenimiento corrige el texto; confirmar el diff antes de integrar.

### DOC-03 — README en inglés es solo un índice breve

**Severidad: baja · Consistencia documental**

`README.en.md` enlaza las guías inglesas y ofrece un resumen, mientras que el README español documenta más comandos, validaciones y límites. No es un fallo de ejecución, pero conviene mantener ambos índices sincronizados cuando cambien funciones, comandos o requisitos de seguridad.

## Riesgos y verificaciones pendientes (no son vulnerabilidades confirmadas)

1. **Turnstile:** verificar en Vercel que el hostname esperado coincide con el hostname real de cada entorno. El valor `localhost` del CI es exclusivo de las pruebas y no debe copiarse a Production.
2. **Brevo:** los tests automatizados simulan el proveedor. La entrega real de confirmación y aviso interno debe verificarse por separado con destinatarios controlados; un CI verde no demuestra la entrega.
3. **Base de Preview:** comprobar manualmente que la base de datos de Preview está aislada de Production antes de habilitar cualquier flujo de escritura.
4. **Cabeceras:** revisar las cabeceras HTTP efectivas de los dominios desplegados. Leer la configuración fuente no demuestra qué cabeceras sirven todos los despliegues.
5. **Protección del repositorio:** verificar en GitHub el estado real de Secret Scanning, Push Protection, reglas de rama y permisos. La documentación no prueba que esos controles estén activados.
6. **Recuperación:** ensayar restauración de Neon en un entorno separado y documentar el resultado. Tener procedimientos escritos no demuestra que una copia sea restaurable.
7. **Dependencias y pruebas:** revisar los resultados de CI y `npm audit` del SHA exacto que se pretende fusionar. Este informe no ejecuta esos comandos.

## Limpieza y eliminación de archivos

No se recomienda borrar código, dependencias, migraciones, workflows ni directorios históricos solo porque parezcan antiguos. Para declarar algo innecesario hay que verificar referencias, imports dinámicos, rutas, scripts, configuración de build, workflows, migraciones y necesidades de recuperación. La búsqueda textual por sí sola no demuestra que un archivo esté sin uso.

La documentación de `main` menciona una versión histórica de Cloudflare y herramientas del generador, pero esas menciones no prueban que dichos directorios existan actualmente. No se obtuvo un listado exhaustivo del árbol Git en esta revisión, así que no se afirma que existan ni que estén ausentes. Antes de borrar o archivar algo, verificar el árbol real, las referencias, scripts, imports, configuración de build y reglas de despliegue. No se elimina ningún archivo en esta revisión.

## Archivos revisados

- `README.md`, `README.en.md`
- `ARCHITECTURE.md`, `OPERATIONS.md`, `SECURITY.md`
- `GUIA_INSTALACION_COMPLETA.md`, `BREVO_SETUP.md`
- `package.json`, `.gitignore`, `.github/workflows/ci.yml`

## Correcciones propuestas en la rama

- Corregir la numeración de la sección Turnstile en `GUIA_INSTALACION_COMPLETA.md`.
- Corregir el paréntesis sobrante en `BREVO_SETUP.md`.
- Aclarar en `README.md` y `ARCHITECTURE.md` que el alcance del despliegue no demuestra la presencia física de carpetas históricas.
- Mejorar los enlaces del índice en inglés.

## Estado y límites de la sesión del 26 de octubre

Los párrafos siguientes describen aquella sesión, no el árbol actual. Entonces las correcciones propuestas estaban en una rama de mantenimiento y no modificaban `main`. No se ejecutaron CI, build, pruebas ni un escaneo exhaustivo del árbol. La auditoría de esa fecha sigue siendo documental y parcial.

## Actualización frente al código — 28 de octubre de 2026

Se contrastó la documentación con el árbol de `main` (código, migraciones, `package.json` y workflows), no solo con los archivos de la lista original.

Correcciones aplicadas porque el texto contradecía el código:

- `OPERATIONS.md` decía que cambiar el estado no envía correo. `volunteer-service.server.ts` llama a `notifyVolunteerStatus` cuando el estado guardado pasa a `aceptada` o `descartada`. `contactada`, el mismo estado, la papelera y la restauración no envían correo. El fallo de Brevo no revierte la fila ni la auditoría.
- El alta exige `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `VOLUNTEER_NOTIFICATION_EMAIL`. El aviso de estado no exige el buzón interno.
- El formulario exige hostname de `TURNSTILE_EXPECTED_HOSTNAME` o de `SITE_URL`. `VERCEL_PROJECT_PRODUCTION_URL` solo puede completar el origen del sitemap en `scripts/site-origin.mjs`; no valida Turnstile.
- En el job `validate`, `TURNSTILE_TEST_MODE` con `CI` y `E2E_LOCAL_DATABASE` no llama a `siteverify`. El comentario de `scripts/e2e.mjs` decía lo contrario.
- `npm run admin:recover -- admin` también revoca sesiones y escribe `account:recovery`. `--reset-2fa` además retira el factor y los códigos.
- `/api/health` responde `{"status":"ok"}` o `{"status":"unavailable"}` tras consultar `admin_policy`, con caché de 15 segundos.
- Los workflows presentes, además de `ci.yml` y `availability.yml`, son `security-audit.yml`, `dependency-review.yml` y `codeql.yml`, más `dependabot.yml`. No son el check `validate`.
- El monitor horario usa `https://prueba-724.vercel.app` si no existe la variable de Actions `MONITOR_SITE_URL`.
- La auditoría de idioma se guarda como `settings:language`. Un código de recuperación aceptado se guarda como `login:recovery-code`.
- Sin `DATABASE_URL` el migrador de `npm run build` no aplica SQL; PGLite aplica las migraciones al arrancar. En Preview, sin `PREVIEW_DATABASE_ISOLATED=true`, el migrador sale sin aplicarlas.

No se reescribieron procedimientos que el código no puede demostrar: entrega real de Brevo, aislamiento de Preview, Secret Scanning, restauración de Neon ni el resultado de CI. `src/lib/env.server.ts` define `isWorkspacePreview` y no tiene consumidores; no forma parte del panel ni de Brevo.
