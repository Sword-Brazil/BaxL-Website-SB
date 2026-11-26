import { SEASONS, type SeasonId } from "@/models/domain/enums";
import type { MetaTeam } from "@/models/domain/types";

/** JSON do banco ({ "BURN_FRACTURE": "..." }) → só as temporadas conhecidas, com texto. */
export function toSeasonMap(raw: unknown): Partial<Record<SeasonId, string>> {
  if (!raw || typeof raw !== "object") return {};
  const map: Partial<Record<SeasonId, string>> = {};
  for (const s of SEASONS) {
    const v = (raw as Record<string, unknown>)[s];
    if (typeof v === "string" && v.trim()) map[s] = v.trim();
  }
  return map;
}

/**
 * Equipe como o jogador vê na temporada atual: o vídeo e os Strikers da temporada (quando
 * cadastrados) no lugar dos gerais. O editor do admin recebe a equipe sem isso.
 */
export const teamForSeason = (team: MetaTeam, season: SeasonId): MetaTeam => ({
  ...team,
  videoUrl: team.seasonVideos[season] ?? team.videoUrl,
  members: team.members.map((m) =>
    m.isDamageDealer ? { ...m, strikerUniformId: m.seasonStrikers[season] ?? m.strikerUniformId } : m,
  ),
});
