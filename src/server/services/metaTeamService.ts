import type { Prisma } from "@prisma/client";
import type { MetaTeam } from "@/models/domain/types";
import { slotCtpId } from "@/models/rules/ctpAssign";
import type { MetaTeamInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { metaTeamInclude } from "@/server/repositories/metaTeamRepository";
import { assertCtpsExist, assertRestriction, findBattleDay, loadActiveUniforms } from "./curationGuards";
import { mirrorFreePlace } from "./freeDaysService";
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

/**
 * Troca os CTPs 1 e 2 da Meta do personagem e atualiza o CTP de todos os membros que usam cada slot,
 * em qualquer dia: o CTP fica no personagem, cada equipe só escolhe o slot.
 */
async function syncAgentMetaCtps(tx: Prisma.TransactionClient, agentId: string, ctp1: string | null, ctp2: string | null) {
  await tx.agent.update({ where: { id: agentId }, data: { metaCtp1Id: ctp1, metaCtp2Id: ctp2 } });
  await tx.metaTeamMember.updateMany({ where: { ctpSlot: 1, uniform: { agentId } }, data: { ctpId: slotCtpId(ctp1, ctp2, 1) } });
  await tx.metaTeamMember.updateMany({ where: { ctpSlot: 2, uniform: { agentId } }, data: { ctpId: slotCtpId(ctp1, ctp2, 2) } });
}

/** Cria (sem `id`) ou edita uma equipe Meta, validando catálogo e restrição do dia. */
export async function saveMetaTeam(input: MetaTeamInput, userId: string, id?: string): Promise<MetaTeam> {
  const day = input.scope === "DAY" ? await findBattleDay(input.mode!, input.number!) : null;
  const battleDayId = day?.id ?? null;

  const uniforms = await loadActiveUniforms(input.members.map((m) => m.uniformId));
  if (new Set(uniforms.map((u) => u.agentId)).size !== uniforms.length) {
    throw new HttpError(400, "VALIDATION_ERROR", "O mesmo agente não pode ocupar dois slots");
  }
  await assertCtpsExist(input.members.flatMap((m) => [m.ctpId, m.agentCtp1Id, m.agentCtp2Id].filter((c): c is string => !!c)));
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
    labelEn: input.labelEn || null,
    notes: input.notes || null,
    updatedById: userId,
  };
  const agentIdOf = (uniformId: string) => uniforms.find((u) => u.id === uniformId)!.agentId;

  const saved = await prisma.$transaction(async (tx) => {
    // CTPs 1/2 de cada personagem (novos ou os do catálogo) e o CTP do slot que a equipe usa.
    const ctpOfSlot = new Map<string, string | null>();
    for (const m of input.members) {
      const agentId = agentIdOf(m.uniformId);
      const agent = await tx.agent.findUniqueOrThrow({ where: { id: agentId }, select: { metaCtp1Id: true, metaCtp2Id: true } });
      const ctp1 = m.agentCtp1Id === undefined ? agent.metaCtp1Id : m.agentCtp1Id;
      const ctp2 = m.agentCtp2Id === undefined ? agent.metaCtp2Id : m.agentCtp2Id;
      if (ctp1 !== agent.metaCtp1Id || ctp2 !== agent.metaCtp2Id) await syncAgentMetaCtps(tx, agentId, ctp1, ctp2);
      ctpOfSlot.set(m.slot, m.ctpSlot ? slotCtpId(ctp1, ctp2, m.ctpSlot) : (m.ctpId ?? null));
    }
    const members = input.members.map((m) => ({
      slot: m.slot,
      uniformId: m.uniformId,
      ctpId: ctpOfSlot.get(m.slot) ?? null,
      ctpSlot: m.ctpSlot ?? null,
      isDamageDealer: !!m.isDamageDealer,
      // Só o Causador de Dano tem Striker.
      strikerUniformId: m.isDamageDealer ? (m.strikerUniformId ?? null) : null,
    }));

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
    // Equipe nova entra no fim da lista do dia.
    const last = await tx.metaTeam.aggregate({ where: { scope: input.scope, battleDayId }, _max: { position: true } });
    return tx.metaTeam.create({
      data: { ...data, position: (last._max.position ?? 0) + 1, members: { create: members } },
      include: metaTeamInclude,
    });
  });
  await mirrorFreePlace({ scope: input.scope, battleDayId });
  return toMetaTeam(saved);
}

/**
 * Nova ordem das equipes de um mesmo escopo e dia (a principal continua sempre primeiro). Todas
 * precisam ser do mesmo lugar; as que não vierem na lista ficam depois, na ordem em que estavam.
 */
export async function reorderMetaTeams(ids: string[]): Promise<void> {
  const teams = await prisma.metaTeam.findMany({ where: { id: { in: ids } }, select: { id: true, scope: true, battleDayId: true } });
  if (teams.length !== new Set(ids).size) throw new HttpError(404, "NOT_FOUND", "Equipe não encontrada");
  const places = new Set(teams.map((t) => `${t.scope}#${t.battleDayId ?? ""}`));
  if (places.size !== 1) throw new HttpError(400, "VALIDATION_ERROR", "As equipes precisam ser do mesmo dia");
  const { scope, battleDayId } = teams[0];
  const others = await prisma.metaTeam.findMany({
    where: { scope, battleDayId, id: { notIn: ids } },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    select: { id: true },
  });
  await prisma.$transaction([...ids, ...others.map((o) => o.id)].map((id, i) => prisma.metaTeam.update({ where: { id }, data: { position: i + 1 } })));
  await mirrorFreePlace({ scope, battleDayId });
}

export async function deleteMetaTeam(id: string) {
  const team = await prisma.metaTeam.findUnique({ where: { id }, select: { scope: true, battleDayId: true } });
  const { count } = await prisma.metaTeam.deleteMany({ where: { id } });
  if (count === 0 || !team) throw new HttpError(404, "NOT_FOUND", "Equipe não encontrada");
  await mirrorFreePlace(team);
}

/** Lista para o editor: equipes de um escopo (e dia, se DAY). */
export async function listMetaTeams(scope: string, battleDayId: string | null) {
  const rows = await prisma.metaTeam.findMany({
    where: { scope, battleDayId },
    include: metaTeamInclude,
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(toMetaTeam);
}
