import { describe, expect, it } from "vitest";
import type { AgentInput } from "@/models/schemas/admin";
import { prisma } from "@/server/db";
import { updateAgent } from "@/server/services/catalogAdminService";
import { getSeason, setSeason } from "@/server/services/seasonService";
import { createAgent } from "./fixtures";

/** O que a tela do catálogo envia ao salvar o agente como está no banco. */
async function inputOf(agentId: string): Promise<AgentInput> {
  const a = await prisma.agent.findUniqueOrThrow({ where: { id: agentId }, include: { uniforms: { orderBy: { slug: "asc" } } } });
  return {
    slug: a.slug,
    name: a.name,
    active: a.active,
    uniforms: a.uniforms.map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      imagePath: u.imagePath,
      active: u.active,
      gender: u.gender,
      side: u.side,
      species: u.species,
      attackType: u.attackType,
      effects: u.effects,
    })) as AgentInput["uniforms"],
  };
}

describe("catálogo (admin)", () => {
  it("renomeia um traje", async () => {
    const { agent } = await createAgent("thor");
    const input = await inputOf(agent.id);
    input.uniforms[0] = { ...input.uniforms[0], name: "Clássico", slug: "classico" };
    const saved = await updateAgent(agent.id, input);
    expect(saved.uniforms.map((u) => [u.slug, u.name])).toEqual([["classico", "Clássico"]]);
  });

  it("marca o traje como Striker meta; sem o campo, a tag fica como está", async () => {
    const { agent } = await createAgent("rocket");
    const input = await inputOf(agent.id);
    input.uniforms[0] = { ...input.uniforms[0], isMetaStriker: true };
    expect((await updateAgent(agent.id, input)).uniforms[0].isMetaStriker).toBe(true);
    expect((await updateAgent(agent.id, await inputOf(agent.id))).uniforms[0].isMetaStriker).toBe(true);
  });

  it("renomeia um traje para o nome que outro está deixando", async () => {
    const { agent } = await createAgent("thor");
    await prisma.uniform.create({ data: { agentId: agent.id, slug: "ragnarok", name: "Ragnarok", imagePath: "" } });
    const input = await inputOf(agent.id); // [padrao, ragnarok]
    const [padrao, ragnarok] = input.uniforms;
    input.uniforms = [
      { ...padrao, slug: "ragnarok", name: "Ragnarok" },
      { ...ragnarok, slug: "ragnarok-2", name: "Ragnarok 2" },
    ];
    const saved = await updateAgent(agent.id, input);
    const byId = new Map(saved.uniforms.map((u) => [u.id, u.slug]));
    expect(byId.get(padrao.id!)).toBe("ragnarok");
    expect(byId.get(ragnarok.id!)).toBe("ragnarok-2");
  });

  it("troca os nomes de dois trajes", async () => {
    const { agent } = await createAgent("thor");
    await prisma.uniform.create({ data: { agentId: agent.id, slug: "ragnarok", name: "Ragnarok", imagePath: "" } });
    const input = await inputOf(agent.id);
    const [a, b] = input.uniforms;
    input.uniforms = [
      { ...a, slug: b.slug, name: b.name },
      { ...b, slug: a.slug, name: a.name },
    ];
    const saved = await updateAgent(agent.id, input);
    expect(saved.uniforms.find((u) => u.id === a.id)?.slug).toBe(b.slug);
    expect(saved.uniforms.find((u) => u.id === b.id)?.slug).toBe(a.slug);
  });

  it("guarda os efeitos de cada traje e mantém os que já tem quando o pedido não os traz", async () => {
    const { agent } = await createAgent("thor");
    const input = await inputOf(agent.id);
    input.uniforms[0] = { ...input.uniforms[0], effects: ["PARALYSIS", "SHOCK"] };
    expect((await updateAgent(agent.id, input)).uniforms[0].effects).toEqual(["PARALYSIS", "SHOCK"]);

    const again = await inputOf(agent.id);
    delete again.uniforms[0].effects;
    const saved = await updateAgent(agent.id, again);
    expect(saved.uniforms[0].effects).toEqual(["PARALYSIS", "SHOCK"]);
  });
});

describe("temporada", () => {
  it("começa em Paralisia / Choque e troca BAX e BAL separadamente", async () => {
    await prisma.settings.create({ data: { id: 1, cycleAnchor: new Date() } });
    expect(await getSeason()).toEqual({ BAX: "PARALYSIS", BAL: "SHOCK" });
    expect(await setSeason({ BAX: "BURN", BAL: "SHOCK" })).toEqual({ BAX: "BURN", BAL: "SHOCK" });
  });
});
