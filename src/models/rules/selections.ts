import type { UserSelections } from "@/models/schemas/selections";

/** Seleções vazias do jogador (no aparelho, no localStorage; logado, também na conta). */
export const emptySelections = (): UserSelections => ({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  nickname: "",
  roster: { ownedUniformIds: [] },
  teams: {},
  equipment: { ctpByAgent: {} },
});
