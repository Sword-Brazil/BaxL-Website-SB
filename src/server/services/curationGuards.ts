import { isBaiDay, type DayMode } from "@/models/domain/enums";
import type { Criterion } from "@/models/domain/types";
import { matchesRestriction } from "@/models/rules/restriction";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { toCriteria } from "./mappers";

/** BattleDay de BAX/BAL com seus critérios; 404 para dias de BAI ou inexistentes. */
export async function findBattleDay(mode: DayMode, number: number) {
  const day = isBaiDay(number)
    ? null
    : await prisma.battleDay.findUnique({ where: { mode_number: { mode, number } }, include: { criteria: true } });
  if (!day) throw new HttpError(404, "NOT_FOUND", "Dia não encontrado");
  return { id: day.id, criteria: toCriteria(day.criteria) };
}

/** Garante uniformes e agentes existentes e ativos; retorna os uniformes com o agente. */
export async function loadActiveUniforms(uniformIds: string[]) {
  const uniforms = await prisma.uniform.findMany({ where: { id: { in: uniformIds } }, include: { agent: true } });
  const byId = new Map(uniforms.map((u) => [u.id, u]));
  for (const id of uniformIds) {
    const u = byId.get(id);
    if (!u) throw new HttpError(400, "VALIDATION_ERROR", "Uniforme não encontrado no catálogo");
    if (!u.active || !u.agent.active) {
      throw new HttpError(400, "VALIDATION_ERROR", `Uniforme indisponível: ${u.agent.name} (${u.name})`);
    }
  }
  return uniformIds.map((id) => byId.get(id)!);
}

export async function assertCtpsExist(ctpIds: string[]) {
  const unique = [...new Set(ctpIds)];
  const count = await prisma.ctp.count({ where: { id: { in: unique } } });
  if (count !== unique.length) throw new HttpError(400, "VALIDATION_ERROR", "CTP não encontrado");
}

/** 422 se algum agente não atender à restrição do dia. */
export function assertRestriction(
  uniforms: Awaited<ReturnType<typeof loadActiveUniforms>>,
  criteria: Criterion[],
) {
  const offenders = uniforms.filter(
    (u) =>
      !matchesRestriction(
        { gender: u.agent.gender, side: u.agent.side, species: u.agent.species, attackType: u.agent.attackType } as never,
        criteria,
      ),
  );
  if (offenders.length > 0) {
    throw new HttpError(
      422,
      "RESTRICTION_VIOLATION",
      `Não atende à restrição do dia: ${offenders.map((u) => u.agent.name).join(", ")}`,
    );
  }
}
