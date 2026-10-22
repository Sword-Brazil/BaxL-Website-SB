import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { getCycle } from "@/models/api/cycle";
import type { DayMode } from "@/models/domain/enums";
import { dayCtpId } from "@/models/rules/ctpAssign";
import type { UserTeam } from "@/models/schemas/selections";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useBattleClockViewModel } from "./useBattleClockViewModel";
import { useCatalogViewModel } from "./useCatalogViewModel";

export type WeekFilter = "all" | 1 | 2 | 3 | 4;

/** Tela central: os 28 dias do ciclo com BAX e BAL lado a lado, BAI no dia inteiro e o dia atual. */
export function useCycleViewModel() {
  const query = useQuery({ queryKey: ["cycle"], queryFn: getCycle });
  const { clock } = useBattleClockViewModel();
  const catalog = useCatalogViewModel();
  const { doc, hydrated } = useSelectionsStore();
  const [week, setWeek] = useState<WeekFilter>("all");
  const [builder, setBuilder] = useState<{ mode: DayMode | "BAI"; day: number } | null>(null);
  const scrolled = useRef(false);

  const owned = useMemo(() => new Set(doc.roster.ownedUniformIds), [doc.roster.ownedUniformIds]);
  const days = useMemo(
    () => (query.data?.days ?? []).filter((d) => week === "all" || d.week === week),
    [query.data, week],
  );
  const currentDay = clock?.cycleDay ?? null;

  const goToDay = (number: number) => {
    const target = query.data?.days.find((d) => d.number === number);
    if (target && week !== "all" && target.week !== week) setWeek(target.week as WeekFilter);
    requestAnimationFrame(() => document.getElementById(`dia-${number}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const goToday = () => currentDay && goToDay(currentDay);

  // Tempo até a próxima virada de dia (12h BRT), atualizado com o relógio (a cada minuto).
  const timeToNextDay = useMemo(() => {
    if (!clock) return "";
    const ms = Math.max(0, Date.parse(clock.nextDayStart) - Date.parse(clock.now));
    const h = Math.floor(ms / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    return `${h}h ${String(m).padStart(2, "0")}min`;
  }, [clock]);

  // Link direto para a montagem: /?montar=BAX-4 (ou BAL-12, BAI-3). Vale até o usuário fechar.
  const router = useRouter();
  const [deepLinkDismissed, setDeepLinkDismissed] = useState(false);
  const deepLink = useMemo(() => {
    const m = /^(BAX|BAL|BAI)-(\d{1,2})$/.exec(String(router.query.montar ?? ""));
    return m ? { mode: m[1] as DayMode | "BAI", day: Number(m[2]) } : null;
  }, [router.query.montar]);
  const activeBuilder = builder ?? (!deepLinkDismissed && query.data ? deepLink : null);

  // Ao abrir a página, rola até o dia do link (#dia-N) ou, sem âncora, até o dia atual (uma vez).
  useEffect(() => {
    if (scrolled.current || !query.data || !currentDay || catalog.isLoading) return;
    scrolled.current = true;
    if (deepLink) return; // abrindo direto a montagem (?montar=): não rola a página por trás do modal
    const target = /^#dia-\d+$/.test(window.location.hash) ? window.location.hash.slice(1) : `dia-${currentDay}`;
    document.getElementById(target)?.scrollIntoView({ block: "start" });
  }, [query.data, currentDay, catalog.isLoading, deepLink]);

  const teamKeyOf = (mode: DayMode | "BAI", day: number) => (mode === "BAI" ? "BAI" : `${mode}-${day}`);

  return {
    cycle: query.data,
    days,
    allDays: query.data?.days ?? [],
    goToDay,
    timeToNextDay,
    bai: query.data?.bai ?? null,
    clock,
    currentDay,
    week,
    setWeek,
    goToday,
    catalog,
    hasRoster: hydrated && owned.size > 0,
    isOwned: (uniformId: string) => owned.has(uniformId),
    userTeam: (mode: DayMode | "BAI", day: number) => doc.teams[teamKeyOf(mode, day)] ?? null,
    /** CTP do personagem numa equipe do jogador: o do slot (1 ou 2) escolhido para o dia. */
    dayCtpIdOf: (pick: NonNullable<UserTeam[keyof UserTeam]>) =>
      dayCtpId(pick, doc.equipment, catalog.uniformById(pick.uniformId)?.agent.id),
    builder: activeBuilder,
    openBuilder: (mode: DayMode | "BAI", day: number) => setBuilder({ mode, day }),
    closeBuilder: () => {
      setBuilder(null);
      setDeepLinkDismissed(true);
    },
    teamKeyOf,
    isLoading: query.isLoading || catalog.isLoading,
    isError: query.isError || catalog.isError,
    retry: () => {
      query.refetch();
      catalog.refetch();
    },
  };
}

export type CycleViewModel = ReturnType<typeof useCycleViewModel>;
