import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { metaTeamInclude } from "./metaTeamRepository";

const dayInclude = {
  criteria: { orderBy: { attribute: "asc" } },
  metaTeams: { include: metaTeamInclude, orderBy: [{ isPrimary: "desc" }, { position: "asc" }, { updatedAt: "desc" }] },
  priorityEntries: { orderBy: { rank: "asc" } },
} satisfies Prisma.BattleDayInclude;

export const daysRepository = {
  listByMode: (mode: string) =>
    prisma.battleDay.findMany({ where: { mode }, include: dayInclude, orderBy: { number: "asc" } }),
  find: (mode: string, number: number) =>
    prisma.battleDay.findUnique({ where: { mode_number: { mode, number } }, include: dayInclude }),
};
