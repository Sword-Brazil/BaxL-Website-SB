import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNotifyError } from "@/viewmodels/useNotify";
import { adminApi } from "@/models/api/admin";
import type { DayMode, SeasonId } from "@/models/domain/enums";

export const SEASON_KEY = ["admin", "season"] as const;

/** Temporada atual (curadoria): um dos 3 pares de efeitos (BAX e BAL), para todos os dias do modo. */
export function useSeasonEditorViewModel(messages: { saved: string; error: string }) {
  const qc = useQueryClient();
  const notifyError = useNotifyError();
  const query = useQuery({ queryKey: SEASON_KEY, queryFn: adminApi.getSeason });
  const [draft, setDraft] = useState<SeasonId | null>(null);
  const current = draft ?? query.data?.id ?? null;

  const save = useMutation({
    mutationFn: (id: SeasonId) => adminApi.setSeason({ id }),
    onSuccess: (saved) => {
      qc.setQueryData(SEASON_KEY, saved);
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["cycle"] });
      // A tela de rotações escolhe o vídeo pela temporada que vem com o relógio.
      qc.invalidateQueries({ queryKey: ["clock"] });
      toast.success(messages.saved);
    },
    onError: (e: Error) => notifyError(e, messages.error),
  });

  return {
    /** Temporada escolhida (o rascunho, se houver). */
    season: current,
    /** Efeito salvo do modo (o que os dias mostram), mesmo com um rascunho em edição. */
    savedEffectOf: (mode: DayMode) => query.data?.[mode] ?? null,
    /** Temporada salva (a que está valendo). */
    savedId: query.data?.id ?? null,
    dirty: !!draft && !!query.data && draft !== query.data.id,
    setSeason: (id: SeasonId) => setDraft(id),
    reset: () => setDraft(null),
    save: () => draft && save.mutate(draft),
    isSaving: save.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
  };
}
