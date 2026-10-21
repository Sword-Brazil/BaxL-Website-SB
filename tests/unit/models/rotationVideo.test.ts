import { describe, expect, it } from "vitest";
import { parseRotationVideo, youtubeEmbedUrl } from "@/models/rules/rotationVideo";

const ID = "dQw4w9WgXcQ";

describe("parseRotationVideo", () => {
  it("reconhece os formatos de link do YouTube, com tempo de início", () => {
    expect(parseRotationVideo(`https://www.youtube.com/watch?v=${ID}`)).toEqual({ kind: "youtube", id: ID, start: 0, vertical: false });
    expect(parseRotationVideo(`https://youtu.be/${ID}?t=95`)).toEqual({ kind: "youtube", id: ID, start: 95, vertical: false });
    expect(parseRotationVideo(`https://youtube.com/shorts/${ID}`)).toMatchObject({ id: ID, vertical: true });
    expect(parseRotationVideo(`https://m.youtube.com/watch?v=${ID}&t=1m30s`)).toEqual({ kind: "youtube", id: ID, start: 90, vertical: false });
  });

  it("aceita arquivo .mp4/.webm em https", () => {
    expect(parseRotationVideo("https://cdn.exemplo.com/rotacoes/wanda.webm")).toEqual({
      kind: "file",
      url: "https://cdn.exemplo.com/rotacoes/wanda.webm",
    });
  });

  it("recusa http, links sem vídeo e IDs inválidos", () => {
    expect(parseRotationVideo("http://cdn.exemplo.com/a.mp4")).toBeNull();
    expect(parseRotationVideo("https://exemplo.com/pagina")).toBeNull();
    expect(parseRotationVideo("https://www.youtube.com/watch?v=curto")).toBeNull();
    expect(parseRotationVideo("não é link")).toBeNull();
    expect(parseRotationVideo("")).toBeNull();
  });

  it("embed sem cookies, mudo e em loop", () => {
    const url = new URL(youtubeEmbedUrl({ kind: "youtube", id: ID, start: 95, vertical: false }));
    expect(url.hostname).toBe("www.youtube-nocookie.com");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ mute: "1", loop: "1", playlist: ID, start: "95" });
  });
});
