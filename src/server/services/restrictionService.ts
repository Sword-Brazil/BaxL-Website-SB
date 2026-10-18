import type { DayMode } from "@/models/domain/enums";
import type { Criterion } from "@/models/domain/types";
import { prisma } from "@/server/db";
import { findBattleDay } from "./curationGuards";

/** Substitui os critérios (combinados com "E") da restrição de um dia de BAX/BAL. */
export async function setRestriction(mode: DayMode, number: number, criteria: Criterion[]): Promise<Criterion[]> {
  const day = await findBattleDay(mode, number);
  await prisma.$transaction([
    prisma.restrictionCriterion.deleteMany({ where: { battleDayId: day.id } }),
    prisma.restrictionCriterion.createMany({
      data: criteria.map((c) => ({ battleDayId: day.id, attribute: c.attribute, value: c.value })),
    }),
  ]);
  return criteria;
}
