# Revisión documental de Prueba-724 — 26 de octubre de 2026

## Alcance y límites

Revisión estática de documentación y configuración accesible en la rama `main`: `README.md`, `README.en.md`, `ARCHITECTURE.md`, `OPERATIONS.md`, `SECURITY.md`, `package.json`, `GUIA_INSTALACION_COMPLETA.md`, `BREVO_SETUP.md`, `.gitignore` y `.github/workflows/ci.yml`. También se hicieron búsquedas puntuales de referencias de archivos y de tareas pendientes.

No se descargó ni ejecutó el repositorio completo y no se inspeccionó cada archivo de código. Este informe no equivale a una auditoría integral, un análisis dinámico, una prueba de penetración ni una validación del despliegue. No se afirma que CI esté verde ni que producción esté correctamente configurada.

## Hallazgos confirmados

### DOC-01 — Numeración duplicada en la guía de instalación

**Severidad: baja · Documentación**

En la sección 5 de `GUIA_INSTALACION_COMPLETA.md`, los pasos de configuración de Turnstile repiten el número 5. Debe renumerarse la lista para que los pasos sean inequívocos.

### DOC-02 — Error tipográfico en BREVO_SETUP.md

**Severidad: baja · Documentación**

En la sección de generación de secretos, el texto contiene `ADMIN_TOTP_ENCRYPTION_KEY);` con un paréntesis de cierre que no corresponde. Debe corregirse a `ADMIN_TOTP_ENCRYPTION_KEY`.

### DOC-03 — README en inglés es solo un índice breve

**Severidad: baja · Consistencia documental**

`README.en.md` enlaza las guías inglesas y ofrece un resumen, mientras que el README español documenta más comandos, validaciones y límites. No es un fallo de ejecución, pero conviene mantener ambos índices sincronizados cuando cambien funciones, comandos o requisitos de seguridad.

## Riesgos y verificaciones pendientes (no son vulnerabilidades confirmadas)

1. **Turnstile:** verificar en Vercel que el hostname esperado coincide con el hostname real de cada entorno. El valor `localhost` del CI es exclusivo de las pruebas y no debe copiarse a Production.
2. **Brevo:** los tests automatizados simulan el proveedor. La entrega real de confirmación y aviso interno debe verificarse por separado con destinatarios controlados; un CI verde no demuestra la entrega.
3. **Base de Preview:** comprobar manualmente que la base de datos de Preview está aislada de Production antes de habilitar cualquier flujo de escritura.
4. **Cabeceras:** revisar las cabeceras HTTP efectivas de los dominios desplegados. Leer la configuración fuente no demuestra qué cabeceras sirven todos los despliegues.
5. **Protección del repositorio:** verificar en GitHub el estado real de Secret Scanning, Push Protection, reglas de rama y permisos. La documentación no prueba que esos controles estén activados.
6. **Recuperación:** ensayar restauración de Neon en un entorno separado y documentar el resultado. Tener procedimientos escritos no demuestra que una copia sea restaurable.
7. **Dependencias y pruebas:** revisar los resultados de CI y `npm audit` del SHA exacto que se pretende fusionar. Este informe no ejecuta esos comandos.

## Limpieza y eliminación de archivos

No se recomienda borrar código, dependencias, migraciones, workflows ni directorios históricos solo porque parezcan antiguos. Para declarar algo innecesario hay que verificar referencias, imports dinámicos, rutas, scripts, configuración de build, workflows, migraciones y necesidades de recuperación. La búsqueda textual por sí sola no demuestra que un archivo esté sin uso.

La versión histórica y los directorios de herramientas deben mantenerse fuera del despliegue activo según la configuración real de Vercel; moverlos o eliminarlos requiere comprobar primero que no los consume ningún proceso. No se elimina ningún archivo en esta revisión.

## Archivos revisados

- `README.md`, `README.en.md`
- `ARCHITECTURE.md`, `OPERATIONS.md`, `SECURITY.md`
- `GUIA_INSTALACION_COMPLETA.md`, `BREVO_SETUP.md`
- `package.json`, `.gitignore`, `.github/workflows/ci.yml`

## Estado

Esta revisión se guarda en una rama de mantenimiento separada. No modifica `main`, no fusiona cambios y no despliega. Las correcciones documentales deben pasar revisión y CI antes de integrarse.
