import { describe, expect, it } from "vitest";
import type { MetaTeam } from "@/models/domain/types";

const NO_ROTATION = { isDamageDealer: false, rotation: null, rotationNotes: null };
import { effectivePriority } from "@/models/rules/priority";

const team = (isPrimary: boolean, [solo, s1, s2]: string[]): MetaTeam => ({
  id: solo,
  scope: "DAY",
  mode: "BAX",
  dayNumber: 1,
  isPrimary,
  label: null,
  notes: null,
  updatedAt: "",
  updatedBy: null,
  members: [
    { slot: "SOLO", uniformId: solo, ctpId: `${solo}-ctp`, ...NO_ROTATION },
    { slot: "SUPPORT_1", uniformId: s1, ctpId: null, ...NO_ROTATION },
    { slot: "SUPPORT_2", uniformId: s2, ctpId: null, ...NO_ROTATION },
  ],
});

describe("effectivePriority", () => {
  it("Meta antes das Alternativas, depois as reservas, sem repetir uniforme", () => {
    const alt = team(false, ["b", "c", "x"]);
    const meta = team(true, ["a", "c", "d"]);
    const p = effectivePriority([alt, meta], {
      solo: [{ rank: 1, uniformId: "a", ctpId: null }, { rank: 2, uniformId: "r1", ctpId: "rage" }],
      support: [{ rank: 1, uniformId: "r2", ctpId: null }],
    });
    expect(p.solo).toEqual([
      { rank: 1, uniformId: "a", ctpId: "a-ctp" },
      { rank: 2, uniformId: "b", ctpId: "b-ctp" },
      { rank: 3, uniformId: "r1", ctpId: "rage" },
    ]);
    expect(p.support.map((i) => i.uniformId)).toEqual(["c", "d", "x", "r2"]);
  });

  it("sem equipes, valem só as reservas", () => {
    expect(effectivePriority([], { solo: [], support: [{ rank: 1, uniformId: "r", ctpId: null }] }).support).toHaveLength(1);
  });
});
