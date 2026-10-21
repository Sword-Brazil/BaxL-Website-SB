import { z } from "zod";
import { VALIDATION } from "./messages";

/** Login por nome de usuário (jogadores) ou e-mail (curadoria): o servidor decide pelo "@". */
export const LoginSchema = z.object({
  login: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: VALIDATION.loginRequired })
    .max(254)
    .transform((s) => s.replace(/\s+/g, " ")),
  password: z.string().min(1, { message: VALIDATION.passwordRequired }).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;
