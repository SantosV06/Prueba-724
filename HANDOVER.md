# Entrega técnica de Prueba-724

Este procedimiento permite a un equipo técnico desplegar una copia autorizada o asumir la operación existente. Las guías describen capacidades del código; no certifican por sí solas el estado de las cuentas de GitHub, Vercel o Neon.

## 1. Elegir el tipo de entrega

| Escenario                 | Datos y autenticación                                                                                         | Configuración                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Instalación independiente | Base Neon vacía, nuevo propietario y nuevas inscripciones 2FA. No incluye solicitudes ni usuarios existentes. | Proyecto Vercel y secretos nuevos; seguir la guía integral.                                             |
| Continuidad del servicio  | Se conservan solicitudes, cuentas, hashes, factores cifrados, auditoría, portada y preferencias de la base.   | Transferir accesos autorizados o restaurar una copia completa; conservar la clave TOTP correspondiente. |

Copiar Git no copia Neon ni los secretos de Vercel. `ADMIN_PASSWORD` solo crea el propietario cuando no hay cuentas; cambiarla no restablece usuarios existentes. El panel usa autenticación propia en `volunteer-service.server.ts`, no requiere activar el sistema alternativo de Better Auth del generador ni copiar `migrations/auth/` a la raíz.

## 2. Instalación independiente

1. Obtener autorización de los titulares del código, contenido, fotografías y marcas. El repositorio no incluye una licencia general de redistribución; este documento no concede una.
2. Copiar el repositorio a la cuenta acordada. Registrar el SHA de origen y quién mantendrá la copia. Las instrucciones de importación deben apuntar a esa copia.
3. Seguir [GUIA_INSTALACION_COMPLETA.md](GUIA_INSTALACION_COMPLETA.md): Node 24.x, npm 11.9.0, raíz del repositorio, `npm run build`, Neon pooled con SSL y secretos distintos para Production/Preview.
4. Configurar `SITE_URL` con el nuevo dominio. Ajustar `MONITOR_SITE_URL` en GitHub → Settings → Secrets and variables → Actions → Variables; de lo contrario el monitor conserva el dominio original.
5. Revisar contenido institucional, enlaces de contacto, documentos públicos y destinos de donación con sus responsables. No convertir instrucciones Zelle en un supuesto procesador de pagos.
6. Crear el propietario, activar su 2FA, custodiar códigos y clave de cifrado y crear cuentas individuales. Decidir si se exige 2FA al equipo.
7. Ejecutar la aceptación del apartado 5 con datos ficticios y una rama Neon de prueba.

## 3. Continuidad y transferencia de datos

1. Designar un responsable del cambio, custodio de secretos y operador de recuperación. Registrar commit/despliegue, dominio, proyecto Vercel, rama/base Neon, punto de restauración y recuentos esperados. No incluir conexiones ni datos personales en ese registro.
2. Crear una rama restaurada aislada antes de cambiar el servicio activo. Transferir el esquema y datos completos; el CSV del panel no contiene cuentas, factores ni auditoría. Para trasladar entre proyectos Neon, el operador debe seguir las herramientas oficiales de exportación/restauración y comprobar restricciones, triggers e historial `_migrations` en el destino.
3. Entregar secretos por un gestor seguro, nunca Git, Issues o correo sin protección. Conservar `ADMIN_TOTP_ENCRYPTION_KEY` para descifrar factores existentes. Si no puede conservarse, planificar reinscripción y recuperación controlada; sustituirla directamente bloquearía a usuarios inscritos.
4. Rotar `ADMIN_SESSION_SECRET` al asumir la operación para cerrar sesiones anteriores. Restablecer las contraseñas temporales de entrega. Rotar credenciales Neon con un plan que actualice Vercel y permita verificar el nuevo despliegue antes de retirar el acceso antiguo.
5. Preparar un Preview con la rama restaurada, secretos propios y `PREVIEW_DATABASE_ISOLATED=true` solo tras comprobar aislamiento. Ejecutar `npm run db:verify` con la conexión y clave de esa rama; comparar recuentos y comprobar login/2FA.
6. Acordar una ventana de cambio que evite escrituras en dos bases independientes. Documentar cómo se incluyen las solicitudes recibidas desde la copia inicial hasta el corte. No publicar dos sitios que crean registrar en la misma fuente si sus bases divergen.
7. Cambiar dominio/configuración únicamente tras la aceptación. Retirar accesos del equipo saliente según lo acordado y revisar despliegues antiguos que conservan credenciales. Una restauración o un cambio de dominio no los desactiva automáticamente.

La vuelta atrás debe contemplar datos y código: registrar dominio y despliegue anterior, ventana de recuperación y responsable. Restaurar funciones antiguas no revierte migraciones; comprobar compatibilidad antes de promover un despliegue anterior. No sobrescribir una base que ya recibió datos nuevos sin reconciliarlos.

## 4. Protección de main en GitHub

Esta configuración se realiza en GitHub y no se activa al copiar un archivo del repositorio. Un administrador debe aplicarla a cada copia. Recomendación para este proyecto con un único propietario:

1. Abrir Settings → Rules → Rulesets → New branch ruleset. Nombre `main-protegida`, estado Active y objetivo la rama `main`.
2. Bloquear eliminación y force pushes; exigir un pull request antes de integrar cambios.
3. Exigir el status check `validate` de GitHub Actions y que la rama esté actualizada antes de integrar. Seleccionarlo tras una ejecución exitosa de `.github/workflows/ci.yml`; confirmar el nombre observado en Checks. No exigir el monitor horario de disponibilidad para integrar código.
4. Exigir resolución de conversaciones. Con una sola persona, no exigir aprobación de otro revisor que no existe. Cuando se incorpore el equipo externo, definir al menos un revisor y retirar aprobaciones antiguas tras nuevos commits si encaja con el equipo.
5. Definir un responsable de emergencia para excepciones, preferiblemente con bypass limitado a PR y registro del motivo. No dar bypass a todo colaborador por defecto.
6. Comprobar la regla con una rama/PR de prueba sin modificar producción. Registrar quién la activó y fecha; no afirmar que está activa solo porque existe esta guía.

## 5. Aceptación funcional

Realizar las mutaciones en una rama Neon desechable, nunca ejecutar E2E de escritura sobre producción.

| Comprobación             | Resultado esperado                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalación limpia       | `npm ci --include=dev` y `npm run build` finalizan; las ocho migraciones de la raíz quedan aplicadas en la base elegida.                                  |
| Configuración incorrecta | Production rechaza conexión o clave TOTP inválidas, sin imprimir valores privados.                                                                        |
| Páginas e idiomas        | Navegación móvil/escritorio, imágenes, videos y ES/EN/PT funcionan; canónicas y sitemap apuntan al dominio nuevo.                                         |
| Formulario               | Solicitud ficticia aparece una sola vez, incluso al reintentar con la misma clave.                                                                        |
| Acceso                   | Contraseña incorrecta rechazada y `login:failure` visible al propietario sin usuario/datos del intento. Solicitar el segundo factor no cuenta como fallo. |
| Sesiones                 | Cerrar sesión o cambiar contraseña invalida la cookie anterior.                                                                                           |
| Permisos                 | Administrador puede gestionar solicitudes; no administrar cuentas, política o borrado definitivo.                                                         |
| 2FA                      | Inscripción, siguiente código, recuperación de un solo uso y rechazo de prueba reutilizada. Política obligatoria restringe cuentas sin factor.            |
| Gestión                  | Búsqueda, estados, papelera, restauración y CSV funcionan; operaciones quedan auditadas.                                                                  |
| Contenido                | Portada e idioma predeterminado persisten al reiniciar/republicar porque viven en Neon.                                                                   |
| Restauración             | `db:verify` correcto, recuentos comparados y login/2FA comprobados en rama restaurada.                                                                    |
| Operación                | Responsable recibe notificación de un fallo controlado del monitor y conoce recuperación y retención.                                                     |

Para QA local: seguir `.github/workflows/ci.yml`; usa credenciales ficticias. Ejecutar `npm run check`, `npm run build`, `npm run test:postgres` con PostgreSQL local desechable y `npm run test:e2e` contra desarrollo y compilación. Los recursos externos excluidos de las pruebas de navegador deben verificarse por separado antes de aceptar la entrega.

## 6. Restauración, rendimiento y seguimiento

El ensayo detallado está en [OPERATIONS.md](OPERATIONS.md). Registrar fecha/punto restaurado, duración, recuentos esperados/obtenidos, resultado de `db:verify`, login/2FA y responsable. Dejar como **pendiente** hasta ejecutarlo con acceso autorizado a Neon.

Para rendimiento, acordar volumen esperado y umbrales antes de medir. En un entorno aislado equivalente a Production, probar lectura pública, envío de solicitudes ficticias, búsquedas/CSV y concurrencia de logins. Medir latencia p50/p95/p99, errores, conexiones PostgreSQL, memoria y coste; incluir el coste de scrypt. Aumentar carga gradualmente y detener al superar los umbrales acordados. Un smoke local o `/api/health` no demuestra capacidad de producción ni prueba la escritura y autenticación bajo carga.

El monitor de Actions es horario y puede retrasarse. No hay un servicio externo de errores del navegador contratado/configurado. Acordar proveedor, privacidad y presupuesto antes de incorporar telemetría adicional. La auditoría de accesos rechazados no envía notificaciones por sí misma.

## 7. Acta de entrega (completar sin secretos)

| Campo                                 | Valor a registrar                                               |
| ------------------------------------- | --------------------------------------------------------------- |
| Responsable que entrega / recibe      | Pendiente                                                       |
| Tipo de entrega y autorización de uso | Pendiente                                                       |
| Commit y despliegue aceptados         | Pendiente                                                       |
| Dominio, proyecto y rama Neon         | Identificadores sin credenciales                                |
| Custodio y ubicación de secretos      | Referencia al gestor, nunca valores                             |
| Pruebas y CI                          | Enlaces y resultado de cada comprobación                        |
| Regla de main                         | Activa / pendiente, responsable y fecha                         |
| Restauración                          | Pendiente / fecha, duración y resultado                         |
| Capacidad medida                      | Pendiente / entorno, carga, umbrales y resultados               |
| Monitor y alertas                     | Responsable y prueba de recepción                               |
| Recuperación y ventana de cambio      | Responsable, plan y resultado                                   |
| Pendientes aceptados                  | Aceptación/configuración de Brevo, pagos, licencia/permisos y otras decisiones aplicables |

No completar estos campos con supuestos. La entrega se acepta cuando ambas partes revisan la evidencia y los pendientes.
