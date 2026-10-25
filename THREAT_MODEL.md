# Modelo de amenazas

**Estado:** evaluación inicial basada en la arquitectura documentada. No es una certificación ni una prueba de penetración.

## Alcance y activos
Se consideran la aplicación TanStack Start/Nitro desplegada en Vercel, PostgreSQL de Neon, el panel administrativo, el formulario de voluntariado, Brevo y los flujos de CI/CD.

Activos que proteger:
- Datos personales y mensajes de solicitudes de voluntariado.
- Contraseñas, sesiones, factores TOTP, códigos de recuperación y claves de cifrado.
- Cuentas administrativas, política de acceso y contenido institucional.
- Integridad de la base, migraciones y copias de seguridad.
- Credenciales de despliegue, API de Brevo, secretos de Turnstile y configuración de Vercel.
- Disponibilidad e integridad de la web y del proceso de publicación.

## Límites de confianza
1. Navegador público → funciones del servidor: toda entrada es no confiable.
2. Funciones del servidor → PostgreSQL: evitar consultas no parametrizadas y exposición de filas de otras solicitudes.
3. Navegador → Turnstile → servidor: el token no es confiable hasta validarlo en el servidor.
4. Servidor → Brevo: el proveedor puede fallar; el error de correo no debe invalidar una solicitud ya guardada.
5. GitHub Actions → artefacto/despliegue: PR, dependencias y workflows son entradas de la cadena de suministro.
6. Operación → Vercel/Neon: credenciales de producción deben permanecer fuera del repositorio y de los logs.

## Escenarios STRIDE prioritarios

| Amenaza | Ejemplo | Controles conocidos | Trabajo pendiente |
|---|---|---|---|
| Suplantación | Robo de sesión o credenciales administrativas | scrypt, sesión aleatoria revocable, TOTP, cookies seguras | Revisar recuperación y revocación concurrente |
| Manipulación | Solicitud, estado o migración alterados | Zod, consultas parametrizadas, permisos, auditoría | Pruebas de concurrencia y revisión de migraciones destructivas |
| Repudio | Acción administrativa discutida | Eventos de auditoría y request ID | Definir retención, integridad y alertas externas |
| Divulgación | Datos personales en CSV, logs o respuestas | Exportación controlada, respuestas genéricas, panel sin caché | Revisar accesos de operadores, copias y retención |
| Denegación de servicio | Envíos automatizados o fuerza bruta | Límites persistentes, Turnstile, honeypot | Medir límites distribuidos; valorar Redis/WAF según carga |
| Elevación de privilegios | Cuenta no propietaria cambia política o datos | Comprobaciones de rol en servidor y restricciones 2FA | Pruebas negativas para cada operación sensible |

## Supuestos y límites
- Las variables de producción se administran en Vercel y los secretos no se guardan en Git.
- PGLite es para desarrollo/pruebas; no es persistencia de producción.
- Los checks de disponibilidad no demuestran que formulario, correo, recuperación y panel funcionen por completo.
- Los controles descritos proceden de documentación y revisión estática; deben verificarse con pruebas y respuestas reales.
- El nonce CSP para scripts ya existe. style-src unsafe-inline sigue siendo una deuda hasta identificar y probar los estilos que dependen de ello.
- Backups, retención de Neon, alertas y permisos externos dependen también de configuración fuera del repositorio.

## Plan de verificación
1. Revisar cabeceras, CSP, cookies y caché en respuestas de producción y Preview.
2. Probar autorización negativa de funciones administrativas y revocación de sesiones.
3. Ejecutar pruebas concurrentes de idempotencia, TOTP y límites.
4. Verificar restauración de Neon en una base separada, sin sobrescribir producción.
5. Confirmar alertas de GitHub, Vercel, Neon y Brevo con eventos de prueba.
6. Ejecutar DAST autorizado en Preview; no lanzar escaneo agresivo en producción sin ventana y aprobación.

Actualizar este documento cuando cambien autenticación, base de datos, proveedores externos, controles de acceso o despliegue. Toda afirmación de control implementado debe tener una prueba, configuración o referencia verificable.
