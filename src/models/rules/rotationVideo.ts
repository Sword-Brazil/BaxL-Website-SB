// Vídeo de referência da rotação: o sistema não hospeda vídeo (fica leve e gratuito). O curador
// cola um link do YouTube (vídeo, Shorts ou youtu.be, com tempo de início opcional) ou de um
// arquivo .mp4/.webm hospedado em outro lugar.

export type RotationVideo =
  | { kind: "youtube"; id: string; start: number; vertical: boolean }
  | { kind: "file"; url: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);
const VIDEO_FILE = /\.(mp4|webm)$/i;

/** "90", "90s", "1m30s", "1h2m3s" → segundos. */
function parseSeconds(raw: string | null): number {
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

export function parseRotationVideo(input: string | null | undefined): RotationVideo | null {
  const raw = input?.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const parts = url.pathname.split("/").filter(Boolean);
    const id =
      url.hostname === "youtu.be"
        ? parts[0]
        : parts[0] === "watch"
          ? url.searchParams.get("v")
          : ["shorts", "embed", "live"].includes(parts[0] ?? "")
            ? parts[1]
            : null;
    if (!id || !YOUTUBE_ID.test(id)) return null;
    const vertical = url.hostname !== "youtu.be" && parts[0] === "shorts";
    return { kind: "youtube", id, start: parseSeconds(url.searchParams.get("t") ?? url.searchParams.get("start")), vertical };
  }
  return VIDEO_FILE.test(url.pathname) ? { kind: "file", url: url.toString() } : null;
}

/** Embed sem cookies, mudo, em loop e sem controles (o loop do YouTube recomeça do início do vídeo). */
export function youtubeEmbedUrl(video: Extract<RotationVideo, { kind: "youtube" }>): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: video.id,
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    ...(video.start ? { start: String(video.start) } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params}`;
}

/** Capa do vídeo do YouTube (existe para todo vídeo, inclusive Shorts). */
export function youtubeThumbnailUrl(video: Extract<RotationVideo, { kind: "youtube" }>): string {
  return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
}
