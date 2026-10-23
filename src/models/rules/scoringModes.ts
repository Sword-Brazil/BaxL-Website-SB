import { MODES, type Mode } from "@/models/domain/enums";

/** Ordena e tira repetidos, na ordem BAX · BAL · BAI. */
export const sortModes = (modes: Iterable<string>): Mode[] => MODES.filter((m) => new Set(modes).has(m));

/** Modo de uma equipe Meta: o do dia (BAX/BAL), a BAI, ou BAL na BAL livre. */
export function modeOfTeam(scope: string, dayMode: string | null | undefined): Mode | null {
  if (scope === "BAI") return "BAI";
  if (scope === "BAL_FREE") return "BAL";
  return dayMode === "BAX" || dayMode === "BAL" ? dayMode : null;
}

/** Modos em que o personagem pontua: os automáticos (pelas equipes Meta) ou os escolhidos pelo admin. */
export const effectiveScoringModes = (agent: { scoringAuto: boolean; scoringModes: readonly string[]; detectedScoringModes: readonly string[] }): Mode[] =>
  sortModes(agent.scoringAuto ? agent.detectedScoringModes : agent.scoringModes);

/** Vídeos de uma rotação: o geral (mode null) e a demonstração em cada modo que tiver. */
export function rotationVideos(r: { videoUrl: string | null; videoBax: string | null; videoBal: string | null; videoBai: string | null }) {
  const byMode: Record<Mode, string | null> = { BAX: r.videoBax, BAL: r.videoBal, BAI: r.videoBai };
  return [
    ...(r.videoUrl ? [{ mode: null, url: r.videoUrl }] : []),
    ...MODES.flatMap((mode) => (byMode[mode] ? [{ mode, url: byMode[mode]! }] : [])),
  ] as { mode: Mode | null; url: string }[];
}

/** Sugestão de vídeo: busca no YouTube pelo personagem e modo (o sistema não escolhe o vídeo sozinho). */
export const videoSearchUrl = (agentName: string, mode: Mode | null) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(["MFF", agentName, mode, "rotation"].filter(Boolean).join(" "))}`;
