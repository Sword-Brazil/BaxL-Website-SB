import { BAI_DAYS, CTP_QUALITIES, CTP_TYPES, SLOTS, WEEK_LENGTH, type CtpQuality, type CtpType, type Slot } from "@/models/domain/enums";
import type { CycleOverview, MetaTeam } from "@/models/domain/types";
import { TEAM_KEY_RE, type UserTeam } from "@/models/schemas/selections";

export type StatsMode = "ALL" | "BAX" | "BAL" | "BAI";
/** Papel na equipe: Causador de Dano, ou Suporte/Líder (quem não é o Causador de Dano). */
export type StatsRole = "ALL" | "DAMAGE" | "SUPPORT";

/** Se a aparição entra no filtro de papel. */
const roleMatches = (role: StatsRole, damageDealer: boolean) => role === "ALL" || (role === "DAMAGE") === damageDealer;

/** Uma aparição do personagem: modo, dia do ciclo e o CTP que ele usa nela. */
export interface AgentUse {
  mode: "BAX" | "BAL" | "BAI";
  day: number;
  ctpId: string | null;
}

export interface AgentRepetition {
  agentId: string;
  name: string;
  /** Aparições por semana do ciclo (S1–S4). */
  weeks: [number, number, number, number];
  total: number;
  /** Cada aparição, na ordem do ciclo. */
  uses: AgentUse[];
}

const newRow = (agent: { id: string; name: string }): AgentRepetition => ({
  agentId: agent.id,
  name: agent.name,
  weeks: [0, 0, 0, 0],
  total: 0,
  uses: [],
});

const byTotal = (a: AgentRepetition, b: AgentRepetition) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR");
const useOrder = (u: AgentUse) => u.day * 3 + ["BAX", "BAL", "BAI"].indexOf(u.mode);

/** CTPs que o personagem usa nas aparições, do mais usado para o menos (sem CTP não conta). */
export function ctpsOfUses(uses: AgentUse[]): { ctpId: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const u of uses) if (u.ctpId) counts.set(u.ctpId, (counts.get(u.ctpId) ?? 0) + 1);
  return [...counts].map(([ctpId, count]) => ({ ctpId, count })).sort((a, b) => b.count - a.count);
}

/**
 * Quantas vezes cada personagem aparece nas equipes do ciclo de 28 dias, por semana.
 * Conta uma aparição por equipe em que o personagem está (Meta e, se pedido, Alternativas). Com
 * `role`, só as aparições como Causador de Dano (ou só como Suporte/Líder).
 */
export function agentRepetition(
  cycle: CycleOverview,
  agentOf: (uniformId: string) => { id: string; name: string } | undefined,
  opts: { mode: StatsMode; includeAlternatives: boolean; role?: StatsRole },
): AgentRepetition[] {
  const rows = new Map<string, AgentRepetition>();
  const count = (teams: MetaTeam[], where: { mode: AgentUse["mode"]; day: number; week: number }) => {
    const pool = opts.includeAlternatives ? teams : teams.filter((t, i) => (teams.some((x) => x.isPrimary) ? t.isPrimary : i === 0));
    for (const team of pool) {
      for (const m of team.members) {
        const agent = agentOf(m.uniformId);
        if (!agent || !roleMatches(opts.role ?? "ALL", m.isDamageDealer)) continue;
        const row = rows.get(agent.id) ?? newRow(agent);
        row.weeks[where.week - 1]++;
        row.total++;
        row.uses.push({ mode: where.mode, day: where.day, ctpId: m.ctpId });
        rows.set(agent.id, row);
      }
    }
  };
  for (const day of cycle.days) {
    const at = (mode: AgentUse["mode"]) => ({ mode, day: day.number, week: day.week });
    if (day.isBai) {
      if (opts.mode === "ALL" || opts.mode === "BAI") count(cycle.bai.metaTeams, at("BAI"));
      continue;
    }
    if ((opts.mode === "ALL" || opts.mode === "BAX") && day.bax) count(day.bax.metaTeams, at("BAX"));
    if ((opts.mode === "ALL" || opts.mode === "BAL") && day.bal) count(day.bal.metaTeams, at("BAL"));
  }
  return [...rows.values()].sort(byTotal);
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
    const members = SLOTS.flatMap((slot) => (team[slot] ? [{ slot, uniformId: team[slot]!.uniformId, pick: team[slot]! }] : []));
    return where && members.length && (mode === "ALL" || mode === where.mode) ? [{ ...where, key, members }] : [];
  });

/**
 * Como agentRepetition, mas nas equipes montadas pelo usuário. A equipe da BAI vale para os quatro
 * dias de BAI do ciclo (uma aparição por semana), igual à contagem das Metas. `ctpOf` dá o CTP que
 * o personagem usa na equipe (o do slot escolhido no dia). Nas equipes do usuário, o Causador de
 * Dano é quem tem Striker escolhido (o único sinal que a equipe salva tem).
 */
export function myAgentRepetition(
  teams: Record<string, UserTeam>,
  agentOf: AgentOf,
  mode: StatsMode,
  ctpOf: (pick: NonNullable<UserTeam[Slot]>, agentId: string) => string | null = (pick) => pick.ctpId ?? null,
  role: StatsRole = "ALL",
): AgentRepetition[] {
  const rows = new Map<string, AgentRepetition>();
  for (const team of filledTeams(teams, mode)) {
    const days = team.day ? [team.day] : [...BAI_DAYS];
    for (const m of team.members) {
      const agent = agentOf(m.uniformId);
      if (!agent || !roleMatches(role, !!m.pick.strikerUniformId)) continue;
      const row = rows.get(agent.id) ?? newRow(agent);
      const ctpId = ctpOf(m.pick, agent.id);
      for (const day of days) {
        row.weeks[weekOf(day) - 1]++;
        row.uses.push({ mode: team.mode, day, ctpId });
      }
      row.total += days.length;
      rows.set(agent.id, row);
    }
  }
  for (const row of rows.values()) row.uses.sort((a, b) => useOrder(a) - useOrder(b));
  return [...rows.values()].sort(byTotal);
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
    const group = groups.get(id) ?? { id, members: team.members.map(({ slot, uniformId }) => ({ slot, uniformId })), usages: [] };
    group.usages.push({ mode: team.mode, day: team.day });
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => b.usages.length - a.usages.length || order(a.usages[0]) - order(b.usages[0]));
}

export interface CtpUsage {
  type: CtpType;
  counts: Record<CtpQuality, number>;
  total: number;
  /** Personagens com este tipo de CTP equipado (no slot 1 ou 2). */
  agents: { agentId: string; name: string; quality: CtpQuality; ctpId: string; slot: 1 | 2 }[];
}

/** Quantos e quais CTPs o usuário tem equipados nos seus personagens (slots 1 e 2), por tipo e qualidade. */
export function ctpUsage(
  equipped: { agentId: string; ctpId: string; slot: 1 | 2 }[],
  ctpOf: (ctpId: string) => { type: CtpType; quality: CtpQuality } | null,
  agentName: (agentId: string) => string | undefined,
): CtpUsage[] {
  const rows = new Map<CtpType, CtpUsage>(
    CTP_TYPES.map((type) => [type, { type, counts: { NORMAL: 0, MIGHTY: 0, BRILLIANT: 0 }, total: 0, agents: [] }]),
  );
  for (const { agentId, ctpId, slot } of equipped) {
    const ctp = ctpOf(ctpId);
    const name = agentName(agentId);
    if (!ctp || !name) continue;
    const row = rows.get(ctp.type)!;
    row.counts[ctp.quality]++;
    row.total++;
    row.agents.push({ agentId, name, quality: ctp.quality, ctpId, slot });
  }
  for (const row of rows.values()) {
    row.agents.sort((a, b) => CTP_QUALITIES.indexOf(b.quality) - CTP_QUALITIES.indexOf(a.quality) || a.name.localeCompare(b.name));
  }
  return [...rows.values()];
}
