import { describe, expect, it } from "vitest";
import type { Agent, Criterion, PriorityLists } from "@/models/domain/types";
import { suggestTeam } from "@/models/rules/suggest";


const agent = (id: string, side: "HERO" | "VILLAIN" = "HERO"): Agent => {
  const attrs = { gender: "MALE", side, species: "HUMAN", attackType: "COMBAT" } as const;
  return {
    id,
    slug: id,
    name: id,
    nameEn: null,
    active: true,
    metaCtp1Id: null,
    metaCtp2Id: null,
    uniforms: [
      {
        id: `${id}-u`,
        agentId: id,
        slug: "padrao",
        name: "Padrão",
        nameEn: null,
        imagePath: "",
        portrait: "",
        effects: [],
        isMetaStriker: false,
        active: true,
        ...attrs,
      },
    ],
  };
};

const AGENTS = Object.fromEntries(
  [agent("a"), agent("b"), agent("c"), agent("d"), agent("v", "VILLAIN")].map((a) => [a.uniforms[0].id, a]),
);
const agentOf = (uniformId: string) => AGENTS[uniformId];

const priority: PriorityLists = {
  solo: [
    { rank: 1, uniformId: "a-u", ctpId: "rage" },
    { rank: 2, uniformId: "b-u", ctpId: null },
  ],
  support: [
    { rank: 1, uniformId: "a-u", ctpId: null },
    { rank: 2, uniformId: "c-u", ctpId: "lib" },
    { rank: 3, uniformId: "d-u", ctpId: null },
    { rank: 4, uniformId: "v-u", ctpId: null },
  ],
};

const run = (owned: string[], criteria: Criterion[] = []) => suggestTeam(new Set(owned), priority, criteria, agentOf);

describe("suggestTeam", () => {
  it("escolhe o Solador possuído de menor rank, com o CTP recomendado", () => {
    expect(run(["a-u", "b-u", "c-u", "d-u"])?.SOLO).toEqual({ uniformId: "a-u", ctpId: "rage" });
  });

  it("pula Soladores não possuídos", () => {
    expect(run(["b-u", "c-u", "d-u"])?.SOLO?.uniformId).toBe("b-u");
  });

  it("escolhe 2 Suportes distintos sem repetir o Solador", () => {
    const s = run(["a-u", "c-u", "d-u"]);
    expect(s?.SOLO?.uniformId).toBe("a-u");
    expect([s?.SUPPORT_1?.uniformId, s?.SUPPORT_2?.uniformId]).toEqual(["c-u", "d-u"]);
  });

  it("respeita a restrição do dia", () => {
    const s = run(["a-u", "v-u"], [{ attribute: "SIDE", value: "VILLAIN" }]);
    expect(s?.SOLO).toBeUndefined();
    expect(s?.SUPPORT_1?.uniformId).toBe("v-u");
  });

  it("retorna null quando nenhum agente válido é possuído", () => {
    expect(run([])).toBeNull();
    expect(run(["a-u"], [{ attribute: "SIDE", value: "VILLAIN" }])).toBeNull();
  });

  it("não sugere uniforme não possuído nem agente inativo", () => {
    AGENTS["c-u"].active = false;
    const s = run(["a-u", "c-u", "d-u"]);
    expect([s?.SUPPORT_1?.uniformId, s?.SUPPORT_2?.uniformId]).toEqual(["d-u", undefined]);
    AGENTS["c-u"].active = true;
  });
});
