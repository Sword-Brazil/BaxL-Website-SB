import { z } from "zod";
import { BAL_EFFECTS, BAX_EFFECTS, BOSS_EFFECTS, CRITERION_VALUES, CTP_QUALITIES, CTP_TYPES, SLOTS, UNKNOWN } from "@/models/domain/enums";
import {
  attackTypeSchema,
  criterionAttributeSchema,
  dayModeSchema,
  dayNumberSchema,
  genderSchema,
  idSchema,
  passwordSchema,
  sideSchema,
  slotSchema,
  speciesSchema,
  teamScopeSchema,
  usernameSchema,
} from "./common";
import { parseRotationVideo } from "@/models/rules/rotationVideo";
import { VALIDATION } from "./messages";

const distinct = <T>(items: T[], key: (t: T) => unknown) => new Set(items.map(key)).size === items.length;

export const CriterionSchema = z
  .object({ attribute: criterionAttributeSchema, value: z.string() })
  .refine((c) => (CRITERION_VALUES[c.attribute] as readonly string[]).includes(c.value), {
    message: VALIDATION.attributeValue,
    path: ["value"],
  });

export const RestrictionSchema = z.object({
  criteria: z
    .array(CriterionSchema)
    .max(4)
    .refine((cs) => distinct(cs, (c) => c.attribute), { message: VALIDATION.attributeRepeated }),
});
export type RestrictionInput = z.infer<typeof RestrictionSchema>;

export const MetaTeamMemberSchema = z.object({
  slot: slotSchema,
  uniformId: idSchema,
  /** CTP só desta equipe (equipes antigas, sem slot). Com `ctpSlot`, o servidor usa o CTP do slot. */
  ctpId: idSchema.nullable().optional(),
  /** Slot de CTP do personagem usado nesta equipe (1 = padrão, 2 = alternativo). */
  ctpSlot: z.union([z.literal(1), z.literal(2)]).nullable().optional(),
  /**
   * CTPs da Meta do personagem (valem em todas as equipes dele). Ausente = mantém os do catálogo;
   * null tira.
   */
  agentCtp1Id: idSchema.nullable().optional(),
  agentCtp2Id: idSchema.nullable().optional(),
  /** Causador de Dano: o jogador toca na foto e vê as rotações do personagem. */
  isDamageDealer: z.boolean().optional(),
  /** Striker meta do Causador de Dano (ignorado em quem não é Causador de Dano). */
  strikerUniformId: idSchema.nullable().optional(),
});

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
      .length(SLOTS.length, { message: VALIDATION.teamSize })
      .refine((ms) => distinct(ms, (m) => m.slot), { message: VALIDATION.slotsRepeated })
      .refine((ms) => distinct(ms, (m) => m.uniformId), { message: VALIDATION.agentRepeated }),
  })
  .refine((t) => t.scope !== "DAY" || (t.mode && t.number), {
    message: VALIDATION.dayRequired,
    path: ["number"],
  });
export type MetaTeamInput = z.infer<typeof MetaTeamSchema>;

const PriorityItemSchema = z.object({ uniformId: idSchema, ctpId: idSchema.optional().nullable() });
const PriorityListSchema = z
  .array(PriorityItemSchema)
  .max(30)
  .refine((items) => distinct(items, (i) => i.uniformId), { message: VALIDATION.uniformRepeatedInList });

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
  .refine((bs) => distinct(bs, (b) => b.position), { message: VALIDATION.positionRepeated });
export type BaiBossesInput = z.infer<typeof BaiBossesSchema>;

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: VALIDATION.slugFormat }).max(80);

export const UniformInputSchema = z.object({
  id: idSchema.optional(),
  slug: slugSchema,
  name: z.string().trim().min(1).max(80),
  imagePath: z.string().max(300), // vazio = sem imagem (mostra as iniciais)
  active: z.boolean().optional(),
  // Atributos são de cada traje (UNKNOWN = não informado; não bloqueia restrições).
  gender: genderSchema.or(z.literal(UNKNOWN)),
  side: sideSchema.or(z.literal(UNKNOWN)),
  species: speciesSchema.or(z.literal(UNKNOWN)),
  attackType: attackTypeSchema.or(z.literal(UNKNOWN)),
  // Efeitos que o traje causa no chefe (sem repetição). Ausente = mantém os que já tem.
  effects: z
    .array(z.enum(BOSS_EFFECTS))
    .max(BOSS_EFFECTS.length)
    .refine((es) => new Set(es).size === es.length)
    .optional(),
  /** Striker meta (tag do catálogo). Ausente = mantém. */
  isMetaStriker: z.boolean().optional(),
});

export const AgentSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(80),
  active: z.boolean().optional(),
  uniforms: z
    .array(UniformInputSchema)
    .min(1, { message: VALIDATION.uniformRequired })
    .refine((us) => distinct(us, (u) => u.slug), { message: VALIDATION.uniformRepeated }),
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

/** Conta criada por um Administrador (não há cadastro aberto): nome de usuário + senha forte. */
export const CreateUserSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  nickname: z.string().trim().max(30).optional(),
  role: z.enum(["USER", "CURATOR", "ADMIN"]),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const ChangeRoleSchema = z.object({ role: z.enum(["USER", "CURATOR", "ADMIN"]) });
export const AdminResetPasswordSchema = z.object({ password: passwordSchema });

export const ASSET_MAX_BYTES = 2 * 1024 * 1024;
export const AssetUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(120),
  mimeType: z.enum(["image/png", "image/webp", "image/jpeg"]),
  base64: z.string().min(4).max(Math.ceil((ASSET_MAX_BYTES * 4) / 3) + 8),
});
export type AssetUploadInput = z.infer<typeof AssetUploadSchema>;

/** Rotação em texto livre (sem formato obrigatório); o vídeo precisa ser YouTube ou .mp4/.webm. */
export const RotationInputSchema = z.object({
  uniformId: idSchema.nullable(),
  effect: z.enum(BOSS_EFFECTS).optional().nullable(),
  title: z.string().trim().max(80).optional().nullable(),
  sequence: z.string().trim().min(1, { message: VALIDATION.rotationRequired }).max(1000),
  description: z.string().trim().max(3000).optional().nullable(),
  videoUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || !!parseRotationVideo(v), { message: VALIDATION.rotationVideo })
    .optional()
    .nullable(),
});
export type RotationInput = z.infer<typeof RotationInputSchema>;

export const AgentRotationsSchema = z.object({ rotations: z.array(RotationInputSchema).max(40) });
export type AgentRotationsInput = z.infer<typeof AgentRotationsSchema>;

/** Temporada atual: o efeito da BAX e o da BAL, escolhidos separadamente. */
export const SeasonSchema = z.object({ BAX: z.enum(BAX_EFFECTS), BAL: z.enum(BAL_EFFECTS) });
export type SeasonInput = z.infer<typeof SeasonSchema>;
