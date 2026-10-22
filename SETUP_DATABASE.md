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

1. Conserva `DATABASE_URL`, `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` en Vercel → Settings → Environment Variables → Production. **No necesitas añadir nuevas variables ni crear tablas a mano en Neon.**
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
