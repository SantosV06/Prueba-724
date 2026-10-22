# Vercel + Neon: configuración y operación

La web guarda las solicitudes en PostgreSQL y las administra en `/solicitudes`.
No guardes contraseñas ni cadenas de conexión en GitHub. No uses prefijos `VITE_` para secretos.

## Producción

En Vercel → proyecto **prueba-724** → **Settings → Environment Variables**, revisa en **Production**:

| Variable               | Configuración                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Conexión pooled de Neon; hostname con `-pooler` y `sslmode=require`                               |
| `ADMIN_PASSWORD`       | Contraseña inicial del propietario: 14–256 caracteres                                             |
| `ADMIN_SESSION_SECRET` | Secreto aleatorio de al menos 32 caracteres                                                       |
| `SITE_URL`             | Opcional: origen HTTPS del dominio definitivo, sin rutas; por ejemplo `https://www.tudominio.org` |

Conserva las tres variables existentes si ya cumplen estos requisitos. `SITE_URL` configura canónicas y sitemap; sin ella se usa `VERCEL_PROJECT_PRODUCTION_URL` cuando Vercel lo proporciona. Los secretos se configuran como Secret y nunca se comparten por chat.

Vercel instala con `npm ci` y Node 24. `npm run build` comprueba tipos, lint y pruebas antes de compilar y migrar. En producción, una configuración ausente o inválida detiene el despliegue. No cambies el comando de build por `build:dev`.

Las migraciones son aditivas: los registros anteriores permanecen, con estado `pendiente`. Se aplican en una transacción con bloqueo de coordinación entre despliegues. Nunca edites un archivo SQL ya aplicado; añade uno nuevo. El cambio de sesiones requiere iniciar sesión otra vez; las cookies anteriores no se aceptan.

## Preview: evitar cambios en la base real

Por defecto las vistas previas muestran la web, pero **no ejecutan migraciones ni permiten usar el formulario o el panel**. Esto impide que una rama de prueba modifique la base real por una variable heredada.

Para activar datos en Preview:

1. Neon → proyecto → **Branches**: crea una rama de pruebas. Si necesitas evitar copias de datos personales, elige una rama de esquema solamente cuando esté disponible o una base separada vacía.
2. En la integración Neon–Vercel, comprueba a qué rama apunta cada ambiente. Copia la conexión **pooled de pruebas** a `DATABASE_URL`, con ámbito **Preview**. Nunca reutilices la conexión de producción.
3. Define `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` de pruebas en **Preview**, distintos de los de producción.
4. Solo después de verificar esa separación, añade `PREVIEW_DATABASE_ISOLATED=true` en **Preview** y vuelve a desplegar esa rama.

La variable es una confirmación operativa, no una detección automática: el código no puede comparar la conexión con secretos de otros ambientes. Los robots de las vistas previas reciben `Disallow: /`.

## Panel y seguridad

- Lista de 50 registros por página, búsqueda literal y filtros por estado.
- Estados: pendiente, contactada, aceptada y descartada.
- Exportación de **todos los resultados filtrados**, por lotes de 500 con cursor. No existe el límite anterior de 1000. La exportación comprueba una revisión compartida de los datos en cada lote: si hay cambios concurrentes, se cancela y solicita repetirla. El navegador genera el CSV por fragmentos y limita cada archivo a 25 MB; usa filtros para conjuntos mayores.
- CSV con BOM UTF-8, comillas y neutralización de fórmulas para hojas de cálculo.
- Mover a papelera no borra la solicitud: se puede restaurar desde el panel.
- `admin_events` registra identidad del usuario y valores anterior/nuevo del estado y la papelera. Los eventos anteriores a las cuentas no tienen identidad atribuida. También registra creación de cuentas, cambios de contraseña y acceso, sin almacenar contraseñas.
- Cada lote de exportación se solicita por POST y registra `export:batch` antes de entregar datos. El registro contiene usuario, fecha, identificador compartido de exportación, cantidad de filas, estado, papelera, revisión y si hubo búsqueda; no conserva el texto buscado ni copia datos de voluntarios. Si falla la auditoría, se cancela la entrega de ese lote. El evento acredita entrega desde el servidor, no que el archivo se haya guardado en el dispositivo; una exportación cancelada puede tener lotes anteriores registrados.
- Sesiones aleatorias de 8 horas almacenadas como hash; cierre de sesión revocado en el servidor. Cambiar una contraseña o desactivar una cuenta invalida sus sesiones; cambiar `ADMIN_SESSION_SECRET` invalida todas. Cambiar `ADMIN_PASSWORD` tras la creación inicial no cambia la contraseña almacenada.
- Cuentas individuales: un propietario administra usuarios y los administradores gestionan solicitudes. Contraseñas con scrypt y sal aleatoria; nunca se pueden consultar. No incluye segundo factor.
- Límites: 60 solicitudes/hora/IP y 5/hora/correo; 60 accesos/15 minutos/IP y 8/15 minutos/usuario. Las claves se guardan como HMAC. Se reducen los bloqueos de redes compartidas, aunque siguen existiendo límites comunes de IP. Sesiones expiradas y claves de límite antiguas se limpian al recibir envíos o accesos.
- Las solicitudes reintentadas conservan una clave aleatoria para evitar duplicados por fallos de red.
- No se envían correos automáticos ni se procesan pagos: Zelle sigue siendo un canal externo.

## Verificación después de publicar

1. Vercel → Deployments: comprueba que el despliegue de `main` termine en **Ready**.
2. Envía una solicitud de prueba en `/voluntariado`.
3. Inicia sesión en `/solicitudes`, busca la solicitud y cambia su estado.
4. Exporta CSV; mueve la solicitud a papelera y restáurala. Cierra sesión.
5. En Neon → SQL Editor puedes consultar `SELECT COUNT(*) FROM volunteer_requests WHERE deleted_at IS NULL;` y las migraciones con `SELECT name FROM _migrations ORDER BY name;`.

## Ajustes que requieren al propietario

- Neon: verificar región cercana a la función, capacidad del plan, restauración y periodo de historial disponible; probar la recuperación con una rama de pruebas.
- GitHub → Settings → Rules → Rulesets: proteger `main` y exigir el check **Validate application / validate**. El workflow viene incluido, pero la protección es una configuración de la cuenta.
- Vercel: revisar región de funciones y configuración de acceso a vistas previas. No proporcionar credenciales al workflow de validación: no las necesita.
- Definir la política de conservación y borrado definitivo de datos. La papelera no se purga automáticamente y la política debe acordarse antes de automatizar eliminaciones.
- Si se necesita segundo factor o varios propietarios, planificar esa ampliación. No existe registro público de administradores.
- Si se desean correos de confirmación o pagos integrados, elegir proveedor y configurar dominio/cuenta; no activar envíos ni cobros sin esa configuración.

Los registros de antiguos navegadores en localStorage no se migran automáticamente. Conserva sus exportaciones por separado.

## Primer acceso y creación de usuarios

1. Conserva `DATABASE_URL`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` en Vercel → Settings → Environment Variables → Production. Para 2FA añade también `ADMIN_TOTP_ENCRYPTION_KEY` como se indica más abajo. No crees tablas a mano en Neon.
2. Espera a que el despliegue de `main` esté **Ready**. El build aplica `0003_admin_accounts.sql` y `0004_export_revision.sql` automáticamente; conserva las solicitudes y cierra las sesiones antiguas.
3. Abre `/solicitudes`. Usuario: **`admin`**. Contraseña: el valor actual de **`ADMIN_PASSWORD`**. El primer acceso correcto crea la única cuenta **Propietario**. Esa variable deja de servir como acceso alternativo una vez creada la cuenta.
4. Pulsa **Administrar usuarios**. Introduce nombre, usuario (3–50 caracteres: letras, números, punto, guion o guion bajo) y una contraseña de al menos **14 caracteres**. Pulsa **Crear usuario**.
5. Entrega las credenciales a cada persona por un canal privado. Cada una entra en `/solicitudes` con su propio usuario y contraseña. No necesita cuenta en Neon ni Vercel.
6. El propietario puede **Cambiar contraseña**, **Desactivar** y **Activar**. Esas operaciones cierran las sesiones anteriores de esa cuenta. El propietario no puede desactivarse a sí mismo.
7. Para cambiar la contraseña del propietario, usa **Cambiar contraseña de admin** en el panel. Se cerrará tu sesión; vuelve a entrar con la nueva. Guarda esa contraseña en un gestor: `ADMIN_PASSWORD` ya no la restablece. Si se pierde el acceso del propietario, requiere recuperación por alguien con acceso autorizado a la base, no existe un acceso secreto alternativo.

Los administradores nuevos pueden gestionar solicitudes, exportar CSV, mover a papelera y restaurar. Solo el propietario puede gestionar cuentas o **Eliminar definitivamente** solicitudes que ya están en la papelera. El borrado requiere confirmación y elimina los campos personales de la tabla activa; no elimina exportaciones descargadas ni copias de seguridad de Neon. No hay purga automática: aún debe definirse el periodo de conservación.

## Pruebas y código activo

GitHub Actions ejecuta tipos, lint, pruebas con PGLite y compilación. También comprueba con Chromium los flujos de desarrollo y de la compilación: formulario → base desechable → acceso del propietario → cuentas nuevas → CSV → estados → papelera/restauración → cierre de sesión. Usa credenciales públicas de prueba y no recibe secretos de producción.

`E2E_LOCAL_DATABASE=true` permite verificar la compilación de producción sobre PGLite únicamente fuera de Vercel. **No configures esa variable en Vercel.** El acceso a Neon en Production sigue siendo obligatorio.

La implementación activa usa `src/lib/volunteer-functions.ts`, `volunteer-service.server.ts`, `admin-accounts.ts` y `password.server.ts`. `foundation-vne/` es un archivo histórico de la versión Cloudflare, no forma parte del despliegue actual en Vercel. Se eliminaron las funciones locales de almacenamiento de voluntarios sin uso; `volunteers.ts` solo contiene los tipos y el generador CSV.

## Recuperación del propietario

Si un administrador olvida su contraseña, el propietario puede restablecerla en **Administrar usuarios**. Una contraseña ya creada no se puede consultar. Cambiar `ADMIN_PASSWORD` en Vercel **no restablece una cuenta existente**: esa variable solo sirve para crear al primer propietario.

Si el propietario pierde su contraseña, una persona con acceso autorizado a Neon puede ejecutar la herramienta de recuperación desde una terminal privada con Node 24 y las dependencias instaladas:

1. Configura `DATABASE_URL` como variable de entorno privada en esa terminal, usando la conexión correcta de Neon con SSL. No la pegues en chats, commits ni capturas. No uses una base de pruebas para recuperar una cuenta de producción.
2. Ejecuta `npm run admin:recover -- admin` (sustituye `admin` si el propietario tiene otro usuario).
3. Introduce dos veces una contraseña nueva de 14 a 256 caracteres. La entrada no se muestra y no se pasa como argumento del proceso.
4. Inicia sesión en `/solicitudes`. La recuperación revoca todas las sesiones anteriores de esa cuenta y registra `account:recovery` en la auditoría.
5. Elimina `DATABASE_URL` del entorno de la terminal al terminar.

La herramienta solo recupera propietarios activos existentes; no crea cuentas, no habilita usuarios desactivados y no borra solicitudes. No se expone como una ruta pública.

## Controles operativos fuera del código

- Activa segundo factor en GitHub, Vercel y Neon para proteger las cuentas que controlan el proyecto. El panel propio usa contraseña; no incorpora un segundo factor en esta revisión.
- En Neon, comprueba la ventana de restauración disponible en tu plan y ensaya una restauración en una rama independiente antes de necesitarla. Un archivo CSV no reemplaza un respaldo de la base de datos.
- Usa una credencial de migraciones para cambios de esquema y una cuenta de ejecución con los permisos mínimos necesarios para las tablas de la aplicación. Nunca publiques las cadenas de conexión.
- Las vistas previas deben usar su propia rama de Neon; `PREVIEW_DATABASE_ISOLATED=true` es una declaración de configuración, no crea por sí sola esa separación.
- Verifica la dirección institucional, teléfonos y destinatario de Zelle con documentación de la organización antes de modificarlos en `src/data/site.ts`.

La CSP restringe recursos, conexiones, formularios e incrustaciones a orígenes permitidos. Bloquea manejadores JavaScript en atributos HTML (`script-src-attr 'none'`) y elementos `base` (`base-uri 'none'`). Conserva `unsafe-inline` para los scripts de hidratación y la inicialización del tema; no debe presentarse como una protección completa frente a XSS. No autoriza `unsafe-eval`. Sustituir los scripts inline por nonces o hashes requiere una adaptación coordinada del renderizado y de los scripts de plataforma.

Para consultar las entregas CSV en Neon sin mostrar datos de voluntarios:

```sql
SELECT created_at, actor_username,
       after_value->>'exportId' AS export_id,
       (after_value->>'rowCount')::integer AS filas,
       after_value->>'status' AS estado,
       after_value->>'trash' AS papelera,
       after_value->>'searchApplied' AS con_busqueda,
       after_value->>'lastBatch' AS ultimo_lote
FROM admin_events
WHERE action = 'export:batch'
ORDER BY created_at DESC;
```

No se requieren nuevas variables ni tablas para estos eventos. La política de conservación debe contemplar también la auditoría, las copias de seguridad y los archivos descargados: borrar una solicitud no elimina esas copias. No se automatiza una purga hasta que la organización defina el periodo y las excepciones aplicables.

## Segundo factor TOTP del panel

No requiere APIs de pago, SMS ni correos. Cada administrador (incluido el propietario) debe activarlo en su propia cuenta. No se activa automáticamente para las cuentas existentes.

### Configuración del operador en Vercel

1. Genera una clave de cifrado con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` en una terminal privada.
2. En el proyecto Vercel → Settings → Environment Variables añade **`ADMIN_TOTP_ENCRYPTION_KEY`**, tipo **Sensitive**, entorno **Production**, con ese valor. Nunca uses el prefijo `VITE_` ni lo publiques en GitHub o chats. Es independiente de `ADMIN_SESSION_SECRET`.
3. Guarda una copia privada y segura. No cambies esta clave arbitrariamente: cifra los secretos TOTP mediante AES-256-GCM; perderla impide verificar los autenticadores existentes. Para rotarla se requiere un procedimiento de recifrado o recuperación de las cuentas.
4. Despliega el código. El build aplica `0005_admin_totp.sql` y `0006_admin_session_guard.sql` automáticamente sin borrar solicitudes. La aplicación sigue admitiendo cuentas sin 2FA mientras se configuran.
5. Para Preview usa una clave distinta, además de una rama Neon aislada y `PREVIEW_DATABASE_ISOLATED=true`. Nunca copies los secretos de producción a una vista previa.

### Activación por cada administrador

1. Inicia sesión en `/solicitudes` y abre **Seguridad de mi cuenta · 2FA**.
2. Introduce tu contraseña actual y pulsa **Configurar autenticador**.
3. Escanea el QR con una app TOTP, o introduce la clave manualmente desde el mismo teléfono. El QR se genera en el servidor, sin enviar el secreto a servicios de terceros. La configuración pendiente caduca a los 10 minutos y no activa 2FA por sí sola.
4. Introduce un código de seis dígitos y confirma. Se revocan todas tus sesiones.
5. Guarda los diez códigos de recuperación: se muestran una sola vez, permanecen únicamente en memoria de esa pantalla y se almacenan como hashes en la base de datos. Confirma que los guardaste antes de volver al login.
6. Vuelve a entrar con usuario y contraseña, y después un código del autenticador o de recuperación. El código usado para activar 2FA ya está consumido: espera al siguiente código de tu app.

Los códigos TOTP duran 30 segundos, con tolerancia de un intervalo a cada lado. Cada intervalo aceptado se consume atómicamente junto con la creación de sesión; un código de recuperación también se consume una sola vez. Hay límites de intentos por conexión y, tras verificar la contraseña, por cuenta. La base de datos rechaza la creación de sesiones con una versión de seguridad antigua, incluso desde versiones anteriores del panel que omitan el segundo factor. Un cambio de versión revoca las sesiones también mediante un trigger. Las altas y bajas de 2FA, los accesos y el uso de recuperación quedan auditados sin secretos. El cambio de contraseña no desactiva 2FA. Para desactivarlo se necesita contraseña y un código TOTP nuevo o un código de recuperación sin utilizar; todas las sesiones y códigos de recuperación se invalidan. Para renovar los códigos, desactiva y vuelve a activar 2FA con tu autenticador disponible.

### Pérdida del autenticador

Usa un código de recuperación para iniciar sesión. Esto no desactiva 2FA. En Seguridad de mi cuenta puedes desactivarlo con tu contraseña y **otro** código de recuperación sin utilizar, y volver a configurarlo con un autenticador nuevo. Si conservas la clave del autenticador, también puedes restaurarlo en una app nueva. Si pierdes todos los medios de recuperación, requiere intervención del operador; el propietario del panel no puede desactivar 2FA de otro administrador mediante la interfaz.

Solo para el propietario activo, un operador con acceso directo y privado a `DATABASE_URL` de Neon puede ejecutar:

```bash
npm run admin:recover -- admin --reset-2fa
```

El script pide una nueva contraseña de forma oculta, borra el segundo factor y los códigos, aumenta su versión de seguridad, revoca sesiones y registra `account:recovery` con `resetTwoFactor: true`, todo en una transacción. Después entra y configura de nuevo 2FA. Sin `--reset-2fa`, el script cambia la contraseña y conserva el segundo factor. No existe endpoint web de recuperación ni contraseña de entorno que omita 2FA. Para otras cuentas sin medios de recuperación, el operador debe verificar la identidad antes de un restablecimiento controlado en la base de datos; no compartas cuentas ni crees accesos provisionales que salten el segundo factor.
