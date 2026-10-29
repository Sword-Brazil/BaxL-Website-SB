import { describe, expect, it } from "vitest";
import { emptySelections } from "@/models/rules/selections";
import { mergeDecision } from "@/models/rules/selectionsSync";
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

  it("temporada do jogo por ciclo: data do Dia 1 e uma das 3 temporadas", () => {
    expect(UserSelectionsSchema.safeParse(doc({ scoreSeasons: { "2026-10-01": "PARALYSIS_SHOCK" } })).success).toBe(true);
    expect(UserSelectionsSchema.safeParse(doc({ scoreSeasons: { "2026-10-01": "FIRE" } as never })).success).toBe(false);
    expect(UserSelectionsSchema.safeParse(doc({ scoreSeasons: { "01/10": "PARALYSIS_SHOCK" } })).success).toBe(false);
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

describe("mergeDecision", () => {
  const filled = doc({ roster: { ownedUniformIds: ["u1"] } });

  it("sem documento na conta e com dados locais: UPLOAD_LOCAL", () => {
    expect(mergeDecision(filled, null)).toBe("UPLOAD_LOCAL");
  });

  it("local vazio e conta com dados: USE_REMOTE", () => {
    expect(mergeDecision(emptySelections(), filled)).toBe("USE_REMOTE");
  });

  it("conteúdos iguais (só muda updatedAt): IN_SYNC", () => {
    expect(mergeDecision(filled, { ...filled, updatedAt: "2026-10-18T00:00:00.000Z" })).toBe("IN_SYNC");
    expect(mergeDecision(emptySelections(), null)).toBe("IN_SYNC");
  });

  it("conteúdos diferentes nos dois lados (inclusive só o nome no jogo): ASK_USER", () => {
    expect(mergeDecision(filled, doc({ roster: { ownedUniformIds: ["u2"] } }))).toBe("ASK_USER");
    expect(mergeDecision(filled, { ...filled, nickname: "Outro" })).toBe("ASK_USER");
  });
});
