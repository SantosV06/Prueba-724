# Runbooks de seguridad y recuperación

Ensayar primero en un entorno aislado y registrar responsable, hora, alcance y resultado. No ejecutar comandos destructivos sobre producción sin copia comprobada y aprobación explícita.

## 1. Posible compromiso de una cuenta administradora
1. Confirmar el incidente con el propietario por un canal independiente; conservar eventos de auditoría pertinentes.
2. Deshabilitar o restringir la cuenta comprometida y revocar sesiones. Si no es posible, usar el procedimiento de recuperación del propietario descrito en HANDOVER.md y SECURITY.md.
3. Cambiar contraseña y reconfigurar TOTP desde un dispositivo de confianza. Invalidar códigos de recuperación antiguos y emitir otros nuevos.
4. Revisar eventos alrededor del periodo sospechoso: inicios de sesión, exportaciones, cambios de cuenta, política 2FA y contenido.
5. Evaluar si se consultaron o exportaron solicitudes; preservar evidencia y aplicar el procedimiento de privacidad/incidentes correspondiente.
6. Restaurar acceso solo tras confirmar identidad, rotar credenciales y revisar eventos posteriores.
7. Documentar causa raíz, alcance, medidas correctivas y pruebas de cierre.

## 2. Sospecha de fuga de ADMIN_TOTP_ENCRYPTION_KEY
1. Tratar la clave como comprometida; no copiarla a incidencias, chats, logs ni commits.
2. Identificar entornos, despliegues, personas con acceso y periodo de exposición.
3. Preparar una estrategia compatible con el formato de almacenamiento. No sustituir la clave directamente: los secretos TOTP podrían dejar de descifrarse.
4. En un entorno aislado, probar una migración versionada: descifrar con la clave antigua, cifrar con la nueva, verificar autenticación y recuperación, y comprobar rollback.
5. Programar una ventana controlada; preservar la clave antigua en el gestor de secretos con acceso restringido hasta verificar todos los registros migrados. Retirarla después de la validación.
6. Si hubo exposición real, exigir cambios de contraseña, re-enrolamiento TOTP o revocación de sesiones según el alcance.
7. Si no existe migrador verificado, detenerse y solicitar intervención técnica; no improvisar rotación en producción.

## 3. Recuperación de Neon
1. Confirmar proyecto, rama, región, ventana temporal y objetivo; avisar al responsable.
2. Revisar capacidades de restauración/PITR y retención realmente contratadas y habilitadas. No asumir que existe un punto de restauración.
3. Restaurar a una rama/base separada o clonar el estado recuperado. No sobrescribir producción como primer paso.
4. Ejecutar npm run db:verify y pruebas de lectura, migraciones y consistencia sobre la copia. Validar relaciones sin exportar datos personales innecesarios.
5. Comparar con el objetivo de recuperación y determinar escrituras posteriores que se perderían o deben reconciliarse.
6. Solo con aprobación explícita, ejecutar el plan de cambio de conexión/restauración productiva, con rollback y ventana de mantenimiento.
7. Registrar el punto recuperado, pérdida estimada, pruebas y decisiones.

## 4. Rotación de secretos
Incluye BREVO_API_KEY, TURNSTILE_SECRET_KEY, ADMIN_SESSION_SECRET, ADMIN_TOTP_ENCRYPTION_KEY, credenciales de Neon y tokens de despliegue.
1. Identificar nombre, entornos, consumidores y compatibilidad. Nunca imprimir el valor.
2. Crear el reemplazo en el proveedor y actualizarlo en el gestor de secretos correspondiente, como variables de Vercel por entorno. No pegar secretos en GitHub issues, logs o archivos.
3. Si la aplicación admite doble clave o migración, desplegar soporte antes de retirar la anterior. Para cifrado TOTP, seguir el runbook específico.
4. Crear un despliegue no productivo y probar la funcionalidad afectada.
5. Promover por el proceso normal, verificar salud y una operación controlada, y revisar logs sin datos sensibles.
6. Revocar la clave anterior solo tras comprobar el uso de la nueva. Ante compromiso activo, priorizar revocación inmediata con contingencia.
7. Si una clave pudo estar en Git, revocarla primero; borrar el archivo no elimina el historial.

## 5. Comprobación posterior al incidente
- Revisar cabeceras y /api/health.
- Probar login, 2FA, cierre/revocación, formulario y Brevo con datos de prueba.
- Confirmar que CI, monitor y alertas disponibles están activos.
- Verificar que logs no contienen secretos, mensajes, contraseñas, códigos TOTP ni URLs de conexión.
- Actualizar THREAT_MODEL.md, SECURITY.md y los ADR afectados.
