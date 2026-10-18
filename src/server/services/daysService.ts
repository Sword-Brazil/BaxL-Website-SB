import { isBaiDay, weekdayOf, type DayMode } from "@/models/domain/enums";
import type { DayDetail, DaySummary, MetaTeam } from "@/models/domain/types";
import { HttpError } from "@/server/http";
import { daysRepository } from "@/server/repositories/daysRepository";
import { metaTeamRepository } from "@/server/repositories/metaTeamRepository";
import { toCriteria, toMetaTeam, toPriority } from "./mappers";

export async function listDays(mode: DayMode): Promise<DaySummary[]> {
  const days = await daysRepository.listByMode(mode);
  return days.map((d) => {
    const teams = d.metaTeams.map(toMetaTeam);
    const primaryTeam = teams.find((t) => t.isPrimary) ?? teams[0] ?? null;
    return {
      mode,
      number: d.number,
      weekday: weekdayOf(d.number),
      criteria: toCriteria(d.criteria),
      primaryTeam,
      updatedAt: primaryTeam?.updatedAt ?? null,
    };
  });
}

export async function getDay(mode: DayMode, number: number): Promise<DayDetail> {
  const day = isBaiDay(number) ? null : await daysRepository.find(mode, number);
  if (!day) throw new HttpError(404, "NOT_FOUND", "Dia não encontrado");
  return {
    mode,
    number,
    weekday: weekdayOf(number),
    criteria: toCriteria(day.criteria),
    metaTeams: day.metaTeams.map(toMetaTeam),
    priority: toPriority(day.priorityEntries),
  };
}

export async function listBalFree(): Promise<MetaTeam[]> {
  return (await metaTeamRepository.listByScope("BAL_FREE")).map(toMetaTeam);
}
