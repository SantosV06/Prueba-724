# Multimedia

Los originales se conservan en `public/assets/img/` con sus nombres existentes.
Las versiones de entrega se guardan en `media-optimized/`: video H.264/AAC de hasta 1280×720 con faststart, imágenes WebP de hasta 1600 px y portadas JPG.

El catálogo es `src/data/media-files.mjs`. `scripts/prepare-media.mjs` genera `.generated-public/` para Vite; publica solo los aliases `/media/...` optimizados y los recursos públicos del sitio, sin duplicar los originales. Nunca edites `.generated-public/` ni `public/media/`.

Para reemplazar una imagen o video, actualiza el original y regenera sus derivados con `python scripts/optimize-media.py` (requiere Python, Pillow y FFmpeg en el equipo de desarrollo). Incluye `media-optimized/` actualizado en el commit. Vercel y CI **no necesitan** FFmpeg ni Pillow: utilizan los derivados versionados.

Los videos se reproducen en bucle, silenciados, cuando son visibles; se pausan al ocultarse la pestaña. Se respeta reducción de movimiento/ahorro de datos. `preload=none` y las portadas evitan descargar video solo para mostrar el recuadro inicial.

`public/favicon.svg`, `public/og.jpg` y `src/lib/og/site.json` contienen la identidad de la marca. El favicon mantiene el árbol y la tarjeta social usa el logo completo.
