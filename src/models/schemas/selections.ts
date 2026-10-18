import { z } from "zod";
import { BATTLE_DAY_NUMBERS, SLOTS } from "@/models/domain/enums";
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

const SlotPickSchema = z.object({ uniformId: idSchema, ctpId: idSchema.optional().nullable() });

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

/** CTP equipado em cada personagem do usuário (como no jogo: o CTP fica no personagem). */
export const EquipmentSchema = z.object({ ctpByAgent: z.record(idSchema, idSchema) });

export const UserSelectionsSchema = z.object({
  version: z.literal(1),
  updatedAt: z.iso.datetime(),
  roster: z.object({ ownedUniformIds: z.array(idSchema).max(5000) }),
  teams: z.record(teamKeySchema, UserTeamSchema),
  equipment: EquipmentSchema.default({ ctpByAgent: {} }),
});
export type UserSelections = z.infer<typeof UserSelectionsSchema>;

export const PutSelectionsSchema = z.object({
  selections: UserSelectionsSchema,
  baseUpdatedAt: z.iso.datetime().optional().nullable(),
});
