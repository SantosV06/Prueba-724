# Integración de correo transaccional con Brevo

Esta integración vive en la rama `feat/brevo-volunteer-emails`. No se debe activar en Production hasta revisar y aceptar el pull request.

## Qué hace

- Envía confirmación al correo de la persona después de registrar una solicitud nueva.
- Envía aviso al buzón interno configurado.
- No incluye el mensaje personal en el aviso interno.
- Un reintento con la misma clave de solicitud no vuelve a disparar correos.
- Si falta configuración o Brevo no responde, la solicitud guardada sigue siendo válida. El log no debe incluir claves, direcciones ni datos personales.
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

## Configurar Vercel Preview

En el proyecto de Vercel, abre Settings → Environment Variables y crea estas variables para **Preview solamente**:

| Variable | Valor |
| --- | --- |
| `BREVO_API_KEY` | API key privada creada en Brevo. |
| `BREVO_SENDER_EMAIL` | Dirección remitente que Brevo muestra como autenticada/verificada. |
| `BREVO_SENDER_NAME` | `Fundación Venezuela Nueva Esperanza` (opcional). |
| `VOLUNTEER_NOTIFICATION_EMAIL` | Buzón institucional autorizado para recibir avisos de solicitudes. |

Confirma también que `SITE_URL` apunta al dominio de Preview y que Preview utiliza una base Neon aislada de Production. Guarda las variables y vuelve a desplegar la rama.

Para desarrollo local, copia las variables a `.env.local`, que no debe estar versionado. `.env.example` contiene únicamente nombres y valores vacíos.

## Prueba de aceptación

1. Usa una dirección de correo que controles y datos ficticios.
2. Envía una solicitud desde el Preview de esta rama.
3. Confirma que aparece en la base de datos de Preview y llegan tanto la confirmación como el aviso interno.
4. Revisa spam y los logs de Vercel si no llega un mensaje.
5. Reintenta con la misma clave de solicitud: no debe haber un segundo par de correos.
6. Comprueba que una caída de Brevo no hace fallar el registro de la solicitud.
7. Ejecuta `npm run check` y `npm run build`; inspecciona también la ejecución de CI del commit.

No añadas estas variables a Production hasta que la rama y sus pruebas hayan sido revisadas y se autorice el cambio. GitHub y Vercel no modifican `main` por el simple hecho de crear una rama.
