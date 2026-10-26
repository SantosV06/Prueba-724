# Auditoría del repositorio Prueba-724 — 26 de octubre de 2026

## Alcance y método

Revisión documental y estática de la rama `main` de `SantosV06/Prueba-724`, con lectura de `README.md`, `ARCHITECTURE.md`, `OPERATIONS.md`, `SECURITY.md`, `package.json` y `.github/workflows/ci.yml`, y búsqueda de referencias a la validación del hostname de Cloudflare Turnstile. Esta revisión no ejecuta el proyecto ni sustituye pruebas de runtime, una auditoría dinámica o una prueba de penetración. Los hallazgos se clasifican como errores documentales, riesgos/configuración pendiente y verificaciones no demostradas.

## Resumen ejecutivo

La documentación describe una aplicación institucional desplegada desde la raíz, con TanStack Start/React/TypeScript, Neon PostgreSQL, un panel administrativo, TOTP, auditoría, Cloudflare Turnstile y notificaciones transaccionales de Brevo. El `package.json` declara Node `24.x`, npm `11.9.0` y define `check`, `build`, pruebas E2E, pruebas PostgreSQL y cobertura.

No se ha ejecutado CI ni el código durante esta revisión. Por tanto, este documento no afirma que el commit actual esté verde, que producción esté correctamente configurada o que no existan vulnerabilidades.

## Hallazgos

### D-01 — Error de formato en SECURITY.md

**Severidad: baja · Confirmado**

En «Límites y decisiones de operación», varios párrafos contienen los caracteres literales `\n\n` en lugar de saltos de línea Markdown. Esto hace que el documento muestre los separadores como texto y que la nota del desarrollador quede pegada al párrafo anterior.

**Corrección aplicada en esta rama:** sustituir los separadores literales por saltos de línea reales y separar la nota del desarrollador en su propio párrafo.

### D-02 — Comentario de entorno ambiguo en CI

**Severidad: baja · Confirmado**

En `.github/workflows/ci.yml`, el comentario de las variables globales dice «Disposable local PGLite only», pero el mismo workflow inicia PostgreSQL 17 y ejecuta `npm run test:postgres` con `TEST_DATABASE_URL` apuntando al servicio local desechable. El comportamiento puede ser correcto, pero el comentario es demasiado amplio y confunde el backend usado por E2E con el de las pruebas PostgreSQL.

**Recomendación:** aclarar que las credenciales globales son exclusivas de CI y que las pruebas E2E usan el entorno local configurado, mientras que el job de integración PostgreSQL usa el servicio PostgreSQL desechable. No cambiar la lógica del workflow como parte de una corrección documental.

### O-01 — Turnstile depende de una configuración de hostname/origen válida

**Severidad: alta para disponibilidad del formulario si falta · Requisito operativo confirmado por el código/documentación**

`src/lib/volunteer-functions.ts` busca `TURNSTILE_EXPECTED_HOSTNAME` o una configuración derivada de `SITE_URL`, y falla de forma cerrada si no puede determinar el hostname esperado. `.env.example` y `GUIA_INSTALACION_COMPLETA.md` documentan ambas opciones. El workflow CI define `TURNSTILE_EXPECTED_HOSTNAME=localhost` para la clave de prueba.

**Acción fuera del código:** comprobar por separado en Vercel Production y Preview que el hostname configurado coincide exactamente con el hostname que Turnstile devuelve para cada entorno; no copiar el valor de `localhost` de CI a producción. La revisión del repositorio no permite verificar los valores secretos/configurados en Vercel.

### V-01 — La documentación de Brevo distingue correctamente tests simulados de entrega real

**Estado: límite documentado**

El README y la arquitectura explican que los tests simulan la API de Brevo y no prueban entrega real. También se indica que un fallo del proveedor no invalida una solicitud ya guardada. Para aceptar la funcionalidad deben conservarse evidencias separadas de los tests automatizados y de una prueba autorizada en el entorno real; un CI verde no demuestra que ambos correos lleguen.

### V-02 — Cobertura de seguridad y operación no demostrada solo por documentación

**Estado: requiere verificación externa**

La documentación identifica controles y límites relevantes: CSP mantiene `unsafe-inline` para estilos; 2FA obligatorio está desactivado por defecto; el monitor horario no comprueba todas las funciones ni entrega de correo; y la restauración de Neon, las cabeceras de despliegue y Secret Scanning/Push Protection necesitan verificación operativa. No se presentan como vulnerabilidades confirmadas sin pruebas adicionales.

## Validaciones recomendadas

1. Revisar los resultados de GitHub Actions del SHA exacto que se pretende fusionar: `npm ci`, `npm run test:postgres`, `npm run build`, `npm run test:coverage`, E2E contra desarrollo y E2E contra la compilación.
2. Probar el formulario en Preview con una base aislada, claves Turnstile específicas de Preview y destinatarios de correo controlados.
3. Verificar hostname/origen Turnstile en Preview y Production sin exponer claves.
4. Comprobar las cabeceras HTTP reales en los dominios publicados, especialmente CSP, HSTS, COOP, CORP y caché.
5. Confirmar el estado de `npm audit`, revisión de dependencias, protección de ramas, Secret Scanning y Push Protection.
6. Ensayar una restauración de respaldo de Neon en un entorno separado.
7. Mantener cualquier corrección funcional o de seguridad en una rama de código y someterla a CI; esta rama se limita a documentación.

## Archivos revisados

- `README.md`
- `ARCHITECTURE.md`
- `OPERATIONS.md`
- `SECURITY.md`
- `package.json`
- `.github/workflows/ci.yml`
- Referencias encontradas en `src/lib/volunteer-functions.ts`, `.env.example` y `GUIA_INSTALACION_COMPLETA.md`

## Estado de esta entrega

Cambios documentales propuestos en una rama separada: informe de auditoría y corrección del formato de `SECURITY.md`. No se ha fusionado la rama, no se ha desplegado nada y no se ha modificado `main`.
