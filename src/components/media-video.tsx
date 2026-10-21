export function MediaVideo({ src, title }: { src: string; title: string }) {
  return (
    <video controls playsInline preload="none" aria-label={title}
      className="mt-6 aspect-video w-full rounded-card bg-navy-deep">
      <source src={src} type="video/mp4" />
      Tu navegador no admite este video. <a href={src}>Descargar {title}</a>
    </video>
  );
}
