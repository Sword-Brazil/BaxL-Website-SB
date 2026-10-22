import { useState } from "react";
import { SLOTS } from "@/models/domain/enums";
import { brtDateKey } from "@/models/rules/battleClock";
import { dayCtpId } from "@/models/rules/ctpAssign";
import {
  SCORES_FIRST_DATE,
  SCORES_UNLOCK_AT,
  compare,
  dateRange,
  gameDayOf,
  modesOfDay,
  previousSeasonDate,
  scoreEntries,
  scoreKey,
  scoreSummary,
  seasonDays,
  seasonWeeks,
  seasonsWithScores,
  type ScoreMode,
} from "@/models/rules/scores";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useBattleClockViewModel } from "./useBattleClockViewModel";
import { useCatalogViewModel } from "./useCatalogViewModel";

/**
 * Minhas pontuações: o jogador preenche a pontuação de cada dia e modo e compara cada dia e semana
 * com o mesmo dia e semana da temporada anterior (a BA reinicia a cada 28 dias), ao lado da equipe
 * que montou para o dia. Fica bloqueada até o reset semanal de 22/10/2026 às 22h (horário do
 * servidor), quando a contagem começa.
 */
export function useScoresViewModel() {
  const { clock, settings, isLoading: clockLoading, isError, refetch } = useBattleClockViewModel();
  const catalog = useCatalogViewModel();
  const { doc, hydrated, setScore } = useSelectionsStore();
  const [selected, setSelected] = useState<string | null>(null);
  /** Temporada dos gráficos (data do Dia 1); null = a atual. */
  const [seasonChoice, setSeason] = useState<string | null>(null);


  // Sem useMemo: o React Compiler memoriza os cálculos abaixo.
  const scores = doc.scores ?? {};
  const anchor = settings ? brtDateKey(settings.cycleAnchor) : null;
  const today = clock ? brtDateKey(clock.dayStart) : null;
  const now = clock ? Date.parse(clock.now) : null;
  const locked = now === null || now < Date.parse(SCORES_UNLOCK_AT);
  const msToUnlock = now === null ? 0 : Math.max(0, Date.parse(SCORES_UNLOCK_AT) - now);

  // Dias que dá para preencher: do primeiro dia contado até hoje (o mais recente primeiro).
  const dates = today ? dateRange(SCORES_FIRST_DATE, today).reverse() : [];
  const date = selected && dates.includes(selected) ? selected : (dates[0] ?? null);
  const day = date && anchor ? gameDayOf(date, anchor) : null;

  /** A equipe que o jogador montou para o dia do ciclo e o modo, com o CTP do slot do dia. */
  const teamOf = (cycleDay: number, mode: ScoreMode) => {
    const team = doc.teams[mode === "BAI" ? "BAI" : `${mode}-${cycleDay}`];
    return team
      ? SLOTS.flatMap((slot) => {
          const pick = team[slot];
          return pick
            ? [
                {
                  slot,
                  uniformId: pick.uniformId,
                  ctpId: dayCtpId(pick, doc.equipment, catalog.uniformById(pick.uniformId)?.agent.id),
                  strikerUniformId: pick.strikerUniformId ?? null,
                },
              ]
            : [];
        })
      : [];
  };

  const current = today && anchor ? gameDayOf(today, anchor) : null;
  const seasons = anchor && today ? seasonsWithScores(scores, anchor, today) : [];
  const season = seasonChoice && seasons.includes(seasonChoice) ? seasonChoice : (current?.seasonStart ?? null);
  // Cada dia e semana da temporada escolhida contra o mesmo dia e semana da anterior.
  const days = anchor && today && season ? seasonDays(scores, anchor, season, today) : [];
  const weeks = today && season ? seasonWeeks(scores, season, today) : [];
  const summary = anchor && today ? scoreSummary(scores, anchor, today) : null;

  // Histórico: mais recente primeiro, cada registro contra o mesmo dia e modo do mês anterior.
  const history = anchor
    ? scoreEntries(scores, anchor)
        .map((e) => ({ ...e, ...compare(e.points, scores[scoreKey(previousSeasonDate(e.date), e.mode)] ?? null) }))
        .reverse()
    : [];

  return {
    catalog,
    isLoading: clockLoading || !hydrated || catalog.isLoading,
    isError: isError || catalog.isError,
    retry: () => {
      refetch();
      catalog.refetch();
    },
    locked,
    msToUnlock,
    unlockAt: SCORES_UNLOCK_AT,
    today,
    dates,
    date,
    setDate: setSelected,
    day,
    modes: day ? modesOfDay(day) : [],
    dayOf: (d: string) => (anchor ? gameDayOf(d, anchor) : null),
    scoreOf: (d: string, mode: ScoreMode) => scores[scoreKey(d, mode)] ?? null,
    setScore: (d: string, mode: ScoreMode, points: number | null) => {
      if (!locked && dates.includes(d)) setScore(d, mode, points);
    },
    teamOf,
    seasons,
    season,
    setSeason,
    days,
    weeks,
    summary,
    history,
    current,
  };
}

export type ScoresViewModel = ReturnType<typeof useScoresViewModel>;
