import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/models/api/admin";
import type { CycleOverview } from "@/models/domain/types";
import { useNotifyError } from "@/viewmodels/useNotify";

/** Dias sem restrição de um modo, na ordem do ciclo (ex.: "BAX 2"). */
export const freeDayLabels = (cycle: CycleOverview | undefined, mode: "BAX" | "BAL") =>
  (cycle?.days ?? []).flatMap((d) => (!d.isBai && (mode === "BAX" ? d.bax : d.bal)?.criteria.length === 0 ? [`${mode} ${d.number}`] : []));

/**
 * Curadoria: dias sem restrição do mesmo modo com as mesmas equipes e reservas (BAX com BAX, BAL
 * com BAL). Ligado, editar um deles copia para os outros do modo (feito no servidor).
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
