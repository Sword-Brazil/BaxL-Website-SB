import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCycle } from "@/models/api/cycle";
import { ownedAgentIds, rosterAgents, uniformsInTeams } from "@/models/rules/roster";
import { agentRepetition, ctpUsage, myAgentRepetition, myTeamCompositions, type StatsMode } from "@/models/rules/stats";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useCatalogViewModel } from "./useCatalogViewModel";

const TOP = 15;

/** Origem da repetição: equipes Meta dos curadores ou equipes montadas pelo usuário. */
export type RepetitionSource = "META" | "MINE";

/**
 * Estatísticas: repetição dos personagens (nas Metas ou nas equipes do usuário), as equipes do
 * usuário agrupadas pelas que mais se repetem e os CTPs equipados.
 */
export function useStatsViewModel() {
  const cycle = useQuery({ queryKey: ["cycle"], queryFn: getCycle });
  const catalog = useCatalogViewModel();
  const { doc, hydrated } = useSelectionsStore();
  const [mode, setMode] = useState<StatsMode>("ALL");
  const [source, setSource] = useState<RepetitionSource>("META");
  const [includeAlternatives, setIncludeAlternatives] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const agentOf = (u: string) => catalog.uniformById(u)?.agent;
  const repetition = useMemo(
    () =>
      source === "MINE"
        ? myAgentRepetition(doc.teams, agentOf, mode)
        : cycle.data
          ? agentRepetition(cycle.data, agentOf, { mode, includeAlternatives })
          : [],
    // agentOf é derivado de catalog.agents
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, doc.teams, cycle.data, catalog.agents, mode, includeAlternatives],
  );

  const compositions = useMemo(
    () => myTeamCompositions(doc.teams, agentOf, mode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.teams, catalog.agents, mode],
  );

  // Personagens do jogador, contados como em Meu elenco. Na escolha livre (sem elenco), todos.
  const available = useMemo(() => {
    const used = uniformsInTeams(cycle.data);
    return doc.freePick
      ? new Set(rosterAgents(catalog.agents, used).map((a) => a.id))
      : ownedAgentIds(catalog.agents, new Set(doc.roster.ownedUniformIds), used);
  }, [cycle.data, catalog.agents, doc.freePick, doc.roster.ownedUniformIds]);

  // Só CTPs de personagens disponíveis: um CTP que ficou num personagem desmarcado não conta.
  const usage = useMemo(
    () =>
      ctpUsage(
        Object.fromEntries(Object.entries(doc.equipment?.ctpByAgent ?? {}).filter(([agentId]) => available.has(agentId))),
        (id) => catalog.ctpById(id),
        (agentId) => catalog.agents.find((a) => a.id === agentId)?.name,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.equipment, available, catalog.agents, catalog.ctps],
  );

  const ownedAgents = available.size;
  const equipped = usage.reduce((n, r) => n + r.total, 0);

  return {
    catalog,
    mode,
    setMode,
    source,
    setSource,
    compositions,
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
