import { prisma } from "@/server/db";

/** Lugar de equipes e reservas: um dia de BAX/BAL (pelo id) ou a BAI. */
export interface TeamPlace {
  scope: string;
  battleDayId: string | null;
}

const samePlace = (a: TeamPlace, b: TeamPlace) => a.scope === b.scope && a.battleDayId === b.battleDayId;

/** Dias de BAX/BAL sem restrição e a BAI: os lugares que ficam iguais quando a sincronização está ligada. */
export async function freePlaces(): Promise<TeamPlace[]> {
  const days = await prisma.battleDay.findMany({ where: { criteria: { none: {} } }, select: { id: true }, orderBy: [{ mode: "asc" }, { number: "asc" }] });
  return [...days.map((d) => ({ scope: "DAY", battleDayId: d.id })), { scope: "BAI", battleDayId: null }];
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
 * Depois de mudar as equipes ou as reservas de um dia livre (ou da BAI), copia tudo dele para os
 * outros dias livres e a BAI, substituindo o que eles tinham. Não faz nada se o lugar tiver
 * restrição, se for a BAL livre ou se a sincronização estiver desligada. Devolve quantos lugares mudaram.
 */
export async function mirrorFreePlace(source: TeamPlace): Promise<number> {
  if (source.scope !== "DAY" && source.scope !== "BAI") return 0;
  const [places, { sync }] = await Promise.all([freePlaces(), getFreeDaysSync()]);
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
