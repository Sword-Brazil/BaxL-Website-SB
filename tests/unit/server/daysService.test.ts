import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { getDay, listBalFree, listDays } from "@/server/services/daysService";
import { createAgent, createMetaTeam, createUser, dayId, seedBase } from "./fixtures";

describe("daysService", () => {
  let uniforms: [string, string, string];

  beforeEach(async () => {
    await seedBase();
    const a = await createAgent("a");
    const b = await createAgent("b");
    const c = await createAgent("c");
    uniforms = [a.uniform.id, b.uniform.id, c.uniform.id];
  });

  it("listDays retorna 24 dias, sem os dias de BAI, com dia da semana", async () => {
    const days = await listDays("BAX");
    expect(days).toHaveLength(24);
    expect(days.map((d) => d.number)).not.toEqual(expect.arrayContaining([3]));
    expect(days.some((d) => [3, 10, 17, 24].includes(d.number))).toBe(false);
    expect(days[0]).toMatchObject({ mode: "BAX", number: 1, weekday: "QUI", criteria: [], primaryTeam: null });
    expect(days.find((d) => d.number === 7)?.weekday).toBe("QUA");
    expect(days.find((d) => d.number === 8)?.weekday).toBe("QUI");
  });

  it("listDays inclui critérios e a equipe principal", async () => {
    const id = await dayId("BAX", 4);
    await prisma.restrictionCriterion.create({ data: { battleDayId: id, attribute: "SIDE", value: "VILLAIN" } });
    await createMetaTeam({ scope: "DAY", battleDayId: id, isPrimary: true, uniformIds: uniforms });
    const d4 = (await listDays("BAX")).find((d) => d.number === 4)!;
    expect(d4.criteria).toEqual([{ attribute: "SIDE", value: "VILLAIN" }]);
    expect(d4.primaryTeam?.members).toHaveLength(3);
    expect(d4.updatedAt).toBeTruthy();
  });

  it("getDay: a sugestão usa as equipes do dia e depois as reservas", async () => {
    const id = await dayId("BAX", 5);
    await createMetaTeam({ scope: "DAY", battleDayId: id, isPrimary: true, uniformIds: uniforms });
    const reserve = (await createAgent("r")).uniform.id;
    await prisma.priorityEntry.create({ data: { scope: "DAY", battleDayId: id, role: "SUPPORT", rank: 1, uniformId: reserve } });
    const { priority } = await getDay("BAX", 5);
    expect(priority.solo.map((i) => i.uniformId)).toEqual([uniforms[0]]);
    expect(priority.support.map((i) => i.uniformId)).toEqual([uniforms[1], uniforms[2], reserve]);
  });

  it("getDay de um dia de BAI gera 404", async () => {
    await expect(getDay("BAX", 3)).rejects.toSatisfy((e) => e instanceof HttpError && e.status === 404);
  });

  it("dia sem MetaTeam retorna metaTeams vazio", async () => {
    const d = await getDay("BAL", 5);
    expect(d.metaTeams).toEqual([]);
    expect(d.priority).toEqual({ solo: [], support: [] });
  });

  it("a equipe principal vem primeiro e o autor aparece pelo apelido", async () => {
    const id = await dayId("BAL", 1);
    const curator = await createUser("ADMIN", "editor");
    await createMetaTeam({ scope: "DAY", battleDayId: id, uniformIds: uniforms, label: "alt" });
    await createMetaTeam({ scope: "DAY", battleDayId: id, isPrimary: true, uniformIds: uniforms, updatedById: curator.id });
    const d = await getDay("BAL", 1);
    expect(d.metaTeams.map((t) => t.isPrimary)).toEqual([true, false]);
    expect(d.metaTeams[0].updatedBy).toBe("admin");
    expect(d.metaTeams[0].members.map((m) => m.slot)).toEqual(["SOLO", "SUPPORT_1", "SUPPORT_2"]);
  });

  it("listBalFree retorna só equipes do modo livre", async () => {
    await createMetaTeam({ scope: "BAL_FREE", isPrimary: true, uniformIds: uniforms });
    await createMetaTeam({ scope: "BAI", uniformIds: uniforms });
    const teams = await listBalFree();
    expect(teams).toHaveLength(1);
    expect(teams[0].scope).toBe("BAL_FREE");
  });
});
