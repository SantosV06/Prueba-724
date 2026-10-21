import { useEffect, useRef } from "react";

export function MediaVideo({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;

    let isVisible = false;

    const syncPlayback = () => {
      const shouldPlay =
        isVisible && !document.hidden && !reducedMotion.matches && !connection?.saveData;

      if (shouldPlay) {
        void video.play().catch(() => {
          // El navegador puede bloquear la reproducción automática.
        });
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.intersectionRatio >= 0.25;
        syncPlayback();
      },
      { threshold: [0, 0.25] },
    );

    observer.observe(video);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", syncPlayback);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
      if (video.paused === false) video.pause();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      loop
      muted
      playsInline
      preload="none"
      poster={src.replace(/\.mp4$/, "-poster.jpg")}
      aria-label={title}
      className="mt-6 aspect-video w-full rounded-card bg-navy-deep"
    >
      <source src={src} type="video/mp4" />
      Tu navegador no admite este video. <a href={src}>Descargar {title}</a>
    </video>
  );
}
