# Operación y recuperación

## Panel y permisos

`/solicitudes` permite revisar solicitudes con filtros y paginación de 50 registros. Los estados internos son `pendiente`, `contactada`, `aceptada` y `descartada`; las etiquetas se traducen sin cambiar los valores guardados. Pasar una solicitud a `aceptada` o `descartada` intenta avisar por correo al voluntario. `contactada`, guardar el mismo estado, la papelera y la restauración no envían correo.

El CSV usa lotes de 500 registros, neutraliza fórmulas de hojas de cálculo y cancela si los datos cambian durante la exportación. Cada lote entregado por el servidor queda auditado; el registro no demuestra que se haya guardado un archivo en el dispositivo. El navegador limita el resultado a 25 MB: filtra exportaciones mayores.

Los administradores pueden consultar, exportar, actualizar estados, mover a papelera y restaurar. Solo el propietario administra cuentas, elimina definitivamente solicitudes en papelera, cambia la política de 2FA, consulta el visor de auditoría y edita la portada.

## Herramientas del propietario

- **Seguridad del equipo:** muestra cuentas activas/protegidas y permite exigir 2FA después de proteger la cuenta del propietario. No puedes desactivar tu factor mientras se exija al equipo.
- **Historial de actividad:** filtro exacto de usuario y acción, 25 eventos por página, orden estable por fecha/ID. Ejemplos de acción: `login:success`, `login:failure`, `login:recovery-code`, `export:batch`, `account:create`, `account:recovery`, `security:2fa-policy`, `content:home`, `settings:language`, `status:aceptada`, `status:descartada`, `retention:purge`. `login:failure` no tiene responsable asignado: filtra por acción y deja el usuario vacío para verlo. Muestra fecha, responsable, acción e identificador de solicitud; no expone los JSON internos.
- **Editar portada:** título e introducción en español, inglés y portugués. Cada versión debe completarse. Se guarda texto simple, nunca HTML. Una revisión evita que una edición antigua sobrescriba otra. Si hay conflicto, vuelve a cargar y revisa los cambios. Los nuevos textos aparecen al recargar el inicio.

Los metadatos SEO y las demás secciones siguen mantenidos en el repositorio. El editor no permite cambiar datos bancarios, documentos legales, multimedia ni el resto del contenido institucional.

## Disponibilidad y avisos

`/api/health` ejecuta `SELECT require_two_factor FROM admin_policy WHERE id=1` y devuelve solo `{"status":"ok"}` (HTTP 200) o `{"status":"unavailable"}` (HTTP 503). Reutiliza esa comprobación 15 segundos. No informa recuentos, credenciales, versiones o contenido personal. No equivale a enviar un formulario ni comprueba Turnstile o Brevo.

`.github/workflows/availability.yml` consulta inicio y salud aproximadamente cada hora (`17 * * * *`) y también permite **Run workflow**. Si el idioma predeterminado guardado no es español, la portada responde con un único redirect mismo origen a `?lang=es`, `?lang=en` o `?lang=pt`; el monitor sigue solo ese salto y exige el texto «Fundación VNE». Cualquier otro redirect (otro host, otra ruta o un segundo salto) es un fallo. `/api/health` no debe redirigir y su JSON debe ser `{"status":"ok"}`. Usa la variable de Actions `MONITOR_SITE_URL` como origen HTTPS final, sin salto entre apex y `www`; si no está definida, el workflow usa `https://prueba-724.vercel.app`. Los fallos aparecen como ejecuciones fallidas. El propietario debe habilitar y comprobar las notificaciones de GitHub Actions en su cuenta; no hay Slack, SMTP ni proveedor de alertas configurado.

El horario de GitHub puede retrasarse. Para avisos inmediatos o una garantía contractual necesitas un monitor externo independiente. Analytics y Speed Insights ayudan con uso/rendimiento, pero no sustituyen monitorización de errores del frontend. Los fallos de salud y de lectura del contenido público emiten eventos genéricos sin datos personales en los logs de Vercel.

## Correo transaccional con Brevo

El código intenta enviar dos mensajes solo después de crear una solicitud nueva: confirmación de recepción al voluntario y aviso al buzón interno. Un reintento con la misma clave idempotente no debe duplicar la solicitud ni esos dos correos. El mensaje personal del formulario no se incluye en el aviso interno. Esos dos envíos exigen `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `VOLUNTEER_NOTIFICATION_EMAIL`. Si falta alguna o Brevo falla, la solicitud guardada sigue siendo válida; el log contiene solo un evento genérico de omisión o fallo, no la API key ni datos personales.

Cuando el estado guardado pasa a `aceptada` o `descartada`, `notifyVolunteerStatus` en `src/lib/brevo-email.server.ts` intenta avisar solo al voluntario. Ese aviso usa `BREVO_API_KEY` y `BREVO_SENDER_EMAIL`; no exige `VOLUNTEER_NOTIFICATION_EMAIL`. No se envía para `contactada`, si el estado no cambia, ni al mover a papelera o restaurar. El estado y su evento de auditoría ya están escritos antes del intento: un fallo de correo no los revierte.

Antes de habilitar un entorno:

1. Sigue [BREVO_SETUP.md](BREVO_SETUP.md) para autenticar el dominio y comprobar SPF/DKIM/DMARC según la configuración de Brevo.
2. Para que el formulario funcione, configura `VITE_TURNSTILE_SITE_KEY` como clave pública del cliente y `TURNSTILE_SECRET_KEY` como secreto del servidor. Deben corresponder al mismo widget y hostname.
3. Para los correos, configura `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `VOLUNTEER_NOTIFICATION_EMAIL`; `BREVO_SENDER_NAME` es opcional. `SITE_URL` debe ser el origen HTTPS público correcto.
4. En Vercel, asigna cada variable al entorno apropiado (Production/Preview/Development) y crea un nuevo despliegue después de los cambios. No uses prefijo `VITE_` en claves privadas.
5. En Preview, confirma que la base está aislada antes de `PREVIEW_DATABASE_ISOLATED=true`. Usa destinatarios controlados y no apuntes Preview a Production.
6. Ejecuta `npm run check` y `npm run build`; las pruebas unitarias simulan Brevo y no envían mensajes reales.
7. Para aceptación real, envía una solicitud de prueba con datos ficticios, verifica que se guarda una vez y comprueba por separado la confirmación y el aviso interno. En una copia aislada, cambia esa solicitud a `aceptada` o `descartada` y comprueba el aviso al voluntario; `contactada` no debe generarlo. La idempotencia y el comportamiento ante fallo requieren pruebas específicas y autorizadas.

El responsable del proyecto confirmó una prueba real en Production: el formulario guardó correctamente la solicitud y llegó al menos un correo. Esto valida ese recorrido concreto, no la entrega de ambos mensajes de alta, el aviso de cambio de estado ni la idempotencia. La ausencia de errores en CI no demuestra que el remitente esté autenticado ni que Brevo entregue mensajes. Consulta [BREVO_SETUP.md](BREVO_SETUP.md) para el procedimiento completo.

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
- Si el propietario pierde todos sus medios de acceso, un operador con conexión privada a Neon ejecuta `npm run admin:recover -- admin`. La contraseña se introduce oculta; nunca por argumentos. El script cambia la contraseña del propietario activo, borra sus sesiones y registra `account:recovery` en una transacción. Conserva el factor y los códigos de recuperación.
- Solo para pérdida del factor también: `npm run admin:recover -- admin --reset-2fa`. Hace lo anterior y, en la misma transacción, retira el factor y los códigos. Después podrá entrar en modo de inscripción si se exige 2FA y deberá configurarlo otra vez.

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
- Verificar la configuración de Brevo y completar una prueba de aceptación autorizada antes de habilitar envíos reales en Production.

## Idioma inicial del sitio

En `/solicitudes`, abre **Herramientas del propietario → Idioma predeterminado**, elige Español, English o Português y guarda. Se almacena en Neon y se registra en auditoría. Solo el propietario puede cambiarlo. Para comprobarlo, abre una ventana privada sin idioma en la URL. Una URL con `lang` o una preferencia guardada tiene prioridad. Si la base no responde se usa español. No requiere nuevas variables. La migración `0008_site_language.sql` se aplica con el despliegue habitual.

Las opciones internas de herramientas se cierran al tocar de nuevo el botón abierto; tocar otra opción abre esa sección.

## Entrega y mantenimiento del repositorio

Consulta [HANDOVER.md](HANDOVER.md) para instalación independiente, transferencia, protección de `main`, ensayo de restauración y aceptación. Los registros de rechazos no incluyen datos del intento y no generan alertas externas por sí mismos.


## Endurecimiento de seguridad y revisión de dependencias

- Las cabeceras base se definen en `vercel.json`: nosniff, política de referente, permisos mínimos, HSTS, COOP, CORP y CSP. HSTS usa un año sin `includeSubDomains`; antes de ampliar el alcance, verifica todos los subdominios y dominios personalizados.
- El middleware de Nitro genera un nonce por respuesta HTML para scripts. La política de estilos todavía contiene `unsafe-inline`; no lo elimines hasta identificar estilos inline/Radix y verificar el renderizado, la hidratación y los flujos E2E.
- `.github/dependabot.yml` solicita actualizaciones semanales de npm y GitHub Actions. `.github/workflows/security-audit.yml` ejecuta `npm audit --audit-level=high` en pull requests, en `main` y los lunes. `.github/workflows/dependency-review.yml` revisa dependencias nuevas solo en pull requests y falla ante severidad alta. `.github/workflows/codeql.yml` analiza Actions, JavaScript/TypeScript y Python en pull requests hacia `main`, en pushes a `main` y los sábados. Una ejecución correcta no demuestra que el código esté libre de vulnerabilidades.
- `npm audit` requiere acceso al registro de npm. Si falla por una vulnerabilidad real, evalúa el paquete afectado, el camino de ejecución y la actualización compatible; no ocultes el fallo con `continue-on-error`.
- `THREAT_MODEL.md`, `docs/adr/` y `OPERATIONS_SECURITY_RUNBOOKS.md` documentan riesgos, decisiones y procedimientos de incidente. Revisa estos documentos cuando cambie autenticación, cifrado, proveedores, almacenamiento o despliegue.
- GitHub Secret Scanning y Push Protection son controles del lado de la cuenta/repositorio y no se activan con un commit normal. El propietario debe comprobar su disponibilidad y activarlos desde **Settings → Security → Code security and analysis**; si el plan no los incluye, configurar un escáner alternativo y documentarlo.

## Comprobaciones pendientes antes de declarar la fase completa

1. Verificar en Preview que HSTS, COOP, CORP, CSP y caché se entregan correctamente y no rompen recursos, navegación ni Turnstile.
2. Revisar el resultado de `npm audit --audit-level=high` y del Dependency Review en GitHub Actions.
3. Ejecutar cobertura de tests y establecer umbrales tras obtener una línea base medible; no fijar un 85 % sin medir módulos y ramas reales.
4. Activar y verificar Secret Scanning/Push Protection, según disponibilidad del repositorio.
5. Configurar y probar alertas externas, observabilidad y aislamiento de base de datos para Preview si el presupuesto y la infraestructura lo permiten.
