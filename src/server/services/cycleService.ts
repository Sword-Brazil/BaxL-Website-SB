import { CYCLE_LENGTH, WEEK_LENGTH, isBaiDay, weekdayOf, type DayMode } from "@/models/domain/enums";
import type { CycleDay, CycleModeDay, CycleOverview } from "@/models/domain/types";
import { daysRepository } from "@/server/repositories/daysRepository";
import { metaTeamRepository } from "@/server/repositories/metaTeamRepository";
import { listBosses } from "./baiService";
import { effectivePriority } from "@/models/rules/priority";
import { toCriteria, toMetaTeam, toPriority } from "./mappers";
import { getPriority } from "./priorityService";

/** Ciclo de 28 dias com BAX e BAL de cada dia e o conteúdo da BAI, para a tela central. */
export async function getCycle(): Promise<CycleOverview> {
  const [bax, bal, baiTeams, bosses, baiReserves] = await Promise.all([
    daysRepository.listByMode("BAX"),
    daysRepository.listByMode("BAL"),
    metaTeamRepository.listByScope("BAI"),
    listBosses(),
    getPriority({ scope: "BAI" }),
  ]);
  const byNumber = (rows: typeof bax) => new Map(rows.map((r) => [r.number, r]));
  const modes: Record<DayMode, ReturnType<typeof byNumber>> = { BAX: byNumber(bax), BAL: byNumber(bal) };

  const modeDay = (mode: DayMode, number: number): CycleModeDay | null => {
    const row = modes[mode].get(number);
    if (!row) return null;
    const metaTeams = row.metaTeams.map(toMetaTeam);
    const reserves = toPriority(row.priorityEntries);
    return { criteria: toCriteria(row.criteria), metaTeams, priority: effectivePriority(metaTeams, reserves), reserves };
  };

  const days: CycleDay[] = Array.from({ length: CYCLE_LENGTH }, (_, i) => {
    const number = i + 1;
    const isBai = isBaiDay(number);
    return {
      number,
      weekday: weekdayOf(number),
      week: Math.floor(i / WEEK_LENGTH) + 1,
      isBai,
      bax: isBai ? null : modeDay("BAX", number),
      bal: isBai ? null : modeDay("BAL", number),
    };
  });

  const baiMetaTeams = baiTeams.map(toMetaTeam);
  return {
    days,
    bai: { metaTeams: baiMetaTeams, bosses, priority: effectivePriority(baiMetaTeams, baiReserves), reserves: baiReserves },
  };
}
