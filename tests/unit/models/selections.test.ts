import { describe, expect, it } from "vitest";
import { emptySelections } from "@/models/rules/selections";
import { UserSelectionsSchema, type UserSelections } from "@/models/schemas/selections";

const doc = (patch: Partial<UserSelections> = {}): UserSelections => ({
  ...emptySelections(),
  updatedAt: "2026-10-17T12:00:00.000Z",
  ...patch,
});

describe("UserSelectionsSchema", () => {
  it("aceita o formato versão 1", () => {
    const d = doc({
      roster: { ownedUniformIds: ["u1", "u2"] },
      teams: { "BAX-4": { SOLO: { uniformId: "u1", ctpId: "c1" } }, BAI: { SUPPORT_1: { uniformId: "u2" } } },
    });
    expect(UserSelectionsSchema.safeParse(d).success).toBe(true);
  });

  it("exige version 1", () => {
    expect(UserSelectionsSchema.safeParse({ ...doc(), version: 2 }).success).toBe(false);
  });

  it("rejeita chave de time de dia de BAI ou inválida", () => {
    expect(UserSelectionsSchema.safeParse(doc({ teams: { "BAX-3": {} } })).success).toBe(false);
    expect(UserSelectionsSchema.safeParse(doc({ teams: { "BAL-29": {} } })).success).toBe(false);
    expect(UserSelectionsSchema.safeParse(doc({ teams: { XYZ: {} } as never })).success).toBe(false);
  });

  it("rejeita o mesmo uniforme em dois slots", () => {
    const d = doc({ teams: { "BAL-1": { SOLO: { uniformId: "u1" }, SUPPORT_1: { uniformId: "u1" } } } });
    expect(UserSelectionsSchema.safeParse(d).success).toBe(false);
  });
});
