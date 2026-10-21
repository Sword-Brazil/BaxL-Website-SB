import { useEffect, useState, type CSSProperties, type SyntheticEvent } from "react";
import { useTranslation } from "next-i18next/pages";
import { ExternalLinkIcon, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseRotationVideo, youtubeEmbedUrl, youtubeThumbnailUrl, type RotationVideo } from "@/models/rules/rotationVideo";

const WIDESCREEN = 16 / 9;
/** A capa do YouTube (hqdefault) é 4:3, com o vídeo no meio e faixas pretas em volta. */
const THUMB_ASPECT = 4 / 3;
/** Gravações de celular costumam ser mais largas que 16:9; acima disso é ruído da detecção. */
const MAX_ASPECT = 2.4;

/**
 * Proporção real do vídeo do YouTube, medindo as faixas pretas da capa (em cima e embaixo).
 * Gravações de celular (ex.: 20:9) ficam com faixas no player 16:9; com a proporção certa a
 * caixa se ajusta ao vídeo e ele ocupa o espaço todo, sem cortar as bordas do jogo.
 */
function useYoutubeAspect(video: RotationVideo | null): number {
  const [aspect, setAspect] = useState(WIDESCREEN);
  const src = video?.kind === "youtube" && !video.vertical ? youtubeThumbnailUrl(video) : null;
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 96;
        canvas.height = 72;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const rowIsDark = (y: number) => {
          let sum = 0;
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          }
          return sum / canvas.width < 18;
        };
        let top = 0;
        while (top < canvas.height / 2 && rowIsDark(top)) top++;
        let bottom = 0;
        while (bottom < canvas.height / 2 && rowIsDark(canvas.height - 1 - bottom)) bottom++;
        // Faixas desiguais = cena escura, não letterbox: fica no 16:9.
        if (Math.abs(top - bottom) > canvas.height * 0.06) return;
        const content = (canvas.height - top - bottom) / canvas.height;
        const measured = THUMB_ASPECT / content;
        setAspect(Math.min(MAX_ASPECT, Math.max(WIDESCREEN, measured)));
      } catch {
        // Sem acesso aos pixels: mantém 16:9.
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return aspect;
}

/** Centraliza uma mídia de proporção `media` numa caixa de proporção `box`, cortando só as faixas. */
const fill = (box: number, media: number): CSSProperties => ({
  position: "absolute",
  left: 0,
  width: "100%",
  top: "50%",
  height: `${(box / media) * 100}%`,
  transform: "translateY(-50%)",
});

/**
 * Vídeo de referência da rotação, ocupando toda a largura: capa com botão de play e, ao tocar,
 * o vídeo em loop (YouTube sem cookies ou arquivo hospedado fora). A caixa segue a proporção do
 * vídeo; vídeos verticais (Shorts) ficam numa faixa central com a capa desfocada no fundo.
 */
export function RotationVideoPlayer({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation("common");
  const [playing, setPlaying] = useState(false);
  const video = parseRotationVideo(url);
  const youtubeAspect = useYoutubeAspect(video);
  const [fileAspect, setFileAspect] = useState(WIDESCREEN);
  if (!video) return null;

  const youtube = video.kind === "youtube";
  const vertical = youtube ? video.vertical : fileAspect < 1;
  const aspect = vertical ? WIDESCREEN : youtube ? youtubeAspect : Math.min(MAX_ASPECT, fileAspect);
  const verticalFrame = "absolute inset-y-0 left-1/2 aspect-[9/16] h-full -translate-x-1/2";
  const fileMedia = vertical ? cn(verticalFrame, "object-cover") : "absolute inset-0 size-full object-cover";
  const onFileMetadata = (e: SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = e.currentTarget;
    if (videoWidth && videoHeight) setFileAspect(videoWidth / videoHeight);
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        className="group/video relative w-full overflow-hidden rounded-lg border border-energy/25 bg-black shadow-[0_0_24px_-12px_var(--energy)] transition-[aspect-ratio] duration-300"
        style={{ aspectRatio: aspect }}
      >
        {vertical &&
          (youtube ? (
            // eslint-disable-next-line @next/next/no-img-element -- capa externa do YouTube, não otimizável pelo Next
            <img src={youtubeThumbnailUrl(video)} alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-60 blur-2xl" />
          ) : (
            <video src={`${video.url}#t=0.1`} muted playsInline preload="metadata" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl" />
          ))}
        {playing ? (
          youtube ? (
            <iframe
              src={youtubeEmbedUrl(video)}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className={cn("border-0", vertical && verticalFrame)}
              style={vertical ? undefined : fill(aspect, WIDESCREEN)}
            />
          ) : (
            <video src={video.url} autoPlay muted loop playsInline controls aria-label={title} className={fileMedia} />
          )
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${t("rotation.playVideo")}: ${title}`}
            className="absolute inset-0 size-full cursor-pointer focus-visible:outline-none"
          >
            {youtube ? (
              // eslint-disable-next-line @next/next/no-img-element -- capa externa do YouTube, não otimizável pelo Next
              <img
                src={youtubeThumbnailUrl(video)}
                alt=""
                loading="lazy"
                className={cn("object-cover", vertical && verticalFrame)}
                style={vertical ? undefined : fill(aspect, THUMB_ASPECT)}
              />
            ) : (
              <video src={`${video.url}#t=0.1`} muted playsInline preload="metadata" aria-hidden onLoadedMetadata={onFileMetadata} className={fileMedia} />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20 transition-opacity group-hover/video:opacity-80" />
            <span className="absolute top-1/2 left-1/2 flex size-14 -translate-1/2 items-center justify-center rounded-full bg-energy/90 text-background shadow-[0_0_32px_-4px_var(--energy)] ring-4 ring-energy/30 transition-transform group-hover/video:scale-110 group-focus-visible/video:ring-white sm:size-20">
              <PlayIcon className="ml-1 size-6 fill-current sm:size-9" />
            </span>
            <span className="absolute inset-x-0 bottom-0 p-3 text-left sm:p-4">
              <span className="block font-heading text-[0.65rem] tracking-[0.2em] text-energy uppercase">{t("rotation.playVideo")}</span>
              <span className="block truncate font-heading text-sm font-semibold text-white sm:text-base">{title}</span>
            </span>
          </button>
        )}
      </div>
      <a href={url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1 self-start text-xs text-energy hover:underline">
        <ExternalLinkIcon className="size-3" />
        {t("rotation.openVideo")}
      </a>
    </div>
  );
}
