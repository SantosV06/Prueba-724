# Operación y recuperación

## Panel y permisos

`/solicitudes` permite revisar solicitudes con filtros y paginación de 50 registros. Los estados internos son `pendiente`, `contactada`, `aceptada` y `descartada`; las etiquetas se traducen sin cambiar los valores guardados. Cambiar el estado no envía un correo.

El CSV usa lotes de 500 registros, neutraliza fórmulas de hojas de cálculo y cancela si los datos cambian durante la exportación. Cada lote entregado por el servidor queda auditado; el registro no demuestra que se haya guardado un archivo en el dispositivo. El navegador limita el resultado a 25 MB: filtra exportaciones mayores.

Los administradores pueden consultar, exportar, actualizar estados, mover a papelera y restaurar. Solo el propietario administra cuentas, elimina definitivamente solicitudes en papelera, cambia la política de 2FA, consulta el visor de auditoría y edita la portada.

## Herramientas del propietario

- **Seguridad del equipo:** muestra cuentas activas/protegidas y permite exigir 2FA después de proteger la cuenta del propietario. No puedes desactivar tu factor mientras se exija al equipo.
- **Historial de actividad:** filtro exacto de usuario y acción, 25 eventos por página, orden estable por fecha/ID. Ejemplos de acción: `login:success`, `export:batch`, `account:create`, `security:2fa-policy`, `content:home`. Muestra fecha, responsable, acción e identificador de solicitud; no expone los JSON internos.
- **Editar portada:** título e introducción en español, inglés y portugués. Cada versión debe completarse. Se guarda texto simple, nunca HTML. Una revisión evita que una edición antigua sobrescriba otra. Si hay conflicto, vuelve a cargar y revisa los cambios. Los nuevos textos aparecen al recargar el inicio.

Los metadatos SEO y las demás secciones siguen mantenidos en el repositorio. El editor no permite cambiar datos bancarios, documentos legales, multimedia ni el resto del contenido institucional.

## Disponibilidad y avisos

`/api/health` comprueba acceso al esquema operativo y devuelve únicamente estado genérico. Mantiene una comprobación compartida durante 15 segundos para evitar consultas innecesarias. No informa recuentos, credenciales, versiones o contenido personal. No equivale a enviar un formulario ni comprueba servicios externos.

`.github/workflows/availability.yml` consulta inicio y salud aproximadamente cada hora y también permite **Run workflow**. Usa `MONITOR_SITE_URL` como variable del repositorio si cambia el dominio; por defecto apunta al dominio actual. Los fallos aparecen como ejecuciones fallidas. El propietario debe habilitar y comprobar las notificaciones de GitHub Actions en su cuenta; no hay Slack, SMTP ni proveedor de alertas configurado.

El horario de GitHub puede retrasarse. Para avisos inmediatos o una garantía contractual necesitas un monitor externo independiente. Analytics y Speed Insights ayudan con uso/rendimiento, pero no sustituyen monitorización de errores del frontend. Los fallos de salud y de lectura del contenido público emiten eventos genéricos sin datos personales en los logs de Vercel.

## Respaldo y ensayo de restauración de Neon

Un CSV no es un respaldo completo: faltan cuentas, factores cifrados, auditoría y esquema. Comprueba en la cuenta Neon la ventana de recuperación y las condiciones de tu plan. Guarda también secretos de cifrado, configuración y acceso del operador en un gestor seguro.

Ensayo recomendado, siempre en una rama independiente:

1. Anota fecha, rama origen, punto de restauración y recuentos esperados de solicitudes/cuentas. No publiques datos personales ni conexiones.
2. Crea una rama de restauración desde el punto elegido siguiendo la interfaz de Neon. No restaures sobre la rama activa para probar.
3. Proporciona en una terminal privada `DATABASE_URL` de la rama restaurada y la clave TOTP correspondiente.
4. Ejecuta `npm run db:verify`. Debe informar `ok: true`, ninguna migración pendiente, recuentos esperados y claves TOTP legibles. No la uses para exponer información en un endpoint web.
5. Si el respaldo es anterior al esquema actual, aplica las migraciones únicamente en esa rama y vuelve a verificar. Un historial de migraciones correcto no demuestra que todos los datos esperados estén presentes: compara los recuentos con el registro del ensayo.
6. Usa un Preview aislado con esa rama para verificar login, factor y lectura de solicitudes. Las mutaciones de prueba solo pertenecen a esa rama.
7. Registra resultado, duración y problemas. Después elimina los datos o la rama de prueba conforme a la política de la organización.

No se afirma que este ensayo esté realizado hasta que el operador lo ejecute y conserve la evidencia. El código no accede a la cuenta de Neon para habilitar respaldos o cambiar su plan.

## Contraseñas y pérdida de autenticador

- Si recuerdas tu contraseña, usa **Cambiar mi contraseña**. Requiere la actual y cierra todas tus sesiones; conserva 2FA.
- Si un administrador olvida su contraseña, el propietario puede restablecerla desde Usuarios. Eso tampoco elimina su factor.
- Si pierdes el autenticador, inicia sesión con un código de recuperación sin utilizar. Para retirarlo, usa la contraseña y otro código sin utilizar. Si la política exige 2FA, el propietario debe coordinar una retirada temporal de la política antes de reconfigurar el factor.
- Si el propietario pierde todos sus medios de acceso, un operador con conexión privada a Neon ejecuta `npm run admin:recover -- admin`. La contraseña se introduce oculta; nunca por argumentos.
- Solo para pérdida del factor también: `npm run admin:recover -- admin --reset-2fa`. Revoca sesiones, elimina factor y códigos y registra `account:recovery` en una transacción. Después podrá entrar en modo de inscripción si se exige 2FA y deberá configurarlo otra vez.

El script solo recupera un propietario activo. Para otras cuentas que pierdan todos sus medios se requiere intervención del operador y verificación de identidad; no hay un bypass web. La contraseña de entorno inicial no recupera cuentas existentes.

## Conservación y eliminación

La organización debe decidir plazos, excepciones y responsables. No hay un plazo aprobado por defecto, ningún cron de borrado ni limpieza automática de solicitudes activas.

1. Configura `DATA_RETENTION_DAYS` con un entero de 30–3650 días en la terminal privada del operador y, si quieres mostrarlo en el panel, en Vercel.
2. `npm run data:retention` solo cuenta solicitudes cuya fecha de entrada en papelera supera el plazo.
3. Revisa el resultado, las excepciones y los respaldos. Para aplicar la política aprobada ejecuta `npm run data:retention -- --apply`.

La eliminación y el evento `retention:purge` se ejecutan atómicamente. Si falla la auditoría, no se borra. No incluye solicitudes activas, auditoría, CSV descargados ni respaldos. Si se restaura una solicitud y se vuelve a enviar a papelera, el plazo empieza desde la nueva entrada. Los registros de auditoría también pueden contener identificadores de administradores: deben tener una política específica antes de automatizar su eliminación.

## Tareas del propietario tras desplegar

- Activar 2FA en su cuenta, custodiar clave y códigos y decidir si se exige al equipo.
- Revisar las notificaciones de Actions y ejecutar manualmente el monitor una vez.
- Realizar el ensayo de restauración y decidir conservación.
- Definir servicio y comportamiento de los correos antes de implementarlos.

## Idioma inicial del sitio

En `/solicitudes`, abre **Herramientas del propietario → Idioma predeterminado**, elige Español, English o Português y guarda. Se almacena en Neon y se registra en auditoría. Solo el propietario puede cambiarlo. Para comprobarlo, abre una ventana privada sin idioma en la URL. Una URL con `lang` o una preferencia guardada tiene prioridad. Si la base no responde se usa español. No requiere nuevas variables. La migración `0008_site_language.sql` se aplica con el despliegue habitual.

Las opciones internas de herramientas se cierran al tocar de nuevo el botón abierto; tocar otra opción abre esa sección.
