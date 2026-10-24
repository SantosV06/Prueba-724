# Seguridad

## Controles implementados

- Validación Zod del lado servidor y consultas parametrizadas. La búsqueda escapa los operadores de `LIKE`.
- Contraseñas con scrypt, sal aleatoria y parámetros fijos. Nunca se devuelve el hash ni la contraseña al navegador.
- Sesiones aleatorias de 256 bits, almacenadas como hash, duración máxima de ocho horas, cookies HttpOnly, SameSite Strict y Secure en producción.
- Verificación de sesión y rol en las funciones del servidor. Una política de 2FA activa restringe las sesiones sin factor a su configuración/cierre; ocultar un botón no es el control de acceso.
- Cierre de sesión con revocación en la base; cambios de contraseña, desactivación y cambios de factor invalidan sesiones.
- Comprobaciones de Origin/Fetch Metadata para operaciones del panel y formulario.
- Cloudflare Turnstile para el formulario público: el token se verifica en el servidor contra `siteverify` antes de guardar la solicitud; el token no se persiste. El honeypot `website` se conserva como defensa complementaria.
- Límites persistentes por conexión, cuenta/conexión y correo. Los intentos TOTP tienen un presupuesto por cuenta después de verificar la contraseña.
- TOTP de seis dígitos y 30 segundos, tolerancia de un intervalo, prueba consumida atómicamente y códigos de recuperación de un solo uso guardados como hash.
- Secretos TOTP cifrados mediante AES-256-GCM, vinculados a la cuenta. Los triggers bloquean sesiones con una versión de factor antigua.
- Auditoría de accesos exitosos y rechazos de credenciales/factores (`login:failure`), exportaciones, operaciones de solicitudes/cuentas, política y publicación de portada. Los cambios de datos y su evento comparten sentencia o transacción cuando corresponde.
- Panel sin caché ni indexación. Vistas previas de datos bloqueadas hasta confirmar una base aislada.
- CSP con nonce por respuesta para el HTML institucional en Nitro. El servidor asigna el nonce antes de renderizar los scripts de TanStack y del tema. La política base conserva compatibilidad con recursos estáticos y la página heredada de instalación; estilos inline siguen permitidos.
- Editor con campos y longitudes limitados, texto escapado por React y control de revisión. No publica HTML ni modifica destinos de pago.

Los rechazos de login se guardan sin usuario introducido, IP, contraseña, código ni motivo específico. Solo se registran intentos admitidos por los límites, no cada petición bloqueada; tampoco errores de configuración/base ni una solicitud normal del segundo factor. Si falla esa escritura, el acceso sigue rechazado y se emite únicamente `audit:login-failure-unavailable` en el log del servidor. No es un registro exhaustivo de tráfico ni sustituye un monitor de abuso.

## Turnstile y despliegue

En producción deben configurarse `VITE_TURNSTILE_SITE_KEY` (clave pública de compilación) y `TURNSTILE_SECRET_KEY` (secreto de servidor). El widget de Cloudflare para esta versión de Vercel debe permitir `prueba-724.vercel.app`. El dominio `foundation.vne` sirve la versión histórica alojada en Cloudflare y mantiene una configuración independiente; no se debe asumir que esta aplicación de Vercel está desplegada allí. Solo registra `foundation.vne` en este widget si esta versión también va a servirse bajo ese hostname. La CSP permite `https://challenges.cloudflare.com` en `script-src`, `frame-src` y `connect-src`. Las claves oficiales de prueba de CI no deben utilizarse en producción, y las pruebas E2E simulan el SDK para no depender de Cloudflare.

## Límites y decisiones de operación

2FA se activa individualmente. La política obligatoria comienza desactivada para permitir un despliegue sin bloquear cuentas existentes. Las cuentas sin factor solo quedan restringidas después de que el propietario habilite esa política.

Los límites por IP/correo no detienen todo abuso distribuido ni sustituyen un WAF o un desafío adaptativo. No se añadió un captcha ni un servicio de pago de forma automática. El scrypt consume memoria deliberadamente; la capacidad y los límites de plataforma deben medirse con carga real.

El monitoreo horario detecta inicio/salud, no todos los errores de interfaz ni la entrega de correos. Los logs no deben incluir contraseñas, claves, códigos, mensajes, CSV o URLs de conexión. No hay certificación de seguridad, prueba de penetración exhaustiva ni garantía de ausencia de fallos.

La recuperación y conservación de Neon, permisos de GitHub/Vercel, versiones antiguas publicadas y custodia de claves son responsabilidad operativa. Deshabilita vistas antiguas que no deban conservar acceso a la misma base. Una migración correcta no hace seguros automáticamente todos los despliegues anteriores.

## Dependencias y validación

El lockfile fija las versiones instaladas. ESLint y su configuración se actualizan a la rama 10; se elimina Recharts, que no tenía consumidores en la aplicación. Las revisiones futuras deben ejecutar tipos, lint, pruebas, compilación y navegador. `npm audit` informa vulnerabilidades conocidas del catálogo consultado; no sustituye el análisis del código.

CI usa bases desechables y credenciales ficticias. Las pruebas de servicios pueden ejecutarse contra PostgreSQL local con un esquema independiente por proceso; rechazan hosts remotos para evitar tocar Neon. No ejecutes E2E de escritura contra producción.

## Comunicación de incidencias

Contacta privadamente al propietario del repositorio por un canal acordado. No publiques secretos ni datos de voluntarios en Issues o PRs. Incluye ruta, comportamiento, impacto y pasos mínimos con datos ficticios. Si se expone una credencial, revócala o rótala, revisa accesos y sigue el procedimiento de recuperación apropiado; borrar el texto del último commit no elimina su historial.
