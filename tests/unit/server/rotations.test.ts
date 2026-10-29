import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { listRotations, saveAgentRotations } from "@/server/services/rotationService";
import { getCatalog } from "@/server/services/catalogService";
import { createAgent, createMetaTeam, dayId, seedBase } from "./fixtures";

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

  it("guarda um vídeo de demonstração por modo e os modos escolhidos pelo admin", async () => {
    const [r] = await saveAgentRotations(agentId, {
      rotations: [{ uniformId: null, sequence: "1 2", videoBax: "https://youtu.be/dQw4w9WgXcQ", videoBai: "https://cdn.example.com/bai.mp4" }],
      scoring: { auto: false, modes: ["BAI", "BAX"] },
    });
    expect(r).toMatchObject({ videoUrl: null, videoBax: "https://youtu.be/dQw4w9WgXcQ", videoBal: null, videoBai: "https://cdn.example.com/bai.mp4" });
    const agent = (await getCatalog()).agents.find((a) => a.id === agentId)!;
    expect(agent).toMatchObject({ scoringAuto: false, scoringModes: ["BAX", "BAI"] });
  });

  it("detecta os modos em que pontua pelas equipes Meta em que é Causador de Dano", async () => {
    const others = [(await createAgent("a1")).uniform.id, (await createAgent("a2")).uniform.id];
    const team = await createMetaTeam({ scope: "DAY", battleDayId: await dayId("BAL", 1), isPrimary: true, uniformIds: [padrao, ...others] as [string, string, string] });
    await prisma.metaTeamMember.updateMany({ where: { metaTeamId: team.id, uniformId: padrao }, data: { isDamageDealer: true } });
    const agent = (await getCatalog()).agents.find((a) => a.id === agentId)!;
    expect(agent).toMatchObject({ scoringAuto: true, detectedScoringModes: ["BAL"] });
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

  it("guarda o vídeo de cada temporada pelo efeito (sem vídeo = nenhum)", async () => {
    const saved = await saveAgentRotations(agentId, {
      rotations: [
        { uniformId: null, sequence: "1 2 3", effectVideos: { PARALYSIS: "https://youtu.be/dQw4w9WgXcQ", TRAP: "https://cdn.example.com/trap.mp4" } },
        { uniformId: null, sequence: "geral" },
      ],
    });
    expect(saved.map((r) => r.effectVideos)).toEqual([{ PARALYSIS: "https://youtu.be/dQw4w9WgXcQ", TRAP: "https://cdn.example.com/trap.mp4" }, {}]);
    expect((await listRotations())[0].effectVideos).toEqual(saved[0].effectVideos);
  });
});
