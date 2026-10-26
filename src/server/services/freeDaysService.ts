import { prisma } from "@/server/db";

/** Lugar de equipes e reservas: um dia de BAX/BAL (pelo id) ou a BAI. */
export interface TeamPlace {
  scope: string;
  battleDayId: string | null;
}

const samePlace = (a: TeamPlace, b: TeamPlace) => a.scope === b.scope && a.battleDayId === b.battleDayId;

/** Dias sem restrição de um modo (só BAX ou só BAL): os lugares que ficam iguais quando a sincronização está ligada. */
export async function freePlaces(mode: string): Promise<TeamPlace[]> {
  const days = await prisma.battleDay.findMany({ where: { mode, criteria: { none: {} } }, select: { id: true }, orderBy: { number: "asc" } });
  return days.map((d) => ({ scope: "DAY", battleDayId: d.id }));
}

export async function getFreeDaysSync(): Promise<{ sync: boolean }> {
  const s = await prisma.settings.findUnique({ where: { id: 1 }, select: { syncFreeDays: true } });
  return { sync: s?.syncFreeDays ?? true };
}

export async function setFreeDaysSync(sync: boolean): Promise<{ sync: boolean }> {
  await prisma.settings.update({ where: { id: 1 }, data: { syncFreeDays: sync } });
  return { sync };
}

/**
 * Depois de mudar as equipes ou as reservas de um dia livre, copia tudo dele para os outros dias
 * livres do mesmo modo (BAX só para BAX, BAL só para BAL), substituindo o que eles tinham. Não faz
 * nada se o dia tiver restrição, fora dos dias de BAX/BAL (a BAI e a BAL livre já são uma lista só)
 * ou se a sincronização estiver desligada. Devolve quantos lugares mudaram.
 */
export async function mirrorFreePlace(source: TeamPlace): Promise<number> {
  if (source.scope !== "DAY" || !source.battleDayId) return 0;
  const day = await prisma.battleDay.findUnique({ where: { id: source.battleDayId }, select: { mode: true } });
  if (!day) return 0;
  const [places, { sync }] = await Promise.all([freePlaces(day.mode), getFreeDaysSync()]);
  if (!sync || !places.some((p) => samePlace(p, source))) return 0;
  const targets = places.filter((p) => !samePlace(p, source));

  const [teams, entries] = await Promise.all([
    prisma.metaTeam.findMany({ where: source, include: { members: true }, orderBy: { position: "asc" } }),
    prisma.priorityEntry.findMany({ where: source }),
  ]);
  await prisma.$transaction([
    ...targets.flatMap((p) => [prisma.metaTeam.deleteMany({ where: p }), prisma.priorityEntry.deleteMany({ where: p })]),
    ...targets.flatMap((p) =>
      teams.map((t) =>
        prisma.metaTeam.create({
          data: {
            ...p,
            isPrimary: t.isPrimary,
            position: t.position,
            label: t.label,
            labelEn: t.labelEn,
            notes: t.notes,
            updatedById: t.updatedById,
            members: {
              create: t.members.map((m) => ({
                slot: m.slot,
                uniformId: m.uniformId,
                ctpId: m.ctpId,
                ctpSlot: m.ctpSlot,
                isDamageDealer: m.isDamageDealer,
                strikerUniformId: m.strikerUniformId,
              })),
            },
          },
        }),
      ),
    ),
    ...targets.map((p) =>
      prisma.priorityEntry.createMany({
        data: entries.map((e) => ({ ...p, role: e.role, rank: e.rank, uniformId: e.uniformId, ctpId: e.ctpId })),
      }),
    ),
  ]);
  return targets.length;
}
