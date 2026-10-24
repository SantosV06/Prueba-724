# Correo transaccional con Brevo: configuración y prueba de producción

El módulo `src/lib/brevo-email.server.ts` ya forma parte de `main`. Después de guardar por primera vez una solicitud nueva, la aplicación intenta enviar una confirmación a la persona solicitante y un aviso al buzón interno. La integración no envía mensajes cuando una solicitud se repite con la misma clave idempotente, no manda el mensaje personal en el aviso interno y no envía correos al cambiar estados ni para recuperar contraseñas.

## Estado de la prueba real

El responsable del proyecto informó que configuró las variables de correo en Vercel Production, envió una solicitud de prueba y recibió un correo real. Esto confirma que **al menos un mensaje llegó en esa prueba concreta**. No debe interpretarse como evidencia de que se comprobaron ambos destinatarios, la idempotencia, el fallo del proveedor o la entrega bajo carga; registra esas comprobaciones por separado si las realizas.

No puedo leer ni modificar las variables secretas de Vercel desde este repositorio. Esta guía indica cómo configurarlas sin copiar secretos a GitHub.

## 1. Preparar el remitente en Brevo

1. Crea o abre la cuenta de Brevo que administrará los correos transaccionales.
2. En la sección de remitentes y dominios, autentica el dominio que utilizarás para enviar.
3. Añade al DNS los registros SPF y DKIM que indique Brevo. **No reemplaces un SPF existente** sin revisar qué otros servicios envían correo desde ese dominio.
4. Configura DMARC según la política del dominio y verifica en Brevo que la autenticación esté aprobada.
5. Añade/verifica el remitente exacto que usarás como `BREVO_SENDER_EMAIL`.
6. En **SMTP & API**, crea una **API key de la API de Brevo**. No confundas esta clave con una contraseña SMTP.
7. Guarda la API key en el gestor seguro de secretos. No la pegues en GitHub, Issues, capturas, registros ni chats.

Documentación oficial:
- [Autenticar un dominio en Brevo](https://help.brevo.com/hc/en-us/articles/12163873366162-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)
- [Enviar un correo transaccional con la API](https://developers.brevo.com/docs/send-a-transactional-email)

## 2. Variables que necesita el formulario en Production

En Vercel, abre el proyecto correcto y entra en **Settings → Environment Variables**. Añade las variables indicadas abajo para **Production**. Después de guardar cambios, crea un nuevo despliegue de Production; un despliegue ya publicado no incorpora automáticamente los valores nuevos.

| Variable | Requerida | Dónde se obtiene / qué poner | ¿Secreta? |
| --- | --- | --- | --- |
| `DATABASE_URL` | Sí | URL pooled de la base de Neon de Production, con SSL habilitado. | Sí |
| `ADMIN_PASSWORD` | Sí para el primer acceso | Contraseña inicial del propietario, entre 14 y 256 caracteres. Solo inicializa la cuenta si todavía no hay cuentas. | Sí |
| `ADMIN_SESSION_SECRET` | Sí | Secreto aleatorio de al menos 32 caracteres. | Sí |
| `ADMIN_TOTP_ENCRYPTION_KEY` | Sí | 32 bytes aleatorios codificados en Base64; conserva una copia segura. | Sí |
| `SITE_URL` | Recomendada | Origen HTTPS canónico del sitio, sin ruta ni parámetros, por ejemplo `https://tu-dominio.vercel.app`. | No |
| `VITE_TURNSTILE_SITE_KEY` | Sí para el formulario | Clave **site/public** de Cloudflare Turnstile para el hostname publicado. Está disponible durante la compilación del cliente. | No; es pública |
| `TURNSTILE_SECRET_KEY` | Sí para el formulario | Clave **secret** correspondiente de Cloudflare Turnstile. Solo servidor. | Sí |
| `BREVO_API_KEY` | Sí para enviar correos | API key de Brevo. | Sí |
| `BREVO_SENDER_EMAIL` | Sí para enviar correos | Dirección remitente autenticada/verificada en Brevo. | No, pero es configuración operativa |
| `BREVO_SENDER_NAME` | Opcional | Nombre visible, por ejemplo `Fundación Venezuela Nueva Esperanza`. | No |
| `VOLUNTEER_NOTIFICATION_EMAIL` | Sí para el aviso interno | Buzón autorizado que recibe los avisos de nuevas solicitudes. | No, pero es dato operativo |
| `DATA_RETENTION_DAYS` | Opcional | Entero de 30 a 3650 solo si la organización aprobó el plazo. No activa borrado automático. | No |

**Importante sobre Turnstile:** crea las claves en el panel de Cloudflare Turnstile y autoriza el hostname exacto que usarás. La clave pública debe corresponder a la clave secreta. `VITE_TURNSTILE_SITE_KEY` es una variable de compilación: si la cambias, vuelve a desplegar para que el cliente se reconstruya. Nunca uses la clave secreta con prefijo `VITE_`.

Genera los secretos de la aplicación desde una terminal privada con Node.js 24:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Ejecuta el comando por separado para `ADMIN_SESSION_SECRET` y `ADMIN_TOTP_ENCRYPTION_KEY); guarda valores diferentes. No uses la contraseña como secreto de sesión. La clave TOTP debe conservarse: perderla puede impedir descifrar los autenticadores existentes. No generes estos valores en una terminal compartida ni los añadas al repositorio.

## 3. Configurar las variables en Vercel

1. Abre el proyecto de Vercel vinculado al repositorio correcto.
2. Ve a **Settings → Environment Variables**.
3. Añade cada nombre exactamente como aparece en la tabla, sin comillas y sin espacios añadidos.
4. Para cada variable, selecciona **Production**. No selecciones Preview o Development por accidente.
5. Comprueba que `DATABASE_URL` apunta a la base de Neon de Production, no a una rama de prueba.
6. Confirma que las dos claves Turnstile pertenecen al mismo widget/hostname.
7. Guarda los valores y crea un nuevo despliegue de Production desde `main`.
8. Espera a que el despliegue esté **Ready**. Si falla, revisa el build log y corrige la configuración antes de enviar solicitudes.

No compartas capturas donde se vean valores secretos. Si una clave se expone, revócala/ rótala y vuelve a desplegar.

## 4. Comprobar el formulario publicado

Realiza esta prueba con una dirección de correo que controles y datos claramente identificados como prueba. No uses datos de voluntarios reales.

1. Abre el dominio HTTPS de Production y entra en la página de voluntariado.
2. Espera a que el widget de Turnstile cargue y permita completar el formulario. Si no aparece o no permite continuar, revisa `VITE_TURNSTILE_SITE_KEY`, el hostname autorizado y la CSP.
3. Envía una solicitud de prueba con un correo que puedas revisar. Completa los campos obligatorios y envía una sola vez.
4. Confirma que la interfaz muestra el resultado correcto y que la solicitud aparece una sola vez en `/solicitudes`.
5. Revisa el correo del voluntario y el buzón de `VOLUNTEER_NOTIFICATION_EMAIL`. Comprueba también Spam/Promociones si falta alguno.
6. Comprueba que el aviso interno contiene un enlace correcto al panel y **no** incluye el mensaje personal del formulario.
7. Comprueba los logs de Vercel ante cualquier fallo, sin copiar ni publicar valores secretos o datos personales.
8. Cuando termine la prueba, elimina la solicitud de prueba de forma controlada desde el panel si la política de la organización lo permite.

### Comprobaciones adicionales recomendadas

- Reenvía la misma solicitud con la misma clave idempotente usando un procedimiento de prueba controlado y confirma que no se duplica la solicitud ni el par de correos. No intentes simularlo haciendo clic varias veces en el formulario público: cada envío nuevo puede generar una clave distinta.
- En un entorno de integración aislado, simula una respuesta de error o caída de Brevo y comprueba que la solicitud ya guardada sigue siendo válida.
- Revisa que los logs no contengan API keys, direcciones de correo, mensaje personal ni cuerpos de respuesta del proveedor.

No hagas pruebas de fallo, scripts de escritura o pruebas E2E contra la base real de Production.

## 5. Pruebas automatizadas

Las pruebas de `src/lib/brevo-email.server.test.ts` simulan la API; no envían mensajes reales. Ejecuta localmente:

```sh
npm ci --include=dev
npm run check
npm run build
```

Estas pruebas verifican la preparación de los dos mensajes, los destinatarios, el escape HTML, la omisión del mensaje personal en el aviso interno, la ausencia de llamadas cuando falta configuración y el manejo de errores HTTP/red sin filtrar datos. Un CI verde no acredita la autenticación DNS ni la entrega real.

## 6. Fallos frecuentes

- **El formulario no se puede enviar / Turnstile no aparece:** revisa `VITE_TURNSTILE_SITE_KEY`, hostname autorizado y el último build de Production. Revisa `TURNSTILE_SECRET_KEY` si el servidor rechaza el token.
- **La solicitud se guarda pero no llega correo:** revisa que las variables de Brevo estén configuradas en Production, que la API key sea válida y que el remitente esté autenticado. La integración está diseñada para no invalidar una solicitud guardada si el proveedor falla.
- **Llega la confirmación pero no el aviso interno (o viceversa):** verifica ambos destinatarios por separado y confirma `VOLUNTEER_NOTIFICATION_EMAIL`.
- **Cambiaste una variable y nada cambia:** crea un nuevo despliegue; las variables no se inyectan retroactivamente en funciones ya desplegadas.
- **La prueba funciona en Preview pero no en Production:** confirma el ámbito de entorno, el hostname/keys de Turnstile, la URL de la base y el remitente configurado para Production.

No configures `DATABASE_URL` de Production en Preview. Para Preview, crea una rama Neon independiente y configura `PREVIEW_DATABASE_ISOLATED=true` solo después de verificar manualmente que la base está aislada. Usa secretos y destinatarios separados.

## Alcance y privacidad

Si falta configuración de correo o Brevo devuelve un error, la solicitud guardada sigue siendo válida. La integración no garantiza entrega, no cambia el estado de la solicitud y no gestiona recuperación de contraseña. El mensaje personal se excluye del aviso interno; los valores insertados en HTML se escapan. No añadas nuevos datos o destinatarios sin revisar privacidad y actualizar las pruebas.
