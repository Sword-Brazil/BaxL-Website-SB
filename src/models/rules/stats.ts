import { BAI_DAYS, CTP_QUALITIES, CTP_TYPES, SLOTS, WEEK_LENGTH, type CtpQuality, type CtpType, type Slot } from "@/models/domain/enums";
import type { CycleOverview, MetaTeam } from "@/models/domain/types";
import { TEAM_KEY_RE, type UserTeam } from "@/models/schemas/selections";

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

type AgentOf = (uniformId: string) => { id: string; name: string } | undefined;
const weekOf = (day: number) => Math.ceil(day / WEEK_LENGTH);

/** Modo e dia de uma equipe salva pelo usuário ("BAX-5", "BAL-12" ou "BAI"). */
function parseTeamKey(key: string): { mode: "BAX" | "BAL" | "BAI"; day: number | null } | null {
  if (key === "BAI") return { mode: "BAI", day: null };
  const m = TEAM_KEY_RE.exec(key);
  return m ? { mode: m[1] as "BAX" | "BAL", day: Number(m[2]) } : null;
}

const filledTeams = (teams: Record<string, UserTeam>, mode: StatsMode) =>
  Object.entries(teams).flatMap(([key, team]) => {
    const where = parseTeamKey(key);
    const members = SLOTS.flatMap((slot) => (team[slot] ? [{ slot, uniformId: team[slot]!.uniformId }] : []));
    return where && members.length && (mode === "ALL" || mode === where.mode) ? [{ ...where, key, members }] : [];
  });

/**
 * Como agentRepetition, mas nas equipes montadas pelo usuário. A equipe da BAI vale para os quatro
 * dias de BAI do ciclo (uma aparição por semana), igual à contagem das Metas.
 */
export function myAgentRepetition(teams: Record<string, UserTeam>, agentOf: AgentOf, mode: StatsMode): AgentRepetition[] {
  const rows = new Map<string, AgentRepetition>();
  for (const team of filledTeams(teams, mode)) {
    const weeks = team.day ? [weekOf(team.day)] : BAI_DAYS.map(weekOf);
    for (const m of team.members) {
      const agent = agentOf(m.uniformId);
      if (!agent) continue;
      const row = rows.get(agent.id) ?? { agentId: agent.id, name: agent.name, weeks: [0, 0, 0, 0], total: 0 };
      for (const w of weeks) row.weeks[w - 1]++;
      row.total += weeks.length;
      rows.set(agent.id, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
}

export interface TeamComposition {
  /** Mesmo Líder e mesmos Suportes (em qualquer posição), pelos personagens. */
  id: string;
  /** Membros como na primeira vez em que a equipe aparece. */
  members: { slot: Slot; uniformId: string }[];
  /** Onde a equipe foi usada. */
  usages: { mode: "BAX" | "BAL" | "BAI"; day: number | null }[];
}

/** Todas as equipes do usuário, agrupadas pela composição e ordenadas pelas que mais se repetem. */
export function myTeamCompositions(teams: Record<string, UserTeam>, agentOf: AgentOf, mode: StatsMode): TeamComposition[] {
  const groups = new Map<string, TeamComposition>();
  const order = (t: { mode: string; day: number | null }) => (t.day ?? 99) * 2 + (t.mode === "BAL" ? 1 : 0);
  for (const team of filledTeams(teams, mode).sort((a, b) => order(a) - order(b))) {
    const agentIds = (slots: (m: { slot: Slot }) => boolean) =>
      team.members.filter(slots).map((m) => agentOf(m.uniformId)?.id ?? m.uniformId);
    const id = `${agentIds((m) => m.slot === "SOLO").join()}|${agentIds((m) => m.slot !== "SOLO").sort().join()}`;
    const group = groups.get(id) ?? { id, members: team.members, usages: [] };
    group.usages.push({ mode: team.mode, day: team.day });
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => b.usages.length - a.usages.length || order(a.usages[0]) - order(b.usages[0]));
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
