import type { MetaTeam } from "@/models/domain/types";
import type { MetaTeamInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { normalizeRotation } from "@/models/rules/rotation";
import { HttpError } from "@/server/http";
import { metaTeamInclude } from "@/server/repositories/metaTeamRepository";
import { assertCtpsExist, assertRestriction, findBattleDay, loadActiveUniforms } from "./curationGuards";
import { toMetaTeam } from "./mappers";

/** Cria (sem `id`) ou edita uma equipe Meta, validando catálogo e restrição do dia. */
export async function saveMetaTeam(input: MetaTeamInput, userId: string, id?: string): Promise<MetaTeam> {
  const day = input.scope === "DAY" ? await findBattleDay(input.mode!, input.number!) : null;
  const battleDayId = day?.id ?? null;

  const uniforms = await loadActiveUniforms(input.members.map((m) => m.uniformId));
  if (new Set(uniforms.map((u) => u.agentId)).size !== uniforms.length) {
    throw new HttpError(400, "VALIDATION_ERROR", "O mesmo agente não pode ocupar dois slots");
  }
  await assertCtpsExist(input.members.flatMap((m) => (m.ctpId ? [m.ctpId] : [])));
  if (day) assertRestriction(uniforms, day.criteria);

  if (id && !(await prisma.metaTeam.findUnique({ where: { id } }))) {
    throw new HttpError(404, "NOT_FOUND", "Equipe não encontrada");
  }

  const data = {
    scope: input.scope,
    battleDayId,
    isPrimary: input.isPrimary,
    label: input.label || null,
    notes: input.notes || null,
    updatedById: userId,
  };
  const members = input.members.map((m) => {
    // Rotação só para Causador de Dano; descrição e vídeo só existem junto com uma rotação.
    const rotation = m.isDamageDealer ? normalizeRotation(m.rotation) : null;
    return {
      slot: m.slot,
      uniformId: m.uniformId,
      ctpId: m.ctpId ?? null,
      isDamageDealer: !!m.isDamageDealer,
      rotation,
      rotationNotes: rotation ? m.rotationNotes || null : null,
      rotationVideoUrl: rotation ? m.rotationVideoUrl || null : null,
    };
  });

  const saved = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.metaTeam.updateMany({
        where: { scope: input.scope, battleDayId, isPrimary: true, ...(id ? { NOT: { id } } : {}) },
        data: { isPrimary: false },
      });
    }
    if (id) {
      await tx.metaTeamMember.deleteMany({ where: { metaTeamId: id } });
      return tx.metaTeam.update({ where: { id }, data: { ...data, members: { create: members } }, include: metaTeamInclude });
    }
    return tx.metaTeam.create({ data: { ...data, members: { create: members } }, include: metaTeamInclude });
  });
  return toMetaTeam(saved);
}

export async function deleteMetaTeam(id: string) {
  const { count } = await prisma.metaTeam.deleteMany({ where: { id } });
  if (count === 0) throw new HttpError(404, "NOT_FOUND", "Equipe não encontrada");
}

/** Lista para o editor: equipes de um escopo (e dia, se DAY). */
export async function listMetaTeams(scope: string, battleDayId: string | null) {
  const rows = await prisma.metaTeam.findMany({
    where: { scope, battleDayId },
    include: metaTeamInclude,
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map(toMetaTeam);
}
