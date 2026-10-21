# Vercel + Neon: configuración y operación

La web guarda las solicitudes en PostgreSQL y las administra en `/solicitudes`.
No guardes contraseñas ni cadenas de conexión en GitHub. No uses prefijos `VITE_` para secretos.

## Producción

En Vercel → proyecto **prueba-724** → **Settings → Environment Variables**, revisa en **Production**:

| Variable               | Configuración                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Conexión pooled de Neon; hostname con `-pooler` y `sslmode=require`                               |
| `ADMIN_PASSWORD`       | Contraseña de 14–256 caracteres                                                                   |
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
- Exportación de **todos los resultados filtrados**, por lotes de 500 con cursor. No existe el límite anterior de 1000. La exportación fija la fecha máxima de creación al iniciarse; cambios de estado/papelera concurrentes pueden afectar lo incluido.
- CSV con BOM UTF-8, comillas y neutralización de fórmulas para hojas de cálculo.
- Mover a papelera no borra la solicitud: se puede restaurar desde el panel.
- `admin_events` registra cambios de estado, papelera y restauración, sin duplicar los datos personales.
- Sesiones aleatorias de 8 horas almacenadas como hash; cierre de sesión revocado en el servidor. Cambiar la contraseña o el secreto invalida las sesiones previas.
- Una credencial administrativa compartida; no hay cuentas individuales ni atribución a distintas personas.
- Límites: 5 solicitudes/hora/IP y 8 accesos/15 minutos/IP. Redes compartidas pueden compartir el límite. Sesiones expiradas y claves de límite antiguas se limpian al recibir envíos o accesos.
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
- Si otras personas van a administrar, planificar cuentas individuales con roles y segundo factor.
- Si se desean correos de confirmación o pagos integrados, elegir proveedor y configurar dominio/cuenta; no activar envíos ni cobros sin esa configuración.

Los registros de antiguos navegadores en localStorage no se migran automáticamente. Conserva sus exportaciones por separado.
