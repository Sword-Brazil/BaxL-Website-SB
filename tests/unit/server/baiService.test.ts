import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { getPublicBai, saveBosses } from "@/server/services/baiService";
import { savePriority } from "@/server/services/priorityService";
import { createAgent, createMetaTeam, seedBase } from "./fixtures";

describe("baiService.getPublicBai", () => {
  let uniforms: [string, string, string];

  beforeEach(async () => {
    await seedBase();
    await prisma.settings.create({ data: { id: 1, cycleAnchor: new Date("2026-10-15T15:00:00.000Z") } });
    uniforms = [(await createAgent("a")).uniform.id, (await createAgent("b")).uniform.id, (await createAgent("c")).uniform.id];
  });

  it("retorna chefes em ordem, equipes da BAI (principal primeiro), prioridade e próxima BAI", async () => {
    await saveBosses([
      { position: 2, name: "Chefe B" },
      { position: 1, name: "Chefe A", tips: "Dica" },
    ]);
    await createMetaTeam({ scope: "BAI", uniformIds: uniforms, label: "alt" });
    await createMetaTeam({ scope: "BAI", isPrimary: true, uniformIds: uniforms });
    await createMetaTeam({ scope: "BAL_FREE", isPrimary: true, uniformIds: uniforms });
    await savePriority({ scope: "BAI" }, { solo: [{ uniformId: uniforms[0] }], support: [{ uniformId: uniforms[1] }] });

    const bai = await getPublicBai(new Date("2026-10-16T15:00:00-03:00")); // Dia 2
    expect(bai.bosses.map((b) => b.name)).toEqual(["Chefe A", "Chefe B"]);
    expect(bai.metaTeams.map((t) => [t.scope, t.isPrimary])).toEqual([
      ["BAI", true],
      ["BAI", false],
    ]);
    expect(bai.priority.solo.map((p) => p.uniformId)).toEqual([uniforms[0]]);
    expect(bai.nextStart).toBe(new Date("2026-10-17T12:00:00-03:00").toISOString());
  });

  it("sem conteúdo cadastrado retorna listas vazias", async () => {
    const bai = await getPublicBai(new Date("2026-10-16T15:00:00-03:00"));
    expect(bai).toMatchObject({ bosses: [], metaTeams: [], priority: { solo: [], support: [] } });
  });
});
