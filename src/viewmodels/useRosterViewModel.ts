import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCycle } from "@/models/api/cycle";
import { toast } from "sonner";
import { CRITERION_ATTRIBUTES, type CriterionAttribute } from "@/models/domain/enums";
import type { Agent } from "@/models/domain/types";
import type { CtpSlot } from "@/models/rules/ctpAssign";
import { matchesRestriction } from "@/models/rules/restriction";
import { ownedAgentIds, rosterAgents, uniformsInTeams, visibleUniforms } from "@/models/rules/roster";
import { UserSelectionsSchema } from "@/models/schemas/selections";
import { useSelectionsStore } from "./stores/selectionsStore";
import { searchNames, useCatalogViewModel } from "./useCatalogViewModel";

type Filters = Partial<Record<CriterionAttribute, string>>;

/** Elenco do usuário: marcação de uniformes, busca/filtros, backup e redefinição por modo. */
export function useRosterViewModel(messages: { imported: string; invalid: string }) {
  const catalog = useCatalogViewModel();
  const cycle = useQuery({ queryKey: ["cycle"], queryFn: getCycle });
  const usedUniforms = useMemo(() => uniformsInTeams(cycle.data), [cycle.data]);
  const { doc, hydrated, toggleOwnedUniform, setOwnedUniforms, replaceAll, equipCtp } = useSelectionsStore();
  const [search, setSearch] = useState("");
  const [armedCtp, setArmedCtp] = useState<string | null>(null);
  const equipment = doc.equipment?.ctpByAgent ?? {};
  const equipment2 = doc.equipment?.ctp2ByAgent ?? {};
  const [filters, setFilters] = useState<Filters>({});

  const owned = useMemo(() => new Set(doc.roster.ownedUniformIds), [doc.roster.ownedUniformIds]);
  const activeAgents = useMemo(() => rosterAgents(catalog.agents, usedUniforms), [catalog.agents, usedUniforms]);
  const ownedAgents = useMemo(() => ownedAgentIds(catalog.agents, owned, usedUniforms), [catalog.agents, owned, usedUniforms]);

  const agents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const criteria = CRITERION_ATTRIBUTES.flatMap((a) => (filters[a] ? [{ attribute: a, value: filters[a]! }] : []));
    return activeAgents.filter((a) => (!q || searchNames(a).some((n) => n.toLowerCase().includes(q))) && a.uniforms.some((u) => matchesRestriction(u, criteria)));
  }, [activeAgents, search, filters]);

  const isAgentOwned = (agentId: string) => ownedAgents.has(agentId);

  return {
    agents,
    visibleUniforms: (agent: Agent) => visibleUniforms(agent, usedUniforms),
    // CTPs 1 e 2 de cada personagem possuído (arrastar e soltar, ou tocar no CTP e depois no slot).
    ctps: catalog.ctps.filter((ctp) => ctp.active),
    equippedCtpOf: (agentId: string, slot: CtpSlot = 1) => catalog.ctpById((slot === 2 ? equipment2 : equipment)[agentId]),
    isAgentOwned,
    armedCtp,
    armCtp: (ctpId: string | null) => setArmedCtp((cur) => (cur === ctpId ? null : ctpId)),
    equip: (agentId: string, ctpId: string | null, slot: CtpSlot = 1) => {
      if (isAgentOwned(agentId) || ctpId === null) equipCtp(agentId, ctpId, slot);
    },
    tapAgent: (agentId: string, slot: CtpSlot = 1) => {
      if (armedCtp && isAgentOwned(agentId)) {
        equipCtp(agentId, armedCtp, slot);
        setArmedCtp(null);
      }
    },
    isOwned: (uniformId: string) => owned.has(uniformId),
    toggle: toggleOwnedUniform,
    setAgentOwned: (agentId: string, isOwned: boolean) => {
      const agent = activeAgents.find((a) => a.id === agentId);
      if (agent) setOwnedUniforms(visibleUniforms(agent, usedUniforms).map((u) => u.id), isOwned);
    },
    ownedAgentCount: ownedAgents.size,
    totalAgents: activeAgents.length,
    search,
    setSearch,
    filters,
    setFilter: (attribute: CriterionAttribute, value: string) =>
      setFilters((f) => ({ ...f, [attribute]: value || undefined })),
    clearFilters: () => setFilters({}),
    hasFilters: Object.values(filters).some(Boolean) || !!search,
    exportBackup: () => {
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mff-selecoes-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    importBackup: async (file: File) => {
      try {
        const parsed = UserSelectionsSchema.safeParse(JSON.parse(await file.text()));
        if (!parsed.success) throw new Error();
        replaceAll({ ...parsed.data, updatedAt: new Date().toISOString() });
        toast.success(messages.imported);
      } catch {
        toast.error(messages.invalid);
      }
    },
    isLoading: catalog.isLoading || !hydrated,
    isError: catalog.isError,
    retry: catalog.refetch,
  };
}
