import { useMemo } from "react";
import { useTranslation } from "next-i18next/pages";
import { toast } from "sonner";
import { parseScoreKey, type ScoreMode } from "@/models/rules/scores";
import { useSelectionsStore } from "./stores/selectionsStore";

export type ResetScoresScope = ScoreMode | "ALL";

/** Apaga as pontuações anotadas pelo jogador (um modo ou todas); equipes e elenco ficam. */
export function useResetScoresViewModel() {
  const { t } = useTranslation("scores");
  const resetScores = useSelectionsStore((s) => s.resetScores);
  const scores = useSelectionsStore((s) => s.doc.scores);
  const modesWithScores = useMemo(() => new Set(Object.keys(scores ?? {}).map((k) => parseScoreKey(k)?.mode)), [scores]);
  return {
    hasScores: (scope: ResetScoresScope) => (scope === "ALL" ? modesWithScores.size > 0 : modesWithScores.has(scope)),
    reset: (scope: ResetScoresScope) => {
      resetScores(scope === "ALL" ? undefined : scope);
      toast.success(scope === "ALL" ? t("reset.doneAll") : t("reset.doneMode", { mode: scope }));
    },
  };
}
