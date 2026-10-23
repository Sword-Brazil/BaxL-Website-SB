import { prisma } from "@/server/db";

export const catalogRepository = {
  listAgents: () =>
    prisma.agent.findMany({
      orderBy: { name: "asc" },
      include: { uniforms: { orderBy: { name: "asc" } } },
    }),
  listCtps: () => prisma.ctp.findMany(),
  /** Causadores de Dano das equipes Meta, com o lugar da equipe (para os modos em que pontuam). */
  listDamageDealers: () =>
    prisma.metaTeamMember.findMany({
      where: { isDamageDealer: true },
      select: { uniform: { select: { agentId: true } }, metaTeam: { select: { scope: true, battleDay: { select: { mode: true } } } } },
    }),
};
