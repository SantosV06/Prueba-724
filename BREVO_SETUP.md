# Integración de correo transaccional con Brevo

Esta integración vive en la rama `feat/brevo-volunteer-emails`. No se debe activar en Production hasta revisar y aceptar el pull request.

## Qué hace

- Envía confirmación al correo de la persona después de registrar una solicitud nueva.
- Envía aviso al buzón interno configurado.
- No incluye el mensaje personal en el aviso interno.
- Un reintento con la misma clave de solicitud no vuelve a disparar correos.
- Si falta configuración o Brevo no responde, la solicitud guardada sigue siendo válida. Los logs no deben incluir claves, direcciones ni datos personales.
- Esta primera versión no envía avisos al cambiar el estado de una solicitud ni gestiona recuperación de contraseña.

## Configurar Brevo

1. En Brevo, abre la sección de remitentes/dominios y autentica el dominio que se utilizará para enviar.
2. Publica en el DNS los registros SPF y DKIM que muestre Brevo. No reemplaces un registro SPF existente sin revisar los servicios que ya envían correo desde el dominio.
3. Configura DMARC de acuerdo con la política del dominio y verifica el estado de autenticación en Brevo.
4. En la sección SMTP & API, genera una API key para la API de Brevo. No uses una clave SMTP para esta integración.
5. Guarda la clave en el gestor de secretos de la organización. Nunca la subas al repositorio ni la expongas con el prefijo `VITE_`.

Consulta la documentación oficial de Brevo para autenticar dominios y enviar correo transaccional:
- https://help.brevo.com/hc/en-us/articles/12163873366162-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC
- https://developers.brevo.com/docs/send-a-transactional-email

## Entornos y variables

La aplicación usa PGlite en Preview cuando `DATABASE_URL` no está configurada. PGlite es una base PostgreSQL embebida en memoria: los datos no son persistentes entre reinicios del proceso. Esto es intencional para las pruebas y no debe tratarse como un fallo de conexión a Neon.

Preview puede desactivar o no disponer de algunas integraciones externas. No es necesario habilitar todas las funciones de producción en Preview para validar la lógica de la aplicación. Las pruebas automatizadas de Brevo deben simular la API y nunca enviar mensajes reales.

Cuando se quiera realizar una prueba de aceptación con envío real, usar exclusivamente un entorno controlado autorizado para ello, con una base de datos aislada, destinatarios de prueba que el equipo controle y las variables configuradas en el servidor. No apuntar una prueba a datos de producción ni habilitar envíos reales solo para superar una comprobación de Preview.

Variables requeridas por el módulo de correo:

| Variable | Uso |
| --- | --- |
| `BREVO_API_KEY` | API key privada de Brevo; solo servidor. |
| `BREVO_SENDER_EMAIL` | Dirección remitente autenticada/verificada en Brevo. |
| `BREVO_SENDER_NAME` | Nombre visible del remitente (opcional; valor predeterminado institucional). |
| `VOLUNTEER_NOTIFICATION_EMAIL` | Buzón institucional autorizado para recibir avisos. |
| `SITE_URL` | URL base del sitio; se usa para construir el enlace al panel en el aviso interno. |

Configura las variables únicamente en los entornos donde se haya autorizado el uso de Brevo. Mantén las claves fuera del repositorio y de cualquier variable `VITE_`. Para desarrollo local, usa `.env.local`, que no debe estar versionado; `.env.example` debe contener únicamente nombres y valores vacíos.

## Pruebas y aceptación

### Pruebas automatizadas (sin envío real)

Ejecuta:

```sh
npm run check
npm run build
```

Las pruebas de `src/lib/brevo-email.server.test.ts` simulan la API de Brevo y verifican:
- envío de los dos mensajes y destinatarios correctos;
- escape de contenido HTML y ausencia del mensaje personal en el aviso interno;
- omisión segura cuando falta configuración;
- manejo de respuestas HTTP fallidas y errores de red sin filtrar secretos ni datos personales.

Estas pruebas no demuestran que Brevo haya entregado un correo real; validan el comportamiento del módulo.

### Prueba de aceptación con envío real (separada de CI)

1. Obtener autorización para usar un entorno de integración que tenga Brevo habilitado y una base de datos aislada.
2. Utilizar datos ficticios y direcciones de correo que controle el equipo.
3. Enviar una solicitud nueva y comprobar que se guarda una sola vez y que llegan la confirmación y el aviso interno.
4. Reintentar con la misma clave de solicitud y verificar que no se envía un segundo par de correos.
5. Verificar el comportamiento ante un fallo de Brevo: la solicitud guardada debe seguir siendo válida.
6. Revisar logs sin registrar API keys, direcciones ni datos personales.

No añadas estas variables a Production ni habilites envíos reales allí hasta que la rama y sus pruebas hayan sido revisadas y se autorice expresamente el cambio. Crear una rama o un pull request no modifica por sí solo `main` ni la configuración de producción.
