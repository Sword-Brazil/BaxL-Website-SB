import { z } from "zod";
import { emailSchema, passwordSchema } from "./common";
import { VALIDATION } from "./messages";

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: VALIDATION.passwordRequired }).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nickname: z.string().trim().max(30).optional().or(z.literal("").transform(() => undefined)),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({ email: emailSchema });

export const TokenSchema = z.object({ token: z.string().min(16).max(256) });

export const ResetPasswordSchema = z.object({
  token: z.string().min(16).max(256),
  password: passwordSchema,
});
