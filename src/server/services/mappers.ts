import type { CriterionAttribute, DayMode, Slot, TeamScope } from "@/models/domain/enums";
import { SLOTS } from "@/models/domain/enums";
import type { Criterion, MetaTeam, PriorityLists } from "@/models/domain/types";
import { toSeasonMap } from "@/models/rules/teamSeason";

type DbMetaTeam = {
  id: string;
  scope: string;
  isPrimary: boolean;
  isDuo: boolean;
  position: number;
  label: string | null;
  labelEn: string | null;
  notes: string | null;
  videoUrl: string | null;
  seasonVideos: unknown;
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
    seasonStrikers: unknown;
  }[];
};

export function toMetaTeam(t: DbMetaTeam): MetaTeam {
  return {
    id: t.id,
    scope: t.scope as TeamScope,
    mode: (t.battleDay?.mode as DayMode) ?? null,
    dayNumber: t.battleDay?.number ?? null,
    isPrimary: t.isPrimary,
    isDuo: t.isDuo,
    position: t.position,
    label: t.label,
    labelEn: t.labelEn,
    notes: t.notes,
    videoUrl: t.videoUrl,
    seasonVideos: toSeasonMap(t.seasonVideos),
    members: [...t.members]
      .sort((a, b) => SLOTS.indexOf(a.slot as Slot) - SLOTS.indexOf(b.slot as Slot))
      .map((m) => ({
        slot: m.slot as Slot,
        uniformId: m.uniformId,
        ctpId: m.ctpId,
        ctpSlot: m.ctpSlot === 1 || m.ctpSlot === 2 ? m.ctpSlot : null,
        isDamageDealer: m.isDamageDealer,
        strikerUniformId: m.strikerUniformId,
        seasonStrikers: toSeasonMap(m.seasonStrikers),
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
