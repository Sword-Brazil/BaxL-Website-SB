import { SLOTS, type CtpType, type Slot } from "@/models/domain/enums";
import type { MetaTeam } from "@/models/domain/types";
import type { UserTeam } from "@/models/schemas/selections";

export type SlotStatus = "MATCH" | "DIFFERENT" | "NOT_OWNED" | "UNIFORM_NOT_OWNED";
export type CtpStatus = "MATCH" | "CTP_DIFFERENT" | "NONE";

export interface CompareContext {
  ownedUniformIds: ReadonlySet<string>;
  agentOf: (uniformId: string) => string | undefined;
  ctpTypeOf: (ctpId: string) => CtpType | undefined;
  /** CTP equipado no personagem do uniforme escolhido (o CTP fica no personagem). */
  equippedCtpOf: (uniformId: string) => string | undefined;
}

/**
 * Compara a equipe do usuário com a Meta, slot a slot:
 * - NOT_OWNED: o usuário não possui o agente Meta;
 * - UNIFORM_NOT_OWNED: possui o agente, mas não o uniforme Meta;
 * - DIFFERENT: possui, mas escolheu outro (ou nada) no slot;
 * - MATCH: mesmo uniforme. O CTP equipado no personagem é comparado pelo tipo
 *   (NONE se o usuário não equipou CTP ou se a Meta não recomenda um).
 */
export function compareWithMeta(userTeam: UserTeam, meta: MetaTeam, ctx: CompareContext) {
  const ownedAgents = new Set([...ctx.ownedUniformIds].map(ctx.agentOf).filter(Boolean));
  const result = {} as Record<Slot, { status: SlotStatus; ctp: CtpStatus }>;

  for (const slot of SLOTS) {
    const target = meta.members.find((m) => m.slot === slot);
    const pick = userTeam[slot];
    if (!target) {
      result[slot] = { status: "MATCH", ctp: "MATCH" };
      continue;
    }
    let status: SlotStatus;
    if (!ownedAgents.has(ctx.agentOf(target.uniformId))) status = "NOT_OWNED";
    else if (!ctx.ownedUniformIds.has(target.uniformId)) status = "UNIFORM_NOT_OWNED";
    else if (pick?.uniformId !== target.uniformId) status = "DIFFERENT";
    else status = "MATCH";

    const equipped = pick ? ctx.equippedCtpOf(pick.uniformId) : undefined;
    const ctp: CtpStatus =
      !equipped || !target.ctpId
        ? "NONE"
        : ctx.ctpTypeOf(equipped) === ctx.ctpTypeOf(target.ctpId)
          ? "MATCH"
          : "CTP_DIFFERENT";
    result[slot] = { status, ctp };
  }
  return result;
}
