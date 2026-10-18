import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCycle } from "@/models/api/cycle";
import { agentRepetition, ctpUsage, type StatsMode } from "@/models/rules/stats";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useCatalogViewModel } from "./useCatalogViewModel";

const TOP = 15;

/** Estatísticas: repetição dos personagens nas equipes do ciclo e CTPs equipados pelo usuário. */
export function useStatsViewModel() {
  const cycle = useQuery({ queryKey: ["cycle"], queryFn: getCycle });
  const catalog = useCatalogViewModel();
  const { doc, hydrated } = useSelectionsStore();
  const [mode, setMode] = useState<StatsMode>("ALL");
  const [includeAlternatives, setIncludeAlternatives] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const repetition = useMemo(
    () =>
      cycle.data
        ? agentRepetition(cycle.data, (u) => catalog.uniformById(u)?.agent, { mode, includeAlternatives })
        : [],
    // catalog.uniformById é derivado de catalog.agents
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cycle.data, catalog.agents, mode, includeAlternatives],
  );

  const usage = useMemo(
    () =>
      ctpUsage(
        doc.equipment?.ctpByAgent ?? {},
        (id) => catalog.ctpById(id),
        (agentId) => catalog.agents.find((a) => a.id === agentId)?.name,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.equipment, catalog.agents, catalog.ctps],
  );

  const ownedAgents = new Set(
    doc.roster.ownedUniformIds.map((u) => catalog.uniformById(u)?.agent.id).filter(Boolean),
  ).size;
  const equipped = usage.reduce((n, r) => n + r.total, 0);

  return {
    mode,
    setMode,
    includeAlternatives,
    setIncludeAlternatives,
    showAll,
    setShowAll,
    repetition: showAll ? repetition : repetition.slice(0, TOP),
    repetitionTotal: repetition.length,
    top: TOP,
    usage,
    equipped,
    ownedAgents,
    hydrated,
    isLoading: cycle.isLoading || catalog.isLoading,
    isError: cycle.isError || catalog.isError,
    retry: () => {
      cycle.refetch();
      catalog.refetch();
    },
  };
}
