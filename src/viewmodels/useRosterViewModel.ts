import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCycle } from "@/models/api/cycle";
import { toast } from "sonner";
import { CRITERION_ATTRIBUTES, type CriterionAttribute, type Mode } from "@/models/domain/enums";
import type { Agent, CycleOverview } from "@/models/domain/types";
import { matchesRestriction } from "@/models/rules/restriction";
import { UserSelectionsSchema } from "@/models/schemas/selections";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useCatalogViewModel } from "./useCatalogViewModel";

type Filters = Partial<Record<CriterionAttribute, string>>;

/** Uniformes usados em alguma equipe (Meta/Alternativa) do ciclo ou da BAI. */
function uniformsInTeams(cycle: CycleOverview | undefined): Set<string> {
  const teams = cycle
    ? [...cycle.days.flatMap((d) => [...(d.bax?.metaTeams ?? []), ...(d.bal?.metaTeams ?? [])]), ...cycle.bai.metaTeams]
    : [];
  return new Set(teams.flatMap((t) => t.members.map((m) => m.uniformId)));
}

/**
 * Trajes exibidos no elenco: o "Padrão" some quando o personagem tem outros trajes e o Padrão
 * não é usado em nenhuma equipe (o personagem é jogado com traje).
 */
function visibleUniforms(agent: Agent, used: Set<string>) {
  const active = agent.uniforms.filter((u) => u.active);
  const hasCostume = active.some((u) => u.slug !== "padrao");
  return active.filter((u) => !(u.slug === "padrao" && hasCostume && !used.has(u.id)));
}

/** Elenco do usuário: marcação de uniformes, busca/filtros, backup e redefinição por modo. */
export function useRosterViewModel(messages: { imported: string; invalid: string; reset: (mode: Mode) => string }) {
  const catalog = useCatalogViewModel();
  const cycle = useQuery({ queryKey: ["cycle"], queryFn: getCycle });
  const usedUniforms = useMemo(() => uniformsInTeams(cycle.data), [cycle.data]);
  const { doc, hydrated, toggleOwnedUniform, setOwnedUniforms, replaceAll, resetMode, equipCtp } = useSelectionsStore();
  const [search, setSearch] = useState("");
  const [armedCtp, setArmedCtp] = useState<string | null>(null);
  const equipment = doc.equipment?.ctpByAgent ?? {};
  const [filters, setFilters] = useState<Filters>({});

  const owned = useMemo(() => new Set(doc.roster.ownedUniformIds), [doc.roster.ownedUniformIds]);
  const activeAgents = useMemo(() => catalog.agents.filter((a) => a.active), [catalog.agents]);

  const agents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const criteria = CRITERION_ATTRIBUTES.flatMap((a) => (filters[a] ? [{ attribute: a, value: filters[a]! }] : []));
    return activeAgents.filter((a) => (!q || a.name.toLowerCase().includes(q)) && a.uniforms.some((u) => matchesRestriction(u, criteria)));
  }, [activeAgents, search, filters]);

  const ownedAgentCount = activeAgents.filter((a) => a.uniforms.some((u) => owned.has(u.id))).length;

  const isAgentOwned = (agentId: string) =>
    activeAgents.some((a) => a.id === agentId && a.uniforms.some((u) => owned.has(u.id)));

  return {
    agents,
    visibleUniforms: (agent: Agent) => visibleUniforms(agent, usedUniforms),
    // CTP equipado em cada personagem possuído (arrastar e soltar, ou tocar no CTP e depois no personagem).
    ctps: catalog.ctps.filter((ctp) => ctp.active),
    equippedCtpOf: (agentId: string) => catalog.ctpById(equipment[agentId]),
    isAgentOwned,
    armedCtp,
    armCtp: (ctpId: string | null) => setArmedCtp((cur) => (cur === ctpId ? null : ctpId)),
    equip: (agentId: string, ctpId: string | null) => {
      if (isAgentOwned(agentId) || ctpId === null) equipCtp(agentId, ctpId);
    },
    tapAgent: (agentId: string) => {
      if (armedCtp && isAgentOwned(agentId)) {
        equipCtp(agentId, armedCtp);
        setArmedCtp(null);
      }
    },
    isOwned: (uniformId: string) => owned.has(uniformId),
    toggle: toggleOwnedUniform,
    setAgentOwned: (agentId: string, isOwned: boolean) => {
      const agent = activeAgents.find((a) => a.id === agentId);
      if (agent) setOwnedUniforms(visibleUniforms(agent, usedUniforms).map((u) => u.id), isOwned);
    },
    ownedAgentCount,
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
    resetMode: (mode: Mode) => {
      resetMode(mode);
      toast.success(messages.reset(mode));
    },
    isLoading: catalog.isLoading || !hydrated,
    isError: catalog.isError,
    retry: catalog.refetch,
  };
}
