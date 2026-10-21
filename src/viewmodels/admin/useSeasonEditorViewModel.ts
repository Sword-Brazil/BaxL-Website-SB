import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNotifyError } from "@/viewmodels/useNotify";
import { adminApi } from "@/models/api/admin";
import type { BossEffect, DayMode } from "@/models/domain/enums";
import type { Season } from "@/models/domain/types";

export const SEASON_KEY = ["admin", "season"] as const;

/** Temporada atual (curadoria): o efeito da BAX e o da BAL, que valem para todos os dias do modo. */
export function useSeasonEditorViewModel(messages: { saved: string; error: string }) {
  const qc = useQueryClient();
  const notifyError = useNotifyError();
  const query = useQuery({ queryKey: SEASON_KEY, queryFn: adminApi.getSeason });
  const [draft, setDraft] = useState<Season | null>(null);
  const current = draft ?? query.data ?? null;

  const save = useMutation({
    mutationFn: (season: Season) => adminApi.setSeason(season),
    onSuccess: (saved) => {
      qc.setQueryData(SEASON_KEY, saved);
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["cycle"] });
      toast.success(messages.saved);
    },
    onError: (e: Error) => notifyError(e, messages.error),
  });

  return {
    season: current,
    /** Efeito salvo do modo (o que os dias mostram), mesmo com um rascunho em edição. */
    savedEffectOf: (mode: DayMode) => query.data?.[mode] ?? null,
    dirty: !!draft && !!query.data && (draft.BAX !== query.data.BAX || draft.BAL !== query.data.BAL),
    setEffect: (mode: DayMode, effect: BossEffect) => current && setDraft({ ...current, [mode]: effect } as Season),
    reset: () => setDraft(null),
    save: () => current && save.mutate(current),
    isSaving: save.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
  };
}
