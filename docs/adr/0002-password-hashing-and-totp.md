# ADR 0002: scrypt y TOTP para protección administrativa

- **Estado:** aceptada; decisión existente documentada retrospectivamente.
- **Fecha:** 2026-10-25.

## Contexto
Las cuentas administrativas acceden a datos personales y exportaciones. El sistema necesita almacenar verificadores de contraseña y proteger secretos TOTP.

## Decisión
Usar scrypt con sal aleatoria y parámetros definidos por la aplicación para contraseñas. Cifrar secretos TOTP con AES-256-GCM y una clave de servidor independiente. Guardar hashes de códigos de recuperación de un solo uso. Aplicar límites de intentos y consumir las pruebas TOTP de manera atómica.

## Motivos
- scrypt aumenta el coste de ataques de adivinación offline.
- El cifrado autenticado protege secretos TOTP almacenados si se filtra solo la base de datos.
- Los códigos de recuperación en hash evitan convertir una copia de la base en códigos reutilizables.

## Consecuencias y riesgos
- La clave de cifrado debe mantenerse en un gestor de secretos y tener un procedimiento de rotación versionado.
- Perder la clave puede impedir descifrar factores existentes; cambiarla sin migración puede bloquear a administradores.
- Deben medirse el coste de scrypt y los límites de plataforma bajo carga real.
- Las carreras de TOTP y recuperación requieren pruebas concurrentes en PostgreSQL.

## Alternativas
Un proveedor de identidad externo podría reducir carga operativa, pero debe verificarse compatibilidad con autorización, recuperación y políticas existentes. Los hashes rápidos de contraseña y guardar TOTP en claro se descartan por el riesgo de una filtración de base de datos.
