import { describe, expect, it } from "vitest";
import type { CycleOverview, MetaTeam } from "@/models/domain/types";

const NO_ROTATION = { isDamageDealer: false, strikerUniformId: null, ctpSlot: null, rotation: null, rotationNotes: null, rotationVideoUrl: null };
import { agentRepetition, ctpsOfUses, ctpUsage, myAgentRepetition, myTeamCompositions } from "@/models/rules/stats";

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
  members: (["SOLO", "SUPPORT_1", "SUPPORT_2"] as const).map((slot, i) => ({ slot, uniformId: uniforms[i], ctpId: null, ...NO_ROTATION })),
});
const EMPTY = { solo: [], support: [] };
const modeDay = (teams: MetaTeam[]) => ({ criteria: [], metaTeams: teams, priority: EMPTY, reserves: EMPTY });

const cycle: CycleOverview = {
  season: { BAX: "PARALYSIS", BAL: "SHOCK" },
  days: [
    { number: 1, weekday: "QUI", week: 1, isBai: false, bax: modeDay([team(true, ["a", "b", "c"]), team(false, ["a", "d", "e"])]), bal: modeDay([team(true, ["a", "x", "y"])]) },
    { number: 3, weekday: "SÁB", week: 1, isBai: true, bax: null, bal: null },
    { number: 8, weekday: "QUI", week: 2, isBai: false, bax: modeDay([team(true, ["a", "b", "z"])]), bal: modeDay([]) },
  ],
  bai: { metaTeams: [team(true, ["b", "q", "w"])], bosses: [], priority: EMPTY, reserves: EMPTY },
};
const agentOf = (u: string) => ({ id: u, name: u.toUpperCase() });

describe("agentRepetition", () => {
  it("conta aparições por semana nas equipes Meta (BAX, BAL e BAI)", () => {
    const rows = agentRepetition(cycle, agentOf, { mode: "ALL", includeAlternatives: false });
    expect(rows[0]).toMatchObject({ agentId: "a", name: "A", weeks: [2, 1, 0, 0], total: 3 });
    expect(rows[0].uses.map((u) => `${u.mode}-${u.day}`)).toEqual(["BAX-1", "BAL-1", "BAX-8"]);
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
    const equipped = Object.entries({ wanda: "rb", storm: "rn", luna: "ib", ghost: "rb" }).map(([agentId, ctpId]) => ({ agentId, ctpId, slot: 1 as const }));
    const rows = ctpUsage(equipped, (id) => ctps[id] ?? null, (id) => (id === "ghost" ? undefined : id));
    const rage = rows.find((r) => r.type === "RAGE")!;
    expect(rage.counts).toEqual({ NORMAL: 1, MIGHTY: 0, BRILLIANT: 1 });
    expect(rage.agents.map((a) => a.name)).toEqual(["wanda", "storm"]);
    expect(rows.find((r) => r.type === "INSIGHT")?.total).toBe(1);
    expect(rows).toHaveLength(6);
  });
});

describe("minhas equipes", () => {
  const pick = (uniformId: string) => ({ uniformId, ctpId: null });
  const teams = {
    "BAX-1": { SOLO: pick("a"), SUPPORT_1: pick("b"), SUPPORT_2: pick("c") },
    "BAL-8": { SOLO: pick("a"), SUPPORT_1: pick("c"), SUPPORT_2: pick("b") }, // mesma equipe, suportes trocados
    "BAX-9": { SOLO: pick("d") },
    BAI: { SOLO: pick("a"), SUPPORT_1: pick("x"), SUPPORT_2: pick("y") },
    "BAX-2": {},
  };

  it("conta os personagens por semana; a equipe da BAI vale para as 4 semanas", () => {
    const rows = myAgentRepetition(teams, agentOf, "ALL");
    expect(rows[0]).toMatchObject({ agentId: "a", name: "A", weeks: [2, 2, 1, 1], total: 6 });
    expect(rows[0].uses.map((u) => `${u.mode}-${u.day}`)).toEqual(["BAX-1", "BAI-3", "BAL-8", "BAI-10", "BAI-17", "BAI-24"]);
    expect(myAgentRepetition(teams, agentOf, "BAL").map((r) => r.agentId)).toEqual(["a", "b", "c"]);
  });

  it("agrupa equipes com o mesmo Líder e os mesmos Suportes, as mais repetidas primeiro", () => {
    const groups = myTeamCompositions(teams, agentOf, "ALL");
    expect(groups[0].usages).toEqual([
      { mode: "BAX", day: 1 },
      { mode: "BAL", day: 8 },
    ]);
    expect(groups).toHaveLength(3); // a+b+c, d sozinho e a da BAI; a vazia é ignorada
  });
});

describe("ctpsOfUses", () => {
  it("CTPs do personagem do mais usado para o menos, sem contar aparições sem CTP", () => {
    const uses = [
      { mode: "BAX" as const, day: 1, ctpId: "rage" },
      { mode: "BAL" as const, day: 2, ctpId: "insight" },
      { mode: "BAX" as const, day: 5, ctpId: "insight" },
      { mode: "BAL" as const, day: 6, ctpId: null },
    ];
    expect(ctpsOfUses(uses)).toEqual([
      { ctpId: "insight", count: 2 },
      { ctpId: "rage", count: 1 },
    ]);
  });
});
