import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, postLogin, postLogout, putRemoteSelections } from "@/models/api/auth";
import type { LoginInput } from "@/models/schemas/auth";
import { useSelectionsStore } from "./stores/selectionsStore";
import { NOTICES_KEY } from "./useNotify";

/** Envia o que ainda não subiu para a conta e sai (o aparelho é limpo no onSuccess). */
async function flushAndLogout() {
  const s = useSelectionsStore.getState();
  if (s.syncUserId && s.doc.updatedAt !== s.syncedLocalAt) await putRemoteSelections(s.doc, s.syncBase).catch(() => undefined);
  await postLogout();
}

export function useAuthViewModel() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: 5 * 60_000 });

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => postLogin(input),
    onSuccess: (user) => {
      qc.setQueryData(["me"], user);
      qc.invalidateQueries({ queryKey: NOTICES_KEY });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: flushAndLogout,
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      // Aparelho pode ser compartilhado: depois de zerar a sessão no app, limpa os dados locais.
      useSelectionsStore.getState().clearDevice();
      qc.invalidateQueries({ queryKey: ["selections"] });
      qc.removeQueries({ queryKey: NOTICES_KEY });
    },
  });

  const user = me.data ?? null;
  return {
    user,
    isLoading: me.isLoading,
    isLoggedIn: !!user,
    isAdmin: user?.role === "ADMIN",
    login: loginMutation.mutateAsync,
    loginState: loginMutation,
    logout: logoutMutation.mutateAsync,
  };
}
