import type { UserSelections } from "@/models/schemas/selections";

/** Seleções vazias do jogador (ficam só no aparelho, no localStorage). */
export const emptySelections = (): UserSelections => ({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  nickname: "",
  roster: { ownedUniformIds: [] },
  teams: {},
  equipment: { ctpByAgent: {} },
});
