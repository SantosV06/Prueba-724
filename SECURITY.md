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

El formulario de voluntariado utiliza Cloudflare Turnstile para reducir las solicitudes automatizadas. El cliente obtiene un token mediante el widget y el servidor verifica su validez con la API oficial de Turnstile antes de procesar la solicitud. La integración requiere configurar `VITE_TURNSTILE_SITE_KEY` como variable disponible durante la compilación del cliente y `TURNSTILE_SECRET_KEY` como secreto exclusivamente del servidor en cada entorno donde se despliegue. La clave secreta nunca debe exponerse al navegador ni incluirse en el repositorio. La política CSP debe permitir los recursos de Turnstile de Cloudflare. En CI/E2E se utilizan claves de prueba y mocks controlados; no se deben reutilizar esas claves como configuración de producción.\n\nTurnstile complementa los límites de solicitudes y el campo honeypot, pero no garantiza por sí solo la ausencia de abuso automatizado ni sustituye la supervisión operativa. Los límites por IP/correo tampoco detienen todo abuso distribuido ni sustituyen un WAF o un desafío adaptativo. El scrypt consume memoria deliberadamente; la capacidad y los límites de plataforma deben medirse con carga real.\n\n*Nota del desarrollador: Turnstile resultó bastante más difícil de integrar de lo que sugería el clásico «solo hay que añadir un captcha» 😅. Precisamente por eso la integración cuenta con pruebas y configuración documentada.*

El monitoreo horario detecta inicio/salud, no todos los errores de interfaz ni la entrega de correos. Los logs no deben incluir contraseñas, claves, códigos, mensajes, CSV o URLs de conexión. No hay certificación de seguridad, prueba de penetración exhaustiva ni garantía de ausencia de fallos.

La recuperación y conservación de Neon, permisos de GitHub/Vercel, versiones antiguas publicadas y custodia de claves son responsabilidad operativa. Deshabilita vistas antiguas que no deban conservar acceso a la misma base. Una migración correcta no hace seguros automáticamente todos los despliegues anteriores.

## Dependencias y validación

El lockfile fija las versiones instaladas. ESLint y su configuración se actualizan a la rama 10; se elimina Recharts, que no tenía consumidores en la aplicación. Las revisiones futuras deben ejecutar tipos, lint, pruebas, compilación y navegador. `npm audit` informa vulnerabilidades conocidas del catálogo consultado; no sustituye el análisis del código.

CI usa bases desechables y credenciales ficticias. Las pruebas de servicios pueden ejecutarse contra PostgreSQL local con un esquema independiente por proceso; rechazan hosts remotos para evitar tocar Neon. No ejecutes E2E de escritura contra producción.

## Correo transaccional y privacidad

El módulo de Brevo usa `BREVO_API_KEY` únicamente en el servidor. No expongas esa clave al cliente ni la guardes en el repositorio, logs o variables `VITE_`. Los mensajes incluyen datos de contacto necesarios para gestionar la solicitud; el aviso interno omite el mensaje personal del voluntario. Los valores dinámicos que se insertan en HTML se escapan. Los errores del proveedor se registran sin cuerpos de respuesta, direcciones, contenido personal ni claves. La integración no garantiza entrega, no cambia el estado de una solicitud y no debe utilizarse para enviar datos adicionales sin una revisión de privacidad. Las pruebas automatizadas simulan la API y no sustituyen una prueba de aceptación autorizada.

## Comunicación de incidencias

Contacta privadamente al propietario del repositorio por un canal acordado. No publiques secretos ni datos de voluntarios en Issues o PRs. Incluye ruta, comportamiento, impacto y pasos mínimos con datos ficticios. Si se expone una credencial, revócala o rótala, revisa accesos y sigue el procedimiento de recuperación apropiado; borrar el texto del último commit no elimina su historial.
