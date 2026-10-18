import { CTP_QUALITIES, CTP_TYPES, type CtpQuality, type CtpType } from "@/models/domain/enums";
import type { CycleOverview, MetaTeam } from "@/models/domain/types";

export type StatsMode = "ALL" | "BAX" | "BAL" | "BAI";

export interface AgentRepetition {
  agentId: string;
  name: string;
  /** Aparições por semana do ciclo (S1–S4). */
  weeks: [number, number, number, number];
  total: number;
}

/**
 * Quantas vezes cada personagem aparece nas equipes do ciclo de 28 dias, por semana.
 * Conta uma aparição por equipe em que o personagem está (Meta e, se pedido, Alternativas).
 */
export function agentRepetition(
  cycle: CycleOverview,
  agentOf: (uniformId: string) => { id: string; name: string } | undefined,
  opts: { mode: StatsMode; includeAlternatives: boolean },
): AgentRepetition[] {
  const rows = new Map<string, AgentRepetition>();
  const count = (teams: MetaTeam[], week: number) => {
    const pool = opts.includeAlternatives ? teams : teams.filter((t, i) => (teams.some((x) => x.isPrimary) ? t.isPrimary : i === 0));
    for (const team of pool) {
      for (const m of team.members) {
        const agent = agentOf(m.uniformId);
        if (!agent) continue;
        const row = rows.get(agent.id) ?? { agentId: agent.id, name: agent.name, weeks: [0, 0, 0, 0], total: 0 };
        row.weeks[week - 1]++;
        row.total++;
        rows.set(agent.id, row);
      }
    }
  };
  for (const day of cycle.days) {
    if (day.isBai) {
      if (opts.mode === "ALL" || opts.mode === "BAI") count(cycle.bai.metaTeams, day.week);
      continue;
    }
    if ((opts.mode === "ALL" || opts.mode === "BAX") && day.bax) count(day.bax.metaTeams, day.week);
    if ((opts.mode === "ALL" || opts.mode === "BAL") && day.bal) count(day.bal.metaTeams, day.week);
  }
  return [...rows.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
}

export interface CtpUsage {
  type: CtpType;
  counts: Record<CtpQuality, number>;
  total: number;
  /** Personagens com este tipo de CTP equipado. */
  agents: { name: string; quality: CtpQuality }[];
}

/** Quantos e quais CTPs o usuário tem equipados nos seus personagens, por tipo e qualidade. */
export function ctpUsage(
  ctpByAgent: Record<string, string>,
  ctpOf: (ctpId: string) => { type: CtpType; quality: CtpQuality } | null,
  agentName: (agentId: string) => string | undefined,
): CtpUsage[] {
  const rows = new Map<CtpType, CtpUsage>(
    CTP_TYPES.map((type) => [type, { type, counts: { NORMAL: 0, MIGHTY: 0, BRILLIANT: 0 }, total: 0, agents: [] }]),
  );
  for (const [agentId, ctpId] of Object.entries(ctpByAgent)) {
    const ctp = ctpOf(ctpId);
    const name = agentName(agentId);
    if (!ctp || !name) continue;
    const row = rows.get(ctp.type)!;
    row.counts[ctp.quality]++;
    row.total++;
    row.agents.push({ name, quality: ctp.quality });
  }
  for (const row of rows.values()) {
    row.agents.sort((a, b) => CTP_QUALITIES.indexOf(b.quality) - CTP_QUALITIES.indexOf(a.quality) || a.name.localeCompare(b.name));
  }
  return [...rows.values()];
}
