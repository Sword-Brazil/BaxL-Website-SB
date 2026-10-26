import { describe, expect, it } from "vitest";
import type { CycleOverview } from "@/models/domain/types";
import { freeDayKeys, freeTeamKeys } from "@/models/rules/selections";

const EMPTY = { solo: [], support: [] };
const mode = (criteria: { attribute: "GENDER"; value: string }[]) => ({ criteria, metaTeams: [], priority: EMPTY, reserves: EMPTY });
const female = [{ attribute: "GENDER" as const, value: "FEMALE" }];

const cycle: CycleOverview = {
  season: { BAX: "PARALYSIS", BAL: "SHOCK" },
  days: [
    { number: 1, weekday: "QUI", week: 1, isBai: false, bax: mode([]), bal: mode(female) },
    { number: 2, weekday: "SEX", week: 1, isBai: false, bax: mode(female), bal: mode([]) },
    { number: 3, weekday: "SÁB", week: 1, isBai: true, bax: null, bal: null },
    { number: 4, weekday: "DOM", week: 1, isBai: false, bax: mode([]), bal: mode([]) },
  ],
  bai: { metaTeams: [], bosses: [], priority: EMPTY, reserves: EMPTY },
};

describe("freeDayKeys", () => {
  it("só os dias de BAX e BAL sem restrição (sem BAI), menos o próprio dia", () => {
    expect(freeDayKeys(cycle)).toEqual(["BAX-1", "BAL-2", "BAX-4", "BAL-4"]);
    expect(freeDayKeys(cycle, "BAX-4")).toEqual(["BAX-1", "BAL-2", "BAL-4"]);
    expect(freeDayKeys(undefined)).toEqual([]);
  });
});

describe("freeTeamKeys", () => {
  it("só repete no mesmo modo: BAX com BAX, BAL com BAL; a BAI não tem outros", () => {
    expect(freeTeamKeys(cycle, "BAX-1")).toEqual(["BAX-4"]);
    expect(freeTeamKeys(cycle, "BAL-2")).toEqual(["BAL-4"]);
    expect(freeTeamKeys(cycle, "BAI")).toEqual([]);
    expect(freeTeamKeys(undefined, "BAX-1")).toEqual([]);
  });
});
