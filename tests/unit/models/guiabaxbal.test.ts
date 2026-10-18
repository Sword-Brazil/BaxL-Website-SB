import { describe, expect, it } from "vitest";
import { convertSnapshot, parseRestriction, slugify, type GuiaSnapshot } from "@/models/import/guiabaxbal";

const row = (dia: number, restr: string, meta: [string, string, string][], alt?: [string, string, string][]) => {
  const r: Record<string, string> = { Dia: String(dia), "Restrição": restr };
  const keys = ["Líder", "Pos. 1", "Pos. 2"];
  meta.forEach(([name, traje, ctp], i) => Object.assign(r, { [keys[i]]: name, [`${keys[i]}_Traje`]: traje, [`${keys[i]}_CTP`]: ctp }));
  alt?.forEach(([name, traje, ctp], i) =>
    Object.assign(r, { [`Alt ${keys[i]}`]: name, [`Alt ${keys[i]}_Traje`]: traje, [`Alt ${keys[i]}_CTP`]: ctp }),
  );
  return r;
};

const snap: GuiaSnapshot = {
  baxData: [
    row(1, "speed|hero|female", [["Misty Knight", "", "insight"], ["Luna Snow", "Mirae 2099", "competition"], ["White Fox", "", ""]],
      [["Misty Knight", "", "insight"], ["Gamora", "", "rage"], ["White Fox", "", "liberation"]]),
    row(3, "INFINITE nores", [["Ciclope", "X-MEN' 97", "liberation"], ["Storm", "", "rage"], ["Crystal", "", "insight"]]),
    row(4, "combat|male", [["Luna Snow", "", "rage"], ["Odin", "", "rage"], ["Thor", "", "rage"]]),
  ],
  balData: [row(3, "INFINITE nores", [])],
  masterCharacters: ["Wong"],
  charCostumes: { "Luna Snow": ["Mirae 2099", "Série Estilo de Vida 1"] },
  customLists: { "bax-1": { personagensbax: ["Shuri"] } },
};

describe("importação do Guia BAX/BAL", () => {
  it("converte tokens de restrição; nores = sem restrição", () => {
    expect(parseRestriction("speed|hero|female")).toEqual([
      { attribute: "ATTACK_TYPE", value: "SPEED" },
      { attribute: "SIDE", value: "HERO" },
      { attribute: "GENDER", value: "FEMALE" },
    ]);
    expect(parseRestriction("nores")).toEqual([]);
    expect(parseRestriction("INFINITE nores")).toEqual([]);
  });

  it("slug sem acentos", () => {
    expect(slugify("Valquíria")).toBe("valquiria");
    expect(slugify("Maya Lopez (Echo)")).toBe("maya-lopez-echo");
  });

  it("equipes Meta e Alternativa por dia; dias de BAI viram o conteúdo da BAI", () => {
    const { days, bai } = convertSnapshot(snap);
    expect(days.map((d) => [d.mode, d.number])).toEqual([
      ["BAX", 1],
      ["BAX", 4],
    ]);
    const d1 = days[0];
    expect(d1.teams.map((t) => t.isPrimary)).toEqual([true, false]);
    expect(d1.teams[0].members[1]).toEqual({ slot: "SUPPORT_1", agent: "Luna Snow", uniform: "Mirae 2099", ctpType: "COMPETITION" });
    expect(d1.teams[0].members[2].ctpType).toBeNull();
    expect(bai[0].members.map((m) => m.agent)).toEqual(["Ciclope", "Storm", "Crystal"]);
  });

  it("deduz atributos; conflito ou ausência viram UNKNOWN", () => {
    const { agents } = convertSnapshot(snap);
    const by = Object.fromEntries(agents.map((a) => [a.name, a]));
    expect(by["Misty Knight"].attributes).toEqual({ GENDER: "FEMALE", SIDE: "HERO", SPECIES: "UNKNOWN", ATTACK_TYPE: "SPEED" });
    // Luna Snow aparece em dia "speed|female" e em dia "combat|male": conflito → UNKNOWN
    expect(by["Luna Snow"].attributes.GENDER).toBe("UNKNOWN");
    expect(by["Shuri"].attributes.SIDE).toBe("HERO");
    expect(by["Wong"].attributes.SIDE).toBe("UNKNOWN");
    expect(by["Luna Snow"].uniforms).toEqual(["Padrão", "Mirae 2099", "Série Estilo de Vida 1"]);
  });

  it("deduz atributos por traje só a partir das equipes em que o traje aparece", () => {
    const luna = convertSnapshot(snap).agents.find((a) => a.name === "Luna Snow")!;
    expect(luna.attributes.ATTACK_TYPE).toBe("UNKNOWN");
    expect(luna.uniformAttributes["Mirae 2099"]).toEqual({ ATTACK_TYPE: "SPEED", SIDE: "HERO", GENDER: "FEMALE" });
    expect(luna.uniformAttributes["Padrão"]).toEqual({ ATTACK_TYPE: "COMBAT", GENDER: "MALE" });
    expect(luna.uniformAttributes["Série Estilo de Vida 1"]).toBeUndefined();
  });
});
