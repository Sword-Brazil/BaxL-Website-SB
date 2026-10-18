import { prisma } from "@/server/db";

export const catalogRepository = {
  listAgents: () =>
    prisma.agent.findMany({
      orderBy: { name: "asc" },
      include: { uniforms: { orderBy: { name: "asc" } } },
    }),
  listCtps: () => prisma.ctp.findMany(),
};
