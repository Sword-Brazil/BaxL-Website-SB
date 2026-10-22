import type { CriterionAttribute, DayMode, Slot, TeamScope } from "@/models/domain/enums";
import { SLOTS } from "@/models/domain/enums";
import type { Criterion, MetaTeam, PriorityLists } from "@/models/domain/types";

type DbMetaTeam = {
  id: string;
  scope: string;
  isPrimary: boolean;
  label: string | null;
  notes: string | null;
  updatedAt: Date;
  battleDay: { mode: string; number: number } | null;
  updatedBy: { nickname: string | null } | null;
  members: {
    slot: string;
    uniformId: string;
    ctpId: string | null;
    ctpSlot: number | null;
    isDamageDealer: boolean;
    strikerUniformId: string | null;
  }[];
};

export function toMetaTeam(t: DbMetaTeam): MetaTeam {
  return {
    id: t.id,
    scope: t.scope as TeamScope,
    mode: (t.battleDay?.mode as DayMode) ?? null,
    dayNumber: t.battleDay?.number ?? null,
    isPrimary: t.isPrimary,
    label: t.label,
    notes: t.notes,
    members: [...t.members]
      .sort((a, b) => SLOTS.indexOf(a.slot as Slot) - SLOTS.indexOf(b.slot as Slot))
      .map((m) => ({
        slot: m.slot as Slot,
        uniformId: m.uniformId,
        ctpId: m.ctpId,
        ctpSlot: m.ctpSlot === 1 || m.ctpSlot === 2 ? m.ctpSlot : null,
        isDamageDealer: m.isDamageDealer,
        strikerUniformId: m.strikerUniformId,
      })),
    updatedAt: t.updatedAt.toISOString(),
    updatedBy: t.updatedBy?.nickname ?? null,
  };
}

export const toCriteria = (rows: { attribute: string; value: string }[]): Criterion[] =>
  rows.map((c) => ({ attribute: c.attribute as CriterionAttribute, value: c.value }));

export function toPriority(rows: { role: string; rank: number; uniformId: string; ctpId: string | null }[]): PriorityLists {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const pick = (role: string) =>
    sorted.filter((r) => r.role === role).map((r) => ({ rank: r.rank, uniformId: r.uniformId, ctpId: r.ctpId }));
  return { solo: pick("SOLO"), support: pick("SUPPORT") };
}
