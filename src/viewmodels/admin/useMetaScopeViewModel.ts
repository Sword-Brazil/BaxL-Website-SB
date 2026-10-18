import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCycle } from "@/models/api/cycle";
import type { DayMode, TeamScope } from "@/models/domain/enums";
import type { Criterion } from "@/models/domain/types";
import { matchesRestriction } from "@/models/rules/restriction";
import { useCatalogViewModel, type UniformRef } from "@/viewmodels/useCatalogViewModel";

/**
 * Escopo em edição na aba Metas (Dia BAX/BAL, BAL livre ou BAI) e os uniformes elegíveis.
 * As restrições vêm do ciclo inteiro (uma consulta), então trocar de dia é instantâneo.
 */
export function useMetaScopeViewModel() {
  const [scope, setScope] = useState<TeamScope>("DAY");
  const [mode, setMode] = useState<DayMode>("BAX");
  const [number, setNumber] = useState(1);
  const catalog = useCatalogViewModel();
  const cycle = useQuery({ queryKey: ["cycle"], queryFn: getCycle });
  const isDay = scope === "DAY";

  const criteria = useMemo(() => {
    if (!isDay) return [];
    const day = cycle.data?.days.find((d) => d.number === number);
    return (mode === "BAX" ? day?.bax : day?.bal)?.criteria ?? [];
  }, [isDay, cycle.data, mode, number]);

  /** Trajes ativos que atendem a uma restrição. */
  const optionsFor = (cs: readonly Criterion[]): UniformRef[] =>
    catalog.agents
      .filter((a) => a.active)
      .flatMap((agent) => agent.uniforms.filter((u) => u.active && matchesRestriction(u, cs)).map((uniform) => ({ agent, uniform })));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- optionsFor só depende de catalog.agents
  const options = useMemo(() => optionsFor(criteria), [catalog.agents, criteria]);

  return {
    scope,
    setScope,
    mode,
    number,
    /** Aponta o escopo para um dia/modo (ex.: ao editar pelo quadro do ciclo). */
    select: (m: DayMode, n: number) => {
      setScope("DAY");
      setMode(m);
      setNumber(n);
    },
    isDay,
    criteria,
    options,
    optionsFor,
    catalog,
    cycle,
    /** Alvo para as APIs de equipes/prioridade. */
    target: isDay ? ({ scope: "DAY", mode, number } as const) : scope === "BAI" ? ({ scope: "BAI" } as const) : null,
    isLoading: catalog.isLoading || (isDay && cycle.isLoading),
  };
}

export type MetaScopeViewModel = ReturnType<typeof useMetaScopeViewModel>;
