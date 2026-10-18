import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { saveBosses } from "@/server/services/baiService";
import { getCycle } from "@/server/services/cycleService";
import { createAgent, createMetaTeam, dayId, seedBase } from "./fixtures";

describe("cycleService.getCycle", () => {
  let uniforms: [string, string, string];

  beforeEach(async () => {
    await seedBase();
    uniforms = [(await createAgent("a")).uniform.id, (await createAgent("b")).uniform.id, (await createAgent("c")).uniform.id];
  });

  it("devolve os 28 dias com BAX e BAL lado a lado; dias de BAI sem BAX/BAL", async () => {
    const id = await dayId("BAL", 1);
    await prisma.restrictionCriterion.create({ data: { battleDayId: id, attribute: "SIDE", value: "HERO" } });
    await createMetaTeam({ scope: "DAY", battleDayId: id, isPrimary: true, uniformIds: uniforms });
    await createMetaTeam({ scope: "DAY", battleDayId: id, uniformIds: uniforms, label: "Alternativa" });
    await createMetaTeam({ scope: "BAI", isPrimary: true, uniformIds: uniforms });
    await saveBosses([{ position: 1, name: "Chefe" }]);

    const cycle = await getCycle();
    expect(cycle.days).toHaveLength(28);
    const d1 = cycle.days[0];
    expect(d1).toMatchObject({ number: 1, weekday: "QUI", week: 1, isBai: false });
    expect(d1.bal?.criteria).toEqual([{ attribute: "SIDE", value: "HERO" }]);
    expect(d1.bal?.metaTeams.map((t) => t.isPrimary)).toEqual([true, false]);
    expect(d1.bax?.metaTeams).toEqual([]);

    const d3 = cycle.days[2];
    expect(d3).toMatchObject({ number: 3, isBai: true, bax: null, bal: null });
    expect(cycle.days[7].week).toBe(2);
    expect(cycle.bai.metaTeams).toHaveLength(1);
    expect(cycle.bai.bosses.map((b) => b.name)).toEqual(["Chefe"]);
  });
});
