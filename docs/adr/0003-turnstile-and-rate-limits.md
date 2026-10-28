# ADR 0003: Turnstile y límites del lado servidor

- **Estado:** aceptada; decisión existente documentada retrospectivamente.
- **Fecha:** 2026-10-25.

## Contexto
El formulario público puede recibir spam automatizado y el panel puede recibir intentos repetidos de autenticación.

## Decisión
Combinar validación del servidor, controles de origen, límites persistentes y honeypot con Cloudflare Turnstile en el formulario. El servidor verifica el token con el servicio oficial; la clave secreta permanece solo en el entorno del servidor. Los límites existentes no se consideran protección completa contra abuso distribuido.

## Motivos
Ningún control aislado resuelve el abuso: el desafío aumenta el coste de automatización y los límites reducen la frecuencia de intentos, mientras que la autorización del servidor protege las operaciones.

## Consecuencias y riesgos
- Los fallos de Turnstile deben gestionarse de forma segura, sin confiar en tokens enviados por el cliente. El formulario exige `TURNSTILE_SECRET_KEY` y un hostname de `TURNSTILE_EXPECTED_HOSTNAME` o de `SITE_URL`; `VERCEL_PROJECT_PRODUCTION_URL` no cubre esa comprobación.
- El job `validate` puede omitir `siteverify` cuando `TURNSTILE_TEST_MODE`, `CI` y `E2E_LOCAL_DATABASE` están activos. Ese atajo no demuestra la integración con Cloudflare.
- Los límites almacenados en la base pueden tener límites de escalabilidad y no equivalen a rate limiting global en edge.
- Redis/Upstash, WAF o desafíos adaptativos se evaluarán cuando métricas o incidentes justifiquen la complejidad.
- Las claves de prueba solo se usan en CI/E2E.
