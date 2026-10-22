import { describe, expect, it } from "vitest";
import type { Agent } from "@/models/domain/types";
import { ownedAgentIds, rosterAgents } from "@/models/rules/roster";

const uniform = (id: string, slug: string, active = true) => ({ id, slug, active }) as Agent["uniforms"][number];
const agent = (id: string, uniforms: Agent["uniforms"], active = true) => ({ id, name: id, active, uniforms }) as Agent;

const agents = [
  agent("wanda", [uniform("wanda-padrao", "padrao"), uniform("wanda-traje", "traje")]),
  agent("surfista", [uniform("surfista-padrao", "padrao", false)]),
  agent("storm", [uniform("storm-padrao", "padrao")]),
  agent("antigo", [uniform("antigo-padrao", "padrao")], false),
];
const NONE = new Set<string>();

describe("rosterAgents", () => {
  it("deixa de fora personagens inativos ou sem traje ativo para marcar", () => {
    expect(rosterAgents(agents, NONE).map((a) => a.id)).toEqual(["wanda", "storm"]);
  });
});

describe("ownedAgentIds", () => {
  it("conta como os cartões do elenco: trajes inativos ou Padrão oculto não contam", () => {
    const owned = new Set(["wanda-padrao", "surfista-padrao", "storm-padrao", "antigo-padrao"]);
    expect([...ownedAgentIds(agents, owned, NONE)]).toEqual(["storm"]);
  });

  it("o Padrão usado em alguma equipe aparece no elenco e conta", () => {
    expect([...ownedAgentIds(agents, new Set(["wanda-padrao"]), new Set(["wanda-padrao"]))]).toEqual(["wanda"]);
  });
});
