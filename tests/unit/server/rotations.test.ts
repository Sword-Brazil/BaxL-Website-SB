import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { listRotations, saveAgentRotations } from "@/server/services/rotationService";
import { createAgent, seedBase } from "./fixtures";

describe("rotações por personagem", () => {
  let agentId: string;
  let padrao: string;
  let fenix: string;

  beforeEach(async () => {
    await seedBase();
    const { agent, uniform } = await createAgent("jean");
    agentId = agent.id;
    padrao = uniform.id;
    fenix = (await prisma.uniform.create({ data: { agentId, slug: "fenix", name: "Fênix Negra", imagePath: "", side: "VILLAIN" } })).id;
  });

  it("salva por traje ou para todos, em texto livre, na ordem enviada", async () => {
    const saved = await saveAgentRotations(agentId, {
      rotations: [
        { uniformId: null, sequence: "Abre com o 3 e segura o 6", description: "Espere o escudo cair" },
        { uniformId: fenix, title: "Fase 2", sequence: "1 2c (3dc 4) 6", videoUrl: "https://youtu.be/dQw4w9WgXcQ?t=42" },
        { uniformId: padrao, sequence: "2 1 6" },
      ],
    });
    expect(saved.map((r) => [r.position, r.uniformId, r.sequence])).toEqual([
      [0, null, "Abre com o 3 e segura o 6"],
      [1, fenix, "1 2c (3dc 4) 6"],
      [2, padrao, "2 1 6"],
    ]);
    expect(saved[1]).toMatchObject({ title: "Fase 2", videoUrl: "https://youtu.be/dQw4w9WgXcQ?t=42", description: null });
    expect(await listRotations()).toHaveLength(3);
  });

  it("salvar de novo substitui a lista do personagem", async () => {
    await saveAgentRotations(agentId, { rotations: [{ uniformId: null, sequence: "a" }, { uniformId: null, sequence: "b" }] });
    await saveAgentRotations(agentId, { rotations: [{ uniformId: fenix, sequence: "c" }] });
    expect((await listRotations()).map((r) => r.sequence)).toEqual(["c"]);
  });

  it("recusa traje de outro personagem e personagem inexistente", async () => {
    const other = await createAgent("scott");
    await expect(saveAgentRotations(agentId, { rotations: [{ uniformId: other.uniform.id, sequence: "1" }] })).rejects.toSatisfy(
      (e) => e instanceof HttpError && e.status === 400,
    );
    await expect(saveAgentRotations("nao-existe", { rotations: [] })).rejects.toSatisfy((e) => e instanceof HttpError && e.status === 404);
  });
});
