import { describe, expect, it } from "vitest";
import { normalizeSearch, searchByName } from "@/models/rules/search";

const people = [
  { agent: "Captain America", uniform: "Padrão" },
  { agent: "Thor", uniform: "Padrão" },
  { agent: "Thor", uniform: "Senhor do Trovão" },
  { agent: "Phoenix", uniform: "Fênix Negra" },
  { agent: "Black Panther", uniform: "Padrão" },
  { agent: "Panther (Shuri)", uniform: "Padrão" },
];
const names = (p: (typeof people)[number]) => [p.agent, p.uniform];

describe("searchByName", () => {
  it("acha pelo nome do personagem e do traje, sem acento nem maiúscula", () => {
    expect(searchByName(people, "THOR", names).map((p) => p.uniform)).toEqual(["Padrão", "Senhor do Trovão"]);
    expect(searchByName(people, "fenix", names).map((p) => p.agent)).toEqual(["Phoenix"]);
  });

  it("não casa letras soltas espalhadas (o filtro antigo achava 'tr' em quase tudo)", () => {
    expect(searchByName(people, "cpa", names)).toEqual([]);
  });

  it("ordena: começa com o texto, depois palavra que começa, depois contém", () => {
    expect(searchByName(people, "panther", names).map((p) => p.agent)).toEqual(["Panther (Shuri)", "Black Panther"]);
    expect(searchByName(people, "shuri", names).map((p) => p.agent)).toEqual(["Panther (Shuri)"]);
  });

  it("texto vazio mostra tudo, na ordem original", () => {
    expect(searchByName(people, "  ", names)).toHaveLength(people.length);
    expect(normalizeSearch("  Fênix   Negra ")).toBe("fenix negra");
  });
});
