import type { PriorityLists } from "@/models/domain/types";
import type { PriorityInput, PriorityTarget } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { assertCtpsExist, assertRestriction, findBattleDay, loadActiveUniforms } from "./curationGuards";
import { mirrorFreePlace } from "./freeDaysService";
import { toPriority } from "./mappers";

async function resolve(target: PriorityTarget) {
  return target.scope === "DAY" ? await findBattleDay(target.mode, target.number) : null;
}

/** Reservas cadastradas (sem as equipes). */
export async function getPriority(target: PriorityTarget): Promise<PriorityLists> {
  const day = await resolve(target);
  const rows = await prisma.priorityEntry.findMany({ where: { scope: target.scope, battleDayId: day?.id ?? null } });
  return toPriority(rows);
}

/**
 * Substitui as reservas de um dia (ou da BAI): personagens além das equipes, usados na sugestão
 * depois da Meta e das Alternativas (ver effectivePriority). O rank vem da ordem da lista.
 * Apagar e reinserir garante a unicidade de rank também na BAI (battleDayId nulo).
 */
export async function savePriority(target: PriorityTarget, input: PriorityInput): Promise<PriorityLists> {
  const day = await resolve(target);
  const all = [...input.solo, ...input.support];
  const uniforms = await loadActiveUniforms([...new Set(all.map((i) => i.uniformId))]);
  await assertCtpsExist(all.flatMap((i) => (i.ctpId ? [i.ctpId] : [])));
  if (day) assertRestriction(uniforms, day.criteria);

  const battleDayId = day?.id ?? null;
  const rows = (["SOLO", "SUPPORT"] as const).flatMap((role) =>
    (role === "SOLO" ? input.solo : input.support).map((i, idx) => ({
      scope: target.scope,
      battleDayId,
      role,
      rank: idx + 1,
      uniformId: i.uniformId,
      ctpId: i.ctpId ?? null,
    })),
  );
  await prisma.$transaction([
    prisma.priorityEntry.deleteMany({ where: { scope: target.scope, battleDayId } }),
    prisma.priorityEntry.createMany({ data: rows }),
  ]);
  await mirrorFreePlace({ scope: target.scope, battleDayId });
  return getPriority(target);
}
