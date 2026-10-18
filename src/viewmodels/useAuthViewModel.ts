import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, postLogin, postLogout } from "@/models/api/auth";
import type { LoginInput } from "@/models/schemas/auth";

export function useAuthViewModel() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: 5 * 60_000 });

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => postLogin(input),
    onSuccess: (user) => qc.setQueryData(["me"], user),
  });

  const logoutMutation = useMutation({
    mutationFn: postLogout,
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.invalidateQueries({ queryKey: ["selections"] });
    },
  });

  const user = me.data ?? null;
  return {
    user,
    isLoading: me.isLoading,
    isLoggedIn: !!user,
    isCurator: user?.role === "CURATOR" || user?.role === "ADMIN",
    isAdmin: user?.role === "ADMIN",
    login: loginMutation.mutateAsync,
    loginState: loginMutation,
    logout: logoutMutation.mutateAsync,
  };
}
