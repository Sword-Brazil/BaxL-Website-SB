import { MODES, SEASON_EFFECTS, type BossEffect, type DayMode, type Mode, type SeasonId } from "@/models/domain/enums";

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

/**
 * Vídeos de uma rotação: o geral (mode null) e a demonstração em cada modo que tiver. Na BAX e na
 * BAL vale o vídeo da temporada (pelo efeito dela no modo), se houver; senão, o do modo.
 */
export function rotationVideos(
  r: { videoUrl: string | null; videoBax: string | null; videoBal: string | null; videoBai: string | null; effectVideos: Partial<Record<BossEffect, string>> },
  season: SeasonId | null,
) {
  const pick = (mode: DayMode, fallback: string | null) => {
    const url = season ? r.effectVideos[SEASON_EFFECTS[season][mode]] : undefined;
    return url ? { url, seasonal: true } : { url: fallback, seasonal: false };
  };
  const byMode: Record<Mode, { url: string | null; seasonal: boolean }> = {
    BAX: pick("BAX", r.videoBax),
    BAL: pick("BAL", r.videoBal),
    BAI: { url: r.videoBai, seasonal: false },
  };
  return [
    ...(r.videoUrl ? [{ mode: null, url: r.videoUrl, seasonal: false }] : []),
    ...MODES.flatMap((mode) => (byMode[mode].url ? [{ mode, url: byMode[mode].url!, seasonal: byMode[mode].seasonal }] : [])),
  ] as { mode: Mode | null; url: string; seasonal: boolean }[];
}

/** A rotação tem vídeo próprio de alguma temporada? */
export const hasSeasonVideos = (r: { effectVideos: Partial<Record<BossEffect, string>> }) => Object.values(r.effectVideos).some(Boolean);

/** Sugestão de vídeo: busca no YouTube pelo personagem e modo (o sistema não escolhe o vídeo sozinho). */
export const videoSearchUrl = (agentName: string, mode: Mode | null) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(["MFF", agentName, mode, "rotation"].filter(Boolean).join(" "))}`;
