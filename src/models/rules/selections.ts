import type { CycleOverview } from "@/models/domain/types";
import type { UserSelections } from "@/models/schemas/selections";

/** Seleções vazias do jogador (no aparelho, no localStorage; logado, também na conta). */
export const emptySelections = (): UserSelections => ({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  nickname: "",
  roster: { ownedUniformIds: [] },
  teams: {},
  equipment: { ctpByAgent: {} },
  freePick: false,
});

/** Equipes (chaves "BAX-n"/"BAL-n") dos dias de BAX e BAL sem restrição, menos `except`. */
export function freeDayKeys(cycle: CycleOverview | undefined, except?: string): string[] {
  return (cycle?.days ?? []).flatMap((d) =>
    d.isBai
      ? []
      : (["BAX", "BAL"] as const).flatMap((mode) => {
          const data = mode === "BAX" ? d.bax : d.bal;
          const key = `${mode}-${d.number}`;
          return data && data.criteria.length === 0 && key !== except ? [key] : [];
        }),
  );
}
