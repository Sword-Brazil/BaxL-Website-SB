import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export const metaTeamInclude = {
  members: true,
  battleDay: true,
  updatedBy: { select: { nickname: true } },
} satisfies Prisma.MetaTeamInclude;

export const metaTeamRepository = {
  listByScope: (scope: string, battleDayId: string | null = null) =>
    prisma.metaTeam.findMany({
      where: { scope, battleDayId },
      include: metaTeamInclude,
      orderBy: [{ isPrimary: "desc" }, { position: "asc" }, { updatedAt: "desc" }],
    }),
};
