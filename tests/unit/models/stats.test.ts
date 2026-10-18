import { describe, expect, it } from "vitest";
import type { CycleOverview, MetaTeam } from "@/models/domain/types";
import { agentRepetition, ctpUsage } from "@/models/rules/stats";

const team = (isPrimary: boolean, uniforms: [string, string, string]): MetaTeam => ({
  id: uniforms.join(),
  scope: "DAY",
  mode: null,
  dayNumber: null,
  isPrimary,
  label: null,
  notes: null,
  updatedAt: "",
  updatedBy: null,
  members: (["SOLO", "SUPPORT_1", "SUPPORT_2"] as const).map((slot, i) => ({ slot, uniformId: uniforms[i], ctpId: null })),
});
const modeDay = (teams: MetaTeam[]) => ({ criteria: [], metaTeams: teams, priority: { solo: [], support: [] } });

const cycle: CycleOverview = {
  days: [
    { number: 1, weekday: "QUI", week: 1, isBai: false, bax: modeDay([team(true, ["a", "b", "c"]), team(false, ["a", "d", "e"])]), bal: modeDay([team(true, ["a", "x", "y"])]) },
    { number: 3, weekday: "SÁB", week: 1, isBai: true, bax: null, bal: null },
    { number: 8, weekday: "QUI", week: 2, isBai: false, bax: modeDay([team(true, ["a", "b", "z"])]), bal: modeDay([]) },
  ],
  bai: { metaTeams: [team(true, ["b", "q", "w"])], bosses: [], priority: { solo: [], support: [] } },
};
const agentOf = (u: string) => ({ id: u, name: u.toUpperCase() });

describe("agentRepetition", () => {
  it("conta aparições por semana nas equipes Meta (BAX, BAL e BAI)", () => {
    const rows = agentRepetition(cycle, agentOf, { mode: "ALL", includeAlternatives: false });
    expect(rows[0]).toEqual({ agentId: "a", name: "A", weeks: [2, 1, 0, 0], total: 3 });
    expect(rows.find((r) => r.agentId === "b")?.weeks).toEqual([2, 1, 0, 0]); // BAX D1 + BAI D3 + BAX D8
    expect(rows.some((r) => r.agentId === "d")).toBe(false);
  });

  it("inclui alternativas quando pedido e filtra por modo", () => {
    const withAlt = agentRepetition(cycle, agentOf, { mode: "BAX", includeAlternatives: true });
    expect(withAlt.find((r) => r.agentId === "a")?.total).toBe(3);
    expect(withAlt.some((r) => r.agentId === "x")).toBe(false);
  });
});

describe("ctpUsage", () => {
  it("agrupa os CTPs equipados por tipo e qualidade, com os personagens", () => {
    const ctps: Record<string, { type: "RAGE" | "INSIGHT"; quality: "NORMAL" | "BRILLIANT" }> = {
      rb: { type: "RAGE", quality: "BRILLIANT" },
      rn: { type: "RAGE", quality: "NORMAL" },
      ib: { type: "INSIGHT", quality: "BRILLIANT" },
    };
    const rows = ctpUsage({ wanda: "rb", storm: "rn", luna: "ib", ghost: "rb" }, (id) => ctps[id] ?? null, (id) => (id === "ghost" ? undefined : id));
    const rage = rows.find((r) => r.type === "RAGE")!;
    expect(rage.counts).toEqual({ NORMAL: 1, MIGHTY: 0, BRILLIANT: 1 });
    expect(rage.agents.map((a) => a.name)).toEqual(["wanda", "storm"]);
    expect(rows.find((r) => r.type === "INSIGHT")?.total).toBe(1);
    expect(rows).toHaveLength(6);
  });
});
