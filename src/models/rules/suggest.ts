import type { Agent, Criterion, PriorityItem, PriorityLists } from "@/models/domain/types";
import type { UserTeam } from "@/models/schemas/selections";
import { matchesRestriction } from "./restriction";

/**
 * Melhor equipe possível com o elenco do usuário, seguindo as listas de prioridade dos curadores:
 * Solador possuído de menor rank cujo traje atende à restrição; depois 2 Suportes de agentes distintos.
 * Retorna `null` se nenhum slot puder ser preenchido.
 */
export function suggestTeam(
  ownedUniformIds: ReadonlySet<string>,
  priority: PriorityLists,
  criteria: readonly Criterion[],
  agentOf: (uniformId: string) => Agent | undefined,
): UserTeam | null {
  const usedAgents = new Set<string>();
  const eligible = (item: PriorityItem) => {
    const agent = agentOf(item.uniformId);
    const uniform = agent?.uniforms.find((u) => u.id === item.uniformId);
    return (
      !!agent &&
      agent.active &&
      !!uniform?.active &&
      ownedUniformIds.has(item.uniformId) &&
      !usedAgents.has(agent.id) &&
      matchesRestriction(uniform, criteria)
    );
  };
  const take = (list: PriorityItem[]) => {
    const item = [...list].sort((a, b) => a.rank - b.rank).find(eligible);
    if (!item) return undefined;
    usedAgents.add(agentOf(item.uniformId)!.id);
    return { uniformId: item.uniformId, ctpId: item.ctpId };
  };

  const team: UserTeam = {};
  const solo = take(priority.solo);
  if (solo) team.SOLO = solo;
  const s1 = take(priority.support);
  if (s1) team.SUPPORT_1 = s1;
  const s2 = take(priority.support);
  if (s2) team.SUPPORT_2 = s2;
  return Object.keys(team).length ? team : null;
}
