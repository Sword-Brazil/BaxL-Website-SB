import type { BalEffect, BaxEffect } from "@/models/domain/enums";
import type { Season } from "@/models/domain/types";
import type { SeasonInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";

/** Temporada atual (efeito que atordoa o chefe na BAX e na BAL). Sem Settings, a de lançamento. */
export async function getSeason(): Promise<Season> {
  const s = await prisma.settings.findUnique({ where: { id: 1 }, select: { baxEffect: true, balEffect: true } });
  return { BAX: (s?.baxEffect ?? "PARALYSIS") as BaxEffect, BAL: (s?.balEffect ?? "SHOCK") as BalEffect };
}

/** Troca a temporada: vale para todos os dias de BAX e de BAL. */
export async function setSeason(input: SeasonInput): Promise<Season> {
  await prisma.settings.update({ where: { id: 1 }, data: { baxEffect: input.BAX, balEffect: input.BAL } });
  return getSeason();
}
