import { DEFAULT_SEASON, SEASON_EFFECTS, SEASONS, seasonAfter, type SeasonId } from "@/models/domain/enums";
import type { Season } from "@/models/domain/types";
import { cycleNumber } from "@/models/rules/battleClock";
import type { SeasonInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";

const toSeason = (id: SeasonId): Season => ({ id, ...SEASON_EFFECTS[id] });

/**
 * Temporada atual (o par de efeitos que atordoa o chefe na BAX e na BAL). Muda sozinha no Dia 1 de
 * cada ciclo, para a seguinte de SEASONS, a partir da que o admin escolheu. Sem Settings, a de lançamento.
 */
export async function getSeason(now = new Date()): Promise<Season> {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  const saved = SEASONS.find((x) => x === s?.season) ?? DEFAULT_SEASON;
  if (!s) return toSeason(saved);
  const cycle = cycleNumber(now, { cycleAnchor: s.cycleAnchor.toISOString(), dayTurnoverHour: s.dayTurnoverHour });
  // Antes da troca automática não se sabia o ciclo: a temporada salva vale para o ciclo atual.
  if (s.seasonCycle === null) {
    await prisma.settings.updateMany({ where: { id: 1, seasonCycle: null }, data: { seasonCycle: cycle } });
    return toSeason(saved);
  }
  return toSeason(seasonAfter(saved, cycle - s.seasonCycle));
}

/** Troca a temporada do ciclo atual (vale para todos os dias de BAX e de BAL); as próximas seguem a ordem. */
export async function setSeason(input: SeasonInput, now = new Date()): Promise<Season> {
  const s = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
  const cycle = cycleNumber(now, { cycleAnchor: s.cycleAnchor.toISOString(), dayTurnoverHour: s.dayTurnoverHour });
  await prisma.settings.update({ where: { id: 1 }, data: { season: input.id, seasonCycle: cycle } });
  return getSeason(now);
}
