import type { MetaTeam } from "@/models/domain/types";
import type { MetaTeamInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { metaTeamInclude } from "@/server/repositories/metaTeamRepository";
import { assertCtpsExist, assertRestriction, findBattleDay, loadActiveUniforms } from "./curationGuards";
import { toMetaTeam } from "./mappers";

/** Strikers dos Causadores de Dano: trajes ativos do catálogo, de um personagem diferente do próprio. */
async function assertStrikers(members: MetaTeamInput["members"], uniforms: { id: string; agentId: string }[]) {
  const picks = members.filter((m) => m.isDamageDealer && m.strikerUniformId);
  if (!picks.length) return;
  const strikers = await prisma.uniform.findMany({
    where: { id: { in: picks.map((m) => m.strikerUniformId!) }, active: true, agent: { active: true } },
    select: { id: true, agentId: true },
  });
  for (const m of picks) {
    const striker = strikers.find((s) => s.id === m.strikerUniformId);
    if (!striker) throw new HttpError(400, "VALIDATION_ERROR", "Striker não encontrado no catálogo");
    if (striker.agentId === uniforms.find((u) => u.id === m.uniformId)?.agentId) {
      throw new HttpError(400, "VALIDATION_ERROR", "O Striker precisa ser outro personagem");
    }
  }
}

/** Cria (sem `id`) ou edita uma equipe Meta, validando catálogo e restrição do dia. */
export async function saveMetaTeam(input: MetaTeamInput, userId: string, id?: string): Promise<MetaTeam> {
  const day = input.scope === "DAY" ? await findBattleDay(input.mode!, input.number!) : null;
  const battleDayId = day?.id ?? null;

  const uniforms = await loadActiveUniforms(input.members.map((m) => m.uniformId));
  if (new Set(uniforms.map((u) => u.agentId)).size !== uniforms.length) {
    throw new HttpError(400, "VALIDATION_ERROR", "O mesmo agente não pode ocupar dois slots");
  }
  await assertCtpsExist(input.members.flatMap((m) => (m.ctpId ? [m.ctpId] : [])));
  await assertStrikers(input.members, uniforms);
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
  const members = input.members.map((m) => ({
    slot: m.slot,
    uniformId: m.uniformId,
    ctpId: m.ctpId ?? null,
    isDamageDealer: !!m.isDamageDealer,
    // Só o Causador de Dano tem Striker.
    strikerUniformId: m.isDamageDealer ? (m.strikerUniformId ?? null) : null,
  }));

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
