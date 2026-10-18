import { describe, expect, it } from "vitest";
import { matchesRestriction, resolveAttributes } from "@/models/rules/restriction";

const agent = (gender: string, species: string, side = "HERO", attackType = "COMBAT") =>
  ({ gender, species, side, attackType }) as Parameters<typeof matchesRestriction>[0];

describe("matchesRestriction", () => {
  it("sem critérios: qualquer agente atende", () => {
    expect(matchesRestriction(agent("MALE", "HUMAN"), [])).toBe(true);
  });

  it("um critério", () => {
    const villain = [{ attribute: "SIDE", value: "VILLAIN" }] as const;
    expect(matchesRestriction(agent("MALE", "HUMAN", "VILLAIN"), [...villain])).toBe(true);
    expect(matchesRestriction(agent("MALE", "HUMAN", "HERO"), [...villain])).toBe(false);
  });

  it("combinação \"E\": Feminino + Mutante", () => {
    const criteria = [
      { attribute: "GENDER", value: "FEMALE" },
      { attribute: "SPECIES", value: "MUTANT" },
    ] as const;
    expect(matchesRestriction(agent("FEMALE", "MUTANT"), [...criteria])).toBe(true);
    expect(matchesRestriction(agent("MALE", "MUTANT"), [...criteria])).toBe(false);
    expect(matchesRestriction(agent("FEMALE", "HUMAN"), [...criteria])).toBe(false);
  });

  it("tipo de ataque", () => {
    const blast = [{ attribute: "ATTACK_TYPE", value: "BLAST" }] as const;
    expect(matchesRestriction(agent("MALE", "HUMAN", "HERO", "BLAST"), [...blast])).toBe(true);
    expect(matchesRestriction(agent("MALE", "HUMAN", "HERO", "SPEED"), [...blast])).toBe(false);
  });
});

describe("matchesRestriction com atributo não informado", () => {
  it("UNKNOWN não bloqueia o critério daquele atributo", () => {
    const a = agent("UNKNOWN", "MUTANT");
    expect(matchesRestriction(a, [{ attribute: "GENDER", value: "FEMALE" }])).toBe(true);
    expect(matchesRestriction(a, [{ attribute: "SPECIES", value: "HUMAN" }])).toBe(false);
  });
});

describe("atributos por traje", () => {
  const jean = agent("FEMALE", "MUTANT", "HERO", "UNIVERSAL");
  const villain = [{ attribute: "SIDE", value: "VILLAIN" }] as const;

  it("sem atributos próprios, o traje herda os do personagem", () => {
    expect(resolveAttributes(jean, {})).toEqual(jean);
    expect(matchesRestriction(resolveAttributes(jean, { side: null }), [...villain])).toBe(false);
  });

  it("o atributo próprio do traje substitui o do personagem só naquele traje", () => {
    const fenixNegra = resolveAttributes(jean, { side: "VILLAIN" });
    expect(fenixNegra).toEqual({ ...jean, side: "VILLAIN" });
    expect(matchesRestriction(fenixNegra, [...villain])).toBe(true);
  });
});
