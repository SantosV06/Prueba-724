# Seguridad

## Controles implementados

- Validación Zod del lado servidor y consultas parametrizadas. La búsqueda escapa los operadores de `LIKE`.
- Contraseñas con scrypt, sal aleatoria y parámetros fijos. Nunca se devuelve el hash ni la contraseña al navegador.
- Sesiones aleatorias de 256 bits, almacenadas como hash, duración máxima de ocho horas, cookies HttpOnly, SameSite Strict y Secure en producción.
- Verificación de sesión y rol en las funciones del servidor. Una política de 2FA activa restringe las sesiones sin factor a su configuración/cierre; ocultar un botón no es el control de acceso.
- Cierre de sesión con revocación en la base; cambios de contraseña, desactivación y cambios de factor invalidan sesiones.
- Comprobaciones de Origin/Fetch Metadata para operaciones del panel y formulario.
- Límites persistentes por conexión, cuenta/conexión y correo. Los intentos TOTP tienen un presupuesto por cuenta después de verificar la contraseña.
- TOTP de seis dígitos y 30 segundos, tolerancia de un intervalo, prueba consumida atómicamente y códigos de recuperación de un solo uso guardados como hash.
- Secretos TOTP cifrados mediante AES-256-GCM, vinculados a la cuenta. Los triggers bloquean sesiones con una versión de factor antigua.
- Auditoría de accesos exitosos y rechazos de credenciales/factores (`login:failure`), exportaciones, operaciones de solicitudes/cuentas, política y publicación de portada. Los cambios de datos y su evento comparten sentencia o transacción cuando corresponde.
- Panel sin caché ni indexación. Vistas previas de datos bloqueadas hasta confirmar una base aislada.
- CSP con nonce por respuesta para el HTML institucional en Nitro. El servidor asigna el nonce antes de renderizar los scripts de TanStack y del tema. La política base conserva compatibilidad con recursos estáticos y la página heredada de instalación; estilos inline siguen permitidos.
- Editor con campos y longitudes limitados, texto escapado por React y control de revisión. No publica HTML ni modifica destinos de pago.

Los rechazos de login se guardan sin usuario introducido, IP, contraseña, código ni motivo específico. Solo se registran intentos admitidos por los límites, no cada petición bloqueada; tampoco errores de configuración/base ni una solicitud normal del segundo factor. Si falla esa escritura, el acceso sigue rechazado y se emite únicamente `audit:login-failure-unavailable` en el log del servidor. No es un registro exhaustivo de tráfico ni sustituye un monitor de abuso.

## Límites y decisiones de operación

2FA se activa individualmente. La política obligatoria comienza desactivada para permitir un despliegue sin bloquear cuentas existentes. Las cuentas sin factor solo quedan restringidas después de que el propietario habilite esa política.

El formulario de voluntariado utiliza Cloudflare Turnstile para reducir las solicitudes automatizadas. El cliente obtiene un token mediante el widget y, fuera del atajo de CI, el servidor lo verifica con `https://challenges.cloudflare.com/turnstile/v0/siteverify` antes de guardar la solicitud. La integración requiere `VITE_TURNSTILE_SITE_KEY` durante la compilación del cliente, `TURNSTILE_SECRET_KEY` solo en el servidor y un hostname esperado (`TURNSTILE_EXPECTED_HOSTNAME` o el de `SITE_URL`). La clave secreta nunca debe exponerse al navegador ni incluirse en el repositorio. La política CSP debe permitir los recursos de Turnstile de Cloudflare. El job `validate` define claves oficiales de prueba y, con `TURNSTILE_TEST_MODE`, no llama a esa API; no reutilices esas claves en producción.

Turnstile complementa los límites de solicitudes y el campo honeypot, pero no garantiza por sí solo la ausencia de abuso automatizado ni sustituye la supervisión operativa. El servidor rechaza el formulario si no puede resolver un hostname esperado (`TURNSTILE_EXPECTED_HOSTNAME` o el hostname de `SITE_URL`) o si `siteverify` no devuelve exactamente ese hostname. En el job `validate` de CI, `TURNSTILE_TEST_MODE` junto con `CI` y `E2E_LOCAL_DATABASE` omite `siteverify` y acepta un token de prueba; el SDK del navegador también se sustituye. Las claves oficiales de prueba que aparecen en el workflow no deben copiarse a producción, y ese job no demuestra la verificación real contra Cloudflare. Los límites por IP/correo tampoco detienen todo abuso distribuido ni sustituyen un WAF o un desafío adaptativo. El scrypt consume memoria deliberadamente (`N=131072`, `r=8`, `p=1`); la capacidad y los límites de plataforma deben medirse con carga real.

*Nota del desarrollador: Turnstile resultó bastante más difícil de integrar de lo que sugería el clásico «solo hay que añadir un captcha» 😅. Precisamente por eso la integración cuenta con pruebas y configuración documentada.*

El chequeo horario de `.github/workflows/availability.yml` ya se ejecuta en este repositorio y solo mira la portada y `/api/health`. No avisa por correo ni por Slack: si las notificaciones de GitHub Actions están apagadas, un fallo queda solo en la pestaña Actions. No detecta todos los errores de interfaz ni la entrega de correos. El responsable confirmó el 28 de octubre de 2026 que Turnstile funciona en Production; el job `validate` sigue sin llamar a `siteverify` y no sustituye esa comprobación. Los logs no deben incluir contraseñas, claves, códigos, mensajes, CSV o URLs de conexión. No hay certificación de seguridad, prueba de penetración exhaustiva ni garantía de ausencia de fallos.

La recuperación y conservación de Neon, permisos de GitHub/Vercel, versiones antiguas publicadas y custodia de claves son responsabilidad operativa. Deshabilita vistas antiguas que no deban conservar acceso a la misma base. Una migración correcta no hace seguros automáticamente todos los despliegues anteriores.

## Dependencias y validación

El lockfile fija las versiones instaladas. ESLint 10 es el linter configurado. Recharts no forma parte de las dependencias. Las revisiones futuras deben ejecutar tipos, lint, pruebas, compilación y navegador. `npm audit` informa vulnerabilidades conocidas del catálogo consultado; no sustituye el análisis del código.

CI usa bases desechables y credenciales ficticias. Las pruebas de servicios pueden ejecutarse contra PostgreSQL local con un esquema independiente por proceso; rechazan hosts remotos para evitar tocar Neon. No ejecutes E2E de escritura contra producción.

## Correo transaccional y privacidad

El módulo de Brevo usa `BREVO_API_KEY` únicamente en el servidor. No expongas esa clave al cliente ni la guardes en el repositorio, logs o variables `VITE_`. El aviso interno de una solicitud nueva incluye nombre, correo y teléfono, y omite el mensaje personal. El aviso de estado (`aceptada` o `descartada`) se envía al voluntario después de que el cambio y su auditoría ya se guardaron; no incluye el mensaje personal y no exige `VOLUNTEER_NOTIFICATION_EMAIL`. Los valores dinámicos que se insertan en HTML se escapan. Los errores del proveedor se registran sin cuerpos de respuesta, direcciones, contenido personal ni claves. La integración no garantiza entrega, no cambia por sí misma el estado de una solicitud y no debe utilizarse para enviar datos adicionales sin una revisión de privacidad. Las pruebas automatizadas simulan la API y no sustituyen una prueba de aceptación autorizada.

## Comunicación de incidencias

Contacta privadamente al propietario del repositorio por un canal acordado. No publiques secretos ni datos de voluntarios en Issues o PRs. Incluye ruta, comportamiento, impacto y pasos mínimos con datos ficticios. Si se expone una credencial, revócala o rótala, revisa accesos y sigue el procedimiento de recuperación apropiado; borrar el texto del último commit no elimina su historial.

## Automatización de dependencias y secretos

En `main` están `.github/dependabot.yml` (npm y GitHub Actions, semanal), `.github/workflows/security-audit.yml` (`npm audit --audit-level=high`), `.github/workflows/dependency-review.yml` (solo pull requests, severidad alta) y `.github/workflows/codeql.yml` (Actions, JavaScript/TypeScript y Python). Estos controles complementan, pero no sustituyen, revisión de código, pruebas ni respuesta a incidentes.

El propietario debe comprobar si el repositorio dispone de **Secret Scanning** y **Push Protection** y activarlos en la configuración de seguridad de GitHub cuando estén disponibles. La presencia de este documento o de un workflow no demuestra que esas funciones de cuenta estén habilitadas.

Los informes de vulnerabilidad deben incluir el paquete, versión afectada, impacto y una ruta de reproducción segura. Nunca incluyas claves reales, contraseñas, códigos TOTP, mensajes de voluntarios ni URLs de conexión con credenciales en issues, PR, logs o artefactos públicos.

Consulta también [THREAT_MODEL.md](THREAT_MODEL.md), [OPERATIONS_SECURITY_RUNBOOKS.md](OPERATIONS_SECURITY_RUNBOOKS.md) y [OPERATIONS.md](OPERATIONS.md) para riesgos y procedimientos de recuperación.
