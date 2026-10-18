import { describe, expect, it } from "vitest";
import type { CycleOverview } from "@/models/domain/types";
import { changedMetaDays } from "@/models/rules/metaUpdates";

const EMPTY = { solo: [], support: [] };
const mode = (updatedAt: string) => ({ criteria: [], metaTeams: [{ updatedAt }] as never, priority: EMPTY, reserves: EMPTY });

const cycle = {
  days: [
    { number: 1, weekday: "QUI", week: 1, isBai: false, bax: mode("2026-10-18T10:00:00Z"), bal: mode("2026-10-17T10:00:00Z") },
    { number: 3, weekday: "SÁB", week: 1, isBai: true, bax: null, bal: null },
    { number: 4, weekday: "DOM", week: 1, isBai: false, bax: mode("2026-10-01T00:00:00Z"), bal: mode("2026-10-18T12:00:00Z") },
  ],
  bai: { metaTeams: [{ updatedAt: "2026-10-18T09:00:00Z" }], bosses: [], priority: EMPTY, reserves: EMPTY },
} as unknown as CycleOverview;

describe("changedMetaDays", () => {
  it("lista, na ordem do ciclo, os dias com equipes alteradas depois da última visita", () => {
    expect(changedMetaDays(cycle, "2026-10-18T00:00:00Z")).toEqual(["BAX 1", "BAL 4", "BAI"]);
    expect(changedMetaDays(cycle, "2026-10-19T00:00:00Z")).toEqual([]);
  });
});
