import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/models/api/admin";
import type { CycleOverview } from "@/models/domain/types";
import { useNotifyError } from "@/viewmodels/useNotify";

/** Dias de BAX/BAL sem restrição, na ordem do ciclo (ex.: "BAX 2"). */
export const freeDayLabels = (cycle: CycleOverview | undefined) =>
  (cycle?.days ?? []).flatMap((d) =>
    d.isBai ? [] : (["BAX", "BAL"] as const).filter((m) => (m === "BAX" ? d.bax : d.bal)?.criteria.length === 0).map((m) => `${m} ${d.number}`),
  );

/**
 * Curadoria: dias sem restrição e BAI com as mesmas equipes e reservas. Ligado, editar um deles
 * copia para os outros (feito no servidor).
 */
export function useFreeDaysSyncViewModel() {
  const qc = useQueryClient();
  const notifyError = useNotifyError();
  const query = useQuery({ queryKey: ["admin-free-days"], queryFn: adminApi.getFreeDaysSync });
  const toggle = useMutation({
    mutationFn: adminApi.setFreeDaysSync,
    onSuccess: (data) => qc.setQueryData(["admin-free-days"], data),
    onError: (e) => notifyError(e),
  });
  return {
    sync: query.data?.sync ?? true,
    isLoading: query.isLoading,
    setSync: (sync: boolean) => toggle.mutate(sync),
    isSaving: toggle.isPending,
  };
}

export type FreeDaysSyncViewModel = ReturnType<typeof useFreeDaysSyncViewModel>;
