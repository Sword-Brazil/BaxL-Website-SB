import type { BaiBoss, BaiContent } from "@/models/domain/types";
import { getBattleClock } from "@/models/rules/battleClock";
import type { BaiBossesInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { metaTeamRepository } from "@/server/repositories/metaTeamRepository";
import { toMetaTeam } from "./mappers";
import { getPriority } from "./priorityService";
import { getSettings } from "./settingsService";

const toBoss = (b: { id: string; position: number; name: string; imagePath: string | null; tips: string | null }): BaiBoss => ({
  id: b.id,
  position: b.position,
  name: b.name,
  imagePath: b.imagePath,
  tips: b.tips,
});

export async function listBosses(): Promise<BaiBoss[]> {
  return (await prisma.baiBoss.findMany({ orderBy: { position: "asc" } })).map(toBoss);
}

/** Substitui a sequência única de chefes da BAI. */
export async function saveBosses(input: BaiBossesInput): Promise<BaiBoss[]> {
  await prisma.$transaction([
    prisma.baiBoss.deleteMany(),
    prisma.baiBoss.createMany({
      data: input.map((b) => ({ position: b.position, name: b.name, imagePath: b.imagePath ?? null, tips: b.tips ?? null })),
    }),
  ]);
  return listBosses();
}

/** Conteúdo público da BAI: chefes, equipes recomendadas, prioridade e início da próxima BAI. */
export async function getPublicBai(now = new Date()): Promise<BaiContent> {
  const [bosses, teams, priority, settings] = await Promise.all([
    listBosses(),
    metaTeamRepository.listByScope("BAI"),
    getPriority({ scope: "BAI" }),
    getSettings(),
  ]);
  return { bosses, metaTeams: teams.map(toMetaTeam), priority, nextStart: getBattleClock(now, settings).nextBaiStart };
}
