# Multimedia en Vercel

Copia el contenido de `Foundation-VNE/assets/img/` dentro de
`Prueba-724/public/assets/img/`. La carpeta final debe contener directamente
los archivos; evita crear `img/img/`.

Conserva exactamente los nombres, mayúsculas, espacios y acentos originales.
Las páginas usan el catálogo `src/data/media-files.mjs`. Antes del desarrollo y de cada compilación,
`scripts/prepare-media.mjs` genera copias con nombres sin espacios ni acentos
en `public/media/`; las páginas usan esas URL estables desde la raíz.
No edites ni subas manualmente `public/media/`.

Vite copia `public/` al resultado de producción; Vercel publica tanto los
archivos originales como las copias de `/media/...`. No los subas a `src/assets/img/` ni a `assets/img/`
en la raíz del repositorio. No requieren base de datos ni variables de entorno.

Incluye también los tres videos de sectores y `ProyectoGénesis.pdf`.
Los videos tienen controles y no se descargan completos automáticamente.
Después de subir la carpeta, realiza un nuevo despliegue para publicar los archivos.
