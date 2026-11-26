import { isBaiDay, weekdayOf, type DayMode } from "@/models/domain/enums";
import type { DayDetail, DaySummary, MetaTeam } from "@/models/domain/types";
import { HttpError } from "@/server/http";
import { daysRepository } from "@/server/repositories/daysRepository";
import { metaTeamRepository } from "@/server/repositories/metaTeamRepository";
import { effectivePriority } from "@/models/rules/priority";
import { teamForSeason } from "@/models/rules/teamSeason";
import { getSeason } from "./seasonService";
import { toCriteria, toMetaTeam, toPriority } from "./mappers";

export async function listDays(mode: DayMode): Promise<DaySummary[]> {
  const [days, season] = await Promise.all([daysRepository.listByMode(mode), getSeason()]);
  return days.map((d) => {
    const teams = d.metaTeams.map((t) => teamForSeason(toMetaTeam(t), season.id));
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
  const [day, season] = await Promise.all([isBaiDay(number) ? null : daysRepository.find(mode, number), getSeason()]);
  if (!day) throw new HttpError(404, "NOT_FOUND", "Dia não encontrado");
  const metaTeams = day.metaTeams.map((t) => teamForSeason(toMetaTeam(t), season.id));
  return {
    mode,
    number,
    weekday: weekdayOf(number),
    criteria: toCriteria(day.criteria),
    metaTeams,
    priority: effectivePriority(metaTeams, toPriority(day.priorityEntries)),
  };
}

export async function listBalFree(): Promise<MetaTeam[]> {
  const [teams, season] = await Promise.all([metaTeamRepository.listByScope("BAL_FREE"), getSeason()]);
  return teams.map((t) => teamForSeason(toMetaTeam(t), season.id));
}
