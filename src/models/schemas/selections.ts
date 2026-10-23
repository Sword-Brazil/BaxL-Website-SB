import { z } from "zod";
import { BATTLE_DAY_NUMBERS, SLOTS } from "@/models/domain/enums";
import { MAX_SCORE, SCORE_KEY_RE } from "@/models/rules/scores";
import { idSchema } from "./common";
import { VALIDATION } from "./messages";

/** Chaves de equipe: "BAX-<n>" / "BAL-<n>" (dias válidos de BAX/BAL) ou "BAI". */
export const TEAM_KEY_RE = /^(BAX|BAL)-(\d{1,2})$/;
export const teamKeySchema = z.string().refine(
  (k) => {
    if (k === "BAI") return true;
    const m = TEAM_KEY_RE.exec(k);
    return !!m && BATTLE_DAY_NUMBERS.includes(Number(m[2]));
  },
  { message: VALIDATION.teamKey },
);
export type TeamKey = string;

const SlotPickSchema = z.object({
  uniformId: idSchema,
  /** CTP do dia em equipes antigas (antes dos slots); hoje vale `ctpSlot`. */
  ctpId: idSchema.optional().nullable(),
  /** Slot de CTP do personagem usado neste dia (1 = padrão, 2 = alternativo). */
  ctpSlot: z.union([z.literal(1), z.literal(2)]).optional().nullable(),
  /** Striker (apoio da Transcendência 4) que o jogador usa com este personagem. */
  strikerUniformId: idSchema.optional().nullable(),
});

export const UserTeamSchema = z
  .object({ SOLO: SlotPickSchema.optional(), SUPPORT_1: SlotPickSchema.optional(), SUPPORT_2: SlotPickSchema.optional() })
  .refine(
    (t) => {
      const ids = SLOTS.flatMap((s) => (t[s] ? [t[s]!.uniformId] : []));
      return new Set(ids).size === ids.length;
    },
    { message: VALIDATION.sameAgentTwoSlots },
  );
export type UserTeam = z.infer<typeof UserTeamSchema>;

/**
 * CTPs de cada personagem do usuário (como no jogo: o CTP fica no personagem): o 1 (padrão) e o 2
 * (opcional), alternados por dia nas equipes.
 */
export const EquipmentSchema = z.object({
  ctpByAgent: z.record(idSchema, idSchema),
  ctp2ByAgent: z.record(idSchema, idSchema).optional(),
});

export const UserSelectionsSchema = z.object({
  version: z.literal(1),
  updatedAt: z.iso.datetime(),
  /** Nome no jogo, escolhido pelo jogador (no aparelho; logado, também na conta). */
  nickname: z.string().trim().max(30).default(""),
  roster: z.object({ ownedUniformIds: z.array(idSchema).max(5000) }),
  teams: z.record(teamKeySchema, UserTeamSchema),
  equipment: EquipmentSchema.default({ ctpByAgent: {} }),
  /** Montar equipes escolhendo entre todos os personagens (só a restrição do dia vale), sem elenco. */
  freePick: z.boolean().default(false),
  /** Mesma equipe nos dias de BAX/BAL sem restrição e na BAI: mudar uma muda todas. */
  syncFreeDays: z.boolean().default(true),
  /** Pontuação do jogador por dia de jogo e modo ("AAAA-MM-DD|BAX"), preenchida por ele mesmo. */
  scores: z
    .record(z.string().regex(SCORE_KEY_RE), z.number().int().min(0).max(MAX_SCORE))
    .refine((s) => Object.keys(s).length <= 5000)
    .optional(),
});
export type UserSelections = z.infer<typeof UserSelectionsSchema>;

export const PutSelectionsSchema = z.object({
  selections: UserSelectionsSchema,
  baseUpdatedAt: z.iso.datetime().optional().nullable(),
});

