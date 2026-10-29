import { DEFAULT_SEASON, SEASON_EFFECTS, SEASONS, type SeasonId } from "@/models/domain/enums";
import type { Season } from "@/models/domain/types";
import type { SeasonInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";

const toSeason = (id: SeasonId): Season => ({ id, ...SEASON_EFFECTS[id] });

/** Temporada atual (o par de efeitos que atordoa o chefe na BAX e na BAL). Sem Settings, a de lançamento. */
export async function getSeason(): Promise<Season> {
  const s = await prisma.settings.findUnique({ where: { id: 1 }, select: { season: true } });
  const id = SEASONS.find((x) => x === s?.season) ?? DEFAULT_SEASON;
  return toSeason(id);
}

/** Troca a temporada: vale para todos os dias de BAX e de BAL. */
export async function setSeason(input: SeasonInput): Promise<Season> {
  await prisma.settings.update({ where: { id: 1 }, data: { season: input.id } });
  return getSeason();
}
