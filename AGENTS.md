# Mantenimiento de Prueba-724

Este repositorio contiene la web de Fundación VNE, desplegada en Vercel y conectada a Neon. Las instrucciones antiguas del generador bajo `.project-tools/` son referencias históricas; no describen la máquina ni las herramientas disponibles para quien haga un cambio.

## Fuentes vigentes

Lee `README.md`, `SETUP_DATABASE.md`, `OPERATIONS.md`, `SECURITY.md`, `ARCHITECTURE.md` y `MULTIMEDIA.md` según el alcance del trabajo. Actualiza las guías afectadas cuando cambie el comportamiento. Distingue lo implementado, lo comprobado y lo que requiere operación externa.

## Contratos

- Node 24.x y npm 11.9.0. Usa `npm ci --include=dev`. Conserva el lockfile.
- Desarrollo con `npm run dev`, compilación con `npm run build`; no omitas el wrapper de entorno ni la preparación de multimedia. Conserva `startup.sh`.
- Desarrollo en `0.0.0.0:8080`; preview local de compilación en `127.0.0.1:8081`. Mantén Nitro limitado a build/preview y `serverDir: './server'`.
- Preserva el puente de preview, el inyector de marca, manifest y tutorial de instalación del generador. Renombrar una ruta interna no autoriza retirar marcas o funciones.
- `src/` es la aplicación activa. No despliegues `foundation-vne/` ni migres su esquema D1 a Neon.
- No guardes secretos ni datos reales en Git, pruebas, logs, capturas o documentación. No expongas variables del servidor con `VITE_`.
- No ejecutes E2E de escritura ni utilidades destructivas contra producción para validar un cambio. Usa bases y credenciales desechables.

## Backend y seguridad

Cada función administrativa debe comprobar sesión y permiso en el servidor. La política de 2FA se aplica también al API; la inscripción tiene una excepción limitada y explícita. No añadas recuperación por contraseña de entorno ni un bypass de factores.

Valida entradas, utiliza parámetros SQL y limita paginación/exportaciones. Los eventos de auditoría no deben copiar contraseñas, factores o mensajes de voluntarios. Mantén escrituras/auditoría atómicas y pruebas de concurrencia donde afectan a códigos o datos.

Nuevos cambios de esquema requieren migraciones aditivas. No edites archivos aplicados ni configures Preview con Production. Conserva el bloqueo del migrador. No elimines datos ni habilites retención con un plazo arbitrario.

La CSP del HTML usa el nonce generado por middleware antes de SSR. Mantén sincronizados el nonce de TanStack, el script de tema y la cabecera. Nunca autorices automáticamente etiquetas arbitrarias del HTML mediante una reescritura posterior.

## Interfaz y contenido

Usa los tokens, contraste, fuentes y componentes del sitio. Mantén teclado, estados de carga/error y vista móvil sin desbordamiento. Traduce etiquetas nuevas en español/inglés/portugués, incluidos errores y texto accesible. Conserva `lang`, metadatos, canónicas, query de idioma y `hreflang`.

El editor de portada publica texto simple con revisión; no debe aceptar HTML, URLs de pago ni archivos ejecutables. Los cambios legales y bancarios requieren su alcance propio. Los correos están pendientes de definición: no añadas proveedor ni envíos sin instrucciones.

## Verificación y entrega

Ejecuta `npm run check`, `npm run build` y las pruebas relevantes de navegador contra desarrollo y compilación. Revisa visualmente escritorio y móvil cuando cambie la interfaz. `npm run test:postgres` valida servicios en PostgreSQL local desechable si hay un servicio disponible; CI lo ejecuta con su propio PostgreSQL.

Identifica limitaciones del entorno en lugar de afirmar pruebas no ejecutadas. No confundas PGLite con un ensayo de restauración de Neon ni una respuesta HTTP 200 con una interfaz funcional. Antes de entregar, revisa el diff, evita archivos temporales y comprueba el estado de CI del commit publicado.
