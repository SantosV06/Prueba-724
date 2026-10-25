# ADR 0001: Autenticación administrativa propia

- **Estado:** aceptada; decisión existente documentada retrospectivamente.
- **Fecha:** 2026-10-25.

## Contexto
El panel administra solicitudes de voluntariado y operaciones con distintos niveles de privilegio, incluidas acciones reservadas al propietario. La autenticación actual está implementada en los módulos propios del proyecto.

## Decisión
Mantener por ahora el sistema existente: contraseñas verificadas con scrypt, sesiones aleatorias almacenadas como hash, autorización en servidor, revocación, TOTP cifrado y códigos de recuperación de un solo uso. Better Auth/Clerk no se consideran integrados en el flujo actual. No añadir un segundo sistema de sesión sin una migración diseñada y probada.

## Motivos
- La autorización y el modelo de datos están acoplados a operaciones administrativas y política 2FA.
- La sustitución exige migración de cuentas, sesiones, recuperación y pruebas de autorización.
- Evitar dos sistemas de sesión reduce ambigüedad y superficie de ataque.

## Consecuencias y riesgos
- El equipo mantiene el ciclo de vida de credenciales, sesiones, recuperación, revisión de seguridad y actualización criptográfica.
- Deben probarse revocación, cambios de contraseña/factor, recuperación del propietario y carreras concurrentes.
- Reconsiderar la decisión si el coste de mantenimiento supera el beneficio o si un proveedor gestionado cubre todos los requisitos con una migración segura.

## Verificación
Consultar los módulos de servicio, TOTP, SECURITY.md y pruebas asociadas antes de modificar el flujo.
