import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dismissNotice, getNotices } from "@/models/api/notices";
import type { SecurityNotice } from "@/models/domain/securityEvents";
import { useAuthViewModel } from "./useAuthViewModel";
import { NOTICES_KEY } from "./useNotify";

/** Avisos persistentes de segurança da conta (atenção/crítico): ficam até o usuário dispensar. */
export function useSecurityNoticesViewModel() {
  const qc = useQueryClient();
  const { user } = useAuthViewModel();
  const notices = useQuery({
    queryKey: [...NOTICES_KEY, user?.id],
    queryFn: getNotices,
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  });

  const dismiss = useMutation({
    mutationFn: dismissNotice,
    onMutate: (id: string) => {
      qc.setQueryData<SecurityNotice[]>([...NOTICES_KEY, user?.id], (list) => list?.filter((n) => n.id !== id));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: NOTICES_KEY }),
  });

  return { notices: user ? (notices.data ?? []) : [], dismiss: dismiss.mutate };
}
