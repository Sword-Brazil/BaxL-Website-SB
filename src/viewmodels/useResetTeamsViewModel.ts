import { useTranslation } from "next-i18next/pages";
import { toast } from "sonner";
import type { Mode } from "@/models/domain/enums";
import { useSelectionsStore } from "./stores/selectionsStore";

export type ResetScope = Mode | "ALL";

/** Apaga as equipes montadas pelo jogador (um modo ou todas); elenco, CTPs e nome ficam. */
export function useResetTeamsViewModel() {
  const { t } = useTranslation("common");
  const resetMode = useSelectionsStore((s) => s.resetMode);
  const resetAllTeams = useSelectionsStore((s) => s.resetAllTeams);
  const hasTeams = useSelectionsStore((s) => Object.keys(s.doc.teams).length > 0);
  return {
    hasTeams,
    reset: (scope: ResetScope) => {
      if (scope === "ALL") resetAllTeams();
      else resetMode(scope);
      toast.success(scope === "ALL" ? t("resetTeams.doneAll") : t("resetTeams.doneMode", { mode: scope }));
    },
  };
}
