import { T, useLanguage } from "@/lib/i18n";
import { useEffect, useRef } from "react";

export function MediaVideo({ src, title }: { src: string; title: string }) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;

    let isVisible = false;
    let manuallyPaused = false;
    let automaticPause = false;
    const onPause = () => {
      if (automaticPause) automaticPause = false;
      else manuallyPaused = true;
    };
    const onPlay = () => {
      manuallyPaused = false;
    };
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    const syncPlayback = () => {
      const shouldPlay =
        isVisible && !document.hidden && !reducedMotion.matches && !connection?.saveData;

      if (shouldPlay && !manuallyPaused) {
        void video.play().catch(() => {
          // El navegador puede bloquear la reproducción automática.
        });
      } else if (!shouldPlay && !video.paused) {
        automaticPause = true;
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
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
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
      aria-label={t(title)}
      className="mt-6 aspect-video w-full rounded-card bg-navy-deep"
    >
      <source src={src} type="video/mp4" />
      <T>Tu navegador no admite este video. </T>
      <a href={src}>
        <T>Descargar </T>
        <T>{title}</T>
      </a>
    </video>
  );
}
