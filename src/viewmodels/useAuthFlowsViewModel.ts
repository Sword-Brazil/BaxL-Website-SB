import { useMutation } from "@tanstack/react-query";
import { postForgotPassword, postRegister, postResetPassword, postVerifyEmail } from "@/models/api/auth";
import type { RegisterInput } from "@/models/schemas/auth";

/** Cadastro, confirmação de e-mail e recuperação de senha. */
export function useAuthFlowsViewModel() {
  const register = useMutation({ mutationFn: (v: RegisterInput) => postRegister(v) });
  const verify = useMutation({ mutationFn: (token: string) => postVerifyEmail(token) });
  const forgot = useMutation({ mutationFn: (email: string) => postForgotPassword(email) });
  const reset = useMutation({ mutationFn: ({ token, password }: { token: string; password: string }) => postResetPassword(token, password) });
  return { register, verify, forgot, reset };
}
