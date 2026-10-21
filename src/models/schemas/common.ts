import { z } from "zod";
import {
  ATTACK_TYPES,
  CRITERION_ATTRIBUTES,
  CTP_QUALITIES,
  CTP_TYPES,
  CYCLE_LENGTH,
  DAY_MODES,
  GENDERS,
  isBaiDay,
  MODES,
  PRIORITY_ROLES,
  ROLES,
  SIDES,
  SLOTS,
  SPECIES,
  TEAM_SCOPES,
} from "@/models/domain/enums";
import { VALIDATION } from "./messages";

export const modeSchema = z.enum(MODES);
export const dayModeSchema = z.enum(DAY_MODES);
export const roleSchema = z.enum(ROLES);
export const genderSchema = z.enum(GENDERS);
export const sideSchema = z.enum(SIDES);
export const speciesSchema = z.enum(SPECIES);
export const attackTypeSchema = z.enum(ATTACK_TYPES);
export const criterionAttributeSchema = z.enum(CRITERION_ATTRIBUTES);
export const ctpTypeSchema = z.enum(CTP_TYPES);
export const ctpQualitySchema = z.enum(CTP_QUALITIES);
export const slotSchema = z.enum(SLOTS);
export const teamScopeSchema = z.enum(TEAM_SCOPES);
export const priorityRoleSchema = z.enum(PRIORITY_ROLES);

/** Dia válido de BAX/BAL: inteiro 1–28, exceto os dias de BAI (3, 10, 17, 24). */
export const dayNumberSchema = z
  .number()
  .int()
  .min(1)
  .max(CYCLE_LENGTH)
  .refine((n) => !isBaiDay(n), { message: VALIDATION.baiDay });

/** Mesmo que dayNumberSchema, mas aceitando string (parâmetros de rota). */
export const dayNumberParamSchema = z.coerce.number().pipe(dayNumberSchema);

/** Nome de usuário (login): guardado em minúsculas, com espaços simples (ex.: "sword menezes"). */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((s) => s.replace(/\s+/g, " "))
  .pipe(z.string().regex(/^[a-z0-9][a-z0-9 ._-]{1,28}[a-z0-9]$/, { message: VALIDATION.usernameFormat }));

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ message: VALIDATION.emailInvalid }));

/** Senha nova (criada ou trocada por um administrador): forte. O login aceita qualquer senha já salva. */
export const passwordSchema = z
  .string()
  .min(8, { message: VALIDATION.passwordMin })
  .max(128)
  .regex(/[a-z]/, { message: VALIDATION.passwordLower })
  .regex(/[A-Z]/, { message: VALIDATION.passwordUpper })
  .regex(/\d/, { message: VALIDATION.passwordDigit })
  .regex(/[^A-Za-z0-9]/, { message: VALIDATION.passwordSymbol });

export const idSchema = z.string().min(1).max(64);

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
