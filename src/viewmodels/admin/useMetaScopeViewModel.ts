import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDay } from "@/models/api/days";
import type { DayMode, TeamScope } from "@/models/domain/enums";
import { matchesRestriction } from "@/models/rules/restriction";
import { useCatalogViewModel, type UniformRef } from "@/viewmodels/useCatalogViewModel";

/** Escopo em edição na aba Metas (Dia BAX/BAL, BAL livre ou BAI) e os uniformes elegíveis. */
export function useMetaScopeViewModel() {
  const [scope, setScope] = useState<TeamScope>("DAY");
  const [mode, setMode] = useState<DayMode>("BAX");
  const [number, setNumber] = useState(1);
  const catalog = useCatalogViewModel();
  const isDay = scope === "DAY";

  const day = useQuery({ queryKey: ["day", mode, number], queryFn: () => getDay(mode, number), enabled: isDay });
  const criteria = useMemo(() => (isDay ? (day.data?.criteria ?? []) : []), [isDay, day.data]);

  const options = useMemo<UniformRef[]>(
    () =>
      catalog.agents
        .filter((a) => a.active && matchesRestriction(a, criteria))
        .flatMap((agent) => agent.uniforms.filter((u) => u.active).map((uniform) => ({ agent, uniform }))),
    [catalog.agents, criteria],
  );

  return {
    scope,
    setScope,
    mode,
    setMode,
    number,
    setNumber,
    isDay,
    criteria,
    options,
    catalog,
    /** Alvo para as APIs de equipes/prioridade. */
    target: isDay ? ({ scope: "DAY", mode, number } as const) : scope === "BAI" ? ({ scope: "BAI" } as const) : null,
    isLoading: catalog.isLoading || (isDay && day.isLoading),
  };
}

export type MetaScopeViewModel = ReturnType<typeof useMetaScopeViewModel>;
