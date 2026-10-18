import { describe, expect, it } from "vitest";
import type { MetaTeam } from "@/models/domain/types";
import { compareWithMeta, type CompareContext } from "@/models/rules/compare";

// agentes: a (uniformes a1, a2), b (b1), c (c1), d (d1)
const AGENT: Record<string, string> = { a1: "a", a2: "a", b1: "b", c1: "c", d1: "d" };
const CTP_TYPE: Record<string, string> = { rageB: "RAGE", rageN: "RAGE", lib: "LIBERATION" };

const meta: MetaTeam = {
  id: "m",
  scope: "DAY",
  mode: "BAX",
  dayNumber: 1,
  isPrimary: true,
  label: null,
  notes: null,
  updatedAt: "",
  updatedBy: null,
  members: [
    { slot: "SOLO", uniformId: "a1", ctpId: "rageB" },
    { slot: "SUPPORT_1", uniformId: "b1", ctpId: "lib" },
    { slot: "SUPPORT_2", uniformId: "c1", ctpId: "lib" },
  ],
};

const ctx = (owned: string[], equipped: Record<string, string> = {}): CompareContext => ({
  ownedUniformIds: new Set(owned),
  agentOf: (u) => AGENT[u],
  ctpTypeOf: (c) => CTP_TYPE[c] as never,
  equippedCtpOf: (u) => equipped[AGENT[u]],
});

describe("compareWithMeta", () => {
  it("MATCH quando o uniforme é o mesmo; CTP do mesmo tipo (outra qualidade) também conta como MATCH", () => {
    const r = compareWithMeta({ SOLO: { uniformId: "a1" } }, meta, ctx(["a1", "b1", "c1"], { a: "rageN" }));
    expect(r.SOLO).toEqual({ status: "MATCH", ctp: "MATCH" });
  });

  it("CTP_DIFFERENT quando o tipo do CTP difere", () => {
    const r = compareWithMeta({ SOLO: { uniformId: "a1" } }, meta, ctx(["a1"], { a: "lib" }));
    expect(r.SOLO.ctp).toBe("CTP_DIFFERENT");
  });

  it("CTP NONE quando a Meta não recomenda CTP", () => {
    const noCtp = { ...meta, members: meta.members.map((m) => ({ ...m, ctpId: null })) };
    expect(compareWithMeta({ SOLO: { uniformId: "a1" } }, noCtp, ctx(["a1"], { a: "lib" })).SOLO.ctp).toBe("NONE");
  });

  it("CTP NONE quando o usuário ainda não equipou CTP no personagem", () => {
    const r = compareWithMeta({ SOLO: { uniformId: "a1" } }, meta, ctx(["a1"]));
    expect(r.SOLO.ctp).toBe("NONE");
  });

  it("DIFFERENT quando o usuário possui o agente Meta mas escolheu outro", () => {
    const r = compareWithMeta({ SUPPORT_1: { uniformId: "d1" } }, meta, ctx(["b1", "d1"]));
    expect(r.SUPPORT_1.status).toBe("DIFFERENT");
  });

  it("NOT_OWNED quando o usuário não possui o agente Meta", () => {
    const r = compareWithMeta({}, meta, ctx([]));
    expect(r.SUPPORT_2.status).toBe("NOT_OWNED");
  });

  it("UNIFORM_NOT_OWNED quando possui o agente, mas não o uniforme Meta", () => {
    const r = compareWithMeta({ SOLO: { uniformId: "a2" } }, meta, ctx(["a2"]));
    expect(r.SOLO.status).toBe("UNIFORM_NOT_OWNED");
  });

  it("equipe vazia com o elenco completo: DIFFERENT em todos os slots", () => {
    const r = compareWithMeta({}, meta, ctx(["a1", "b1", "c1"]));
    expect([r.SOLO.status, r.SUPPORT_1.status, r.SUPPORT_2.status]).toEqual(["DIFFERENT", "DIFFERENT", "DIFFERENT"]);
  });
});
