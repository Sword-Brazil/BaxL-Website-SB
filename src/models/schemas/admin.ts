import { z } from "zod";
import { CRITERION_VALUES, CTP_QUALITIES, CTP_TYPES, SLOTS, UNKNOWN } from "@/models/domain/enums";
import {
  attackTypeSchema,
  criterionAttributeSchema,
  dayModeSchema,
  dayNumberSchema,
  emailSchema,
  genderSchema,
  idSchema,
  passwordSchema,
  sideSchema,
  slotSchema,
  speciesSchema,
  teamScopeSchema,
} from "./common";

const distinct = <T>(items: T[], key: (t: T) => unknown) => new Set(items.map(key)).size === items.length;

export const CriterionSchema = z
  .object({ attribute: criterionAttributeSchema, value: z.string() })
  .refine((c) => (CRITERION_VALUES[c.attribute] as readonly string[]).includes(c.value), {
    message: "Valor inválido para o atributo",
    path: ["value"],
  });

export const RestrictionSchema = z.object({
  criteria: z
    .array(CriterionSchema)
    .max(4)
    .refine((cs) => distinct(cs, (c) => c.attribute), { message: "Atributo repetido" }),
});
export type RestrictionInput = z.infer<typeof RestrictionSchema>;

export const MetaTeamMemberSchema = z.object({ slot: slotSchema, uniformId: idSchema, ctpId: idSchema.nullable().optional() });

export const MetaTeamSchema = z
  .object({
    scope: teamScopeSchema,
    mode: dayModeSchema.optional(),
    number: dayNumberSchema.optional(),
    isPrimary: z.boolean(),
    label: z.string().trim().max(60).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    members: z
      .array(MetaTeamMemberSchema)
      .length(SLOTS.length, { message: "A equipe precisa de exatamente 3 membros" })
      .refine((ms) => distinct(ms, (m) => m.slot), { message: "Slots repetidos" })
      .refine((ms) => distinct(ms, (m) => m.uniformId), { message: "Agente repetido" }),
  })
  .refine((t) => t.scope !== "DAY" || (t.mode && t.number), {
    message: "Dia obrigatório para equipes de dia",
    path: ["number"],
  });
export type MetaTeamInput = z.infer<typeof MetaTeamSchema>;

const PriorityItemSchema = z.object({ uniformId: idSchema, ctpId: idSchema.optional().nullable() });
const PriorityListSchema = z
  .array(PriorityItemSchema)
  .max(30)
  .refine((items) => distinct(items, (i) => i.uniformId), { message: "Uniforme repetido na lista" });

export const PrioritySchema = z.object({ solo: PriorityListSchema, support: PriorityListSchema });
export type PriorityInput = z.infer<typeof PrioritySchema>;

export const PriorityTargetSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("DAY"), mode: dayModeSchema, number: dayNumberSchema }),
  z.object({ scope: z.literal("BAI") }),
]);
export type PriorityTarget = z.infer<typeof PriorityTargetSchema>;

export const BaiBossSchema = z.object({
  position: z.number().int().min(1),
  name: z.string().trim().min(1).max(80),
  imagePath: z.string().max(300).optional().nullable(),
  tips: z.string().trim().max(500).optional().nullable(),
});
export const BaiBossesSchema = z
  .array(BaiBossSchema)
  .max(50)
  .refine((bs) => distinct(bs, (b) => b.position), { message: "Posição repetida" });
export type BaiBossesInput = z.infer<typeof BaiBossesSchema>;

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Use kebab-case (ex.: scarlet-witch)" }).max(80);

export const UniformInputSchema = z.object({
  id: idSchema.optional(),
  slug: slugSchema,
  name: z.string().trim().min(1).max(80),
  imagePath: z.string().max(300), // vazio = sem imagem (mostra as iniciais)
  active: z.boolean().optional(),
  // Atributos próprios do traje; null/ausente = herda do personagem.
  gender: genderSchema.nullable().optional(),
  side: sideSchema.nullable().optional(),
  species: speciesSchema.nullable().optional(),
  attackType: attackTypeSchema.nullable().optional(),
});

export const AgentSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(80),
  gender: genderSchema.or(z.literal(UNKNOWN)),
  side: sideSchema.or(z.literal(UNKNOWN)),
  species: speciesSchema.or(z.literal(UNKNOWN)),
  attackType: attackTypeSchema.or(z.literal(UNKNOWN)),
  active: z.boolean().optional(),
  uniforms: z
    .array(UniformInputSchema)
    .min(1, { message: "Cadastre ao menos um uniforme" })
    .refine((us) => distinct(us, (u) => u.slug), { message: "Uniforme repetido" }),
});
export type AgentInput = z.infer<typeof AgentSchema>;

export const CtpInputSchema = z.object({
  type: z.enum(CTP_TYPES),
  quality: z.enum(CTP_QUALITIES),
  imagePath: z.string().max(300),
  active: z.boolean().optional(),
});
export type CtpInput = z.infer<typeof CtpInputSchema>;

const hourSchema = z.number().int().min(0).max(23);
export const SettingsSchema = z.object({
  cycleAnchor: z.iso.datetime({ offset: true }),
  dayTurnoverHour: hourSchema,
  weeklyResetHour: hourSchema,
});
export type SettingsInput = z.infer<typeof SettingsSchema>;

export const CreateStaffSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nickname: z.string().trim().max(30).optional(),
  role: z.enum(["CURATOR", "ADMIN"]),
});
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

export const ChangeRoleSchema = z.object({ role: z.enum(["USER", "CURATOR", "ADMIN"]) });
export const AdminResetPasswordSchema = z.object({ password: passwordSchema });

export const ASSET_MAX_BYTES = 2 * 1024 * 1024;
export const AssetUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(120),
  mimeType: z.enum(["image/png", "image/webp", "image/jpeg"]),
  base64: z.string().min(4).max(Math.ceil((ASSET_MAX_BYTES * 4) / 3) + 8),
});
export type AssetUploadInput = z.infer<typeof AssetUploadSchema>;
