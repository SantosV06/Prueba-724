# Multimedia

## Fuentes y entrega

Los originales se conservan en `public/assets/img/` con sus nombres existentes. Los derivados versionados están en `media-optimized/`: videos H.264/AAC de hasta 1280×720 con faststart, imágenes WebP de hasta 1600 px y portadas JPG.

El catálogo es `src/data/media-files.mjs`; `src/data/media.ts` ofrece aliases a los componentes. `scripts/prepare-media.mjs` genera `.generated-public/` para Vite y Nitro. Publica los recursos `/media/...` optimizados sin duplicar los originales. No edites `.generated-public/`, `.vercel/output` ni `public/media/`: son resultados de preparación/compilación.

## Sustitución

1. Actualiza el original y el catálogo cuando corresponda.
2. Ejecuta `python scripts/optimize-media.py` con Python, Pillow y FFmpeg disponibles en el entorno de desarrollo.
3. Revisa calidad, dimensiones, portadas y nombres. Incluye los derivados de `media-optimized/` en el commit.
4. Ejecuta build y verifica la reproducción en móvil/escritorio.

Vercel y CI consumen los derivados versionados; no necesitan FFmpeg/Pillow. El script de preparación falla si faltan los recursos exigidos.

## Reproducción y accesibilidad

`MediaVideo` utiliza controles, bucle, silencio y `playsInline`, con `preload=none` y poster. Intenta reproducir cuando al menos una cuarta parte del video está visible; pausa fuera de vista o con la pestaña oculta. Respeta ahorro de datos y reducción de movimiento. Una pausa manual se conserva y el navegador puede rechazar autoplay.

Estas medidas reducen descargas y reproducción innecesarias; no prometen consumo cero ni una puntuación de rendimiento concreta. Revisa compresión y derechos de uso antes de añadir archivos grandes. Las etiquetas y textos alternativos deben tener traducción. Los videos hablados necesitan subtítulos/transcripciones propios; no se generan automáticamente.

## Identidad

`public/favicon.svg` contiene el emblema del árbol; `public/og.jpg` y `src/lib/og/site.json` definen la tarjeta social con el logo completo. El encabezado usa el árbol y el pie muestra el logo completo. Preserva las rutas PWA, iconos, inyector de marca y puente de preview existentes.

## Contenido editable

El editor administrativo cambia solo el título y la introducción de portada. No sube imágenes o videos ni cambia estos archivos. Para su arquitectura y permisos consulta [ARCHITECTURE.md](ARCHITECTURE.md).
