import type { MetaTeam, PriorityItem, PriorityLists } from "@/models/domain/types";

/**
 * Listas usadas na sugestão de equipe: geradas na hora das equipes do dia (Líderes da Meta e
 * das Alternativas; depois as demais posições), seguidas das reservas cadastradas pela administração.
 * Um uniforme aparece uma vez por lista; a sugestão ainda evita repetir o agente.
 */
export function effectivePriority(metaTeams: readonly MetaTeam[], reserves: PriorityLists): PriorityLists {
  const ordered = [...metaTeams].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const build = (fromTeams: { uniformId: string; ctpId: string | null }[], extra: PriorityItem[]): PriorityItem[] => {
    const seen = new Set<string>();
    return [...fromTeams, ...extra]
      .filter((i) => !seen.has(i.uniformId) && seen.add(i.uniformId))
      .map((i, idx) => ({ rank: idx + 1, uniformId: i.uniformId, ctpId: i.ctpId }));
  };
  const members = ordered.flatMap((t) => t.members);
  return {
    solo: build(members.filter((m) => m.slot === "SOLO"), reserves.solo),
    support: build(members.filter((m) => m.slot !== "SOLO"), reserves.support),
  };
}
