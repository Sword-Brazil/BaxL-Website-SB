import { z } from "zod";
import { emailSchema } from "./common";
import { VALIDATION } from "./messages";

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: VALIDATION.passwordRequired }).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

