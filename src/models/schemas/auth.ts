import { z } from "zod";
import { VALIDATION } from "./messages";

/** Login por nome de usuário (sem diferenciar maiúsculas) e senha. */
export const LoginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: VALIDATION.loginRequired })
    .max(60)
    .transform((s) => s.replace(/\s+/g, " ")),
  password: z.string().min(1, { message: VALIDATION.passwordRequired }).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;
