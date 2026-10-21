import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRotations } from "@/models/api/rotations";
import type { Agent, Rotation, Uniform } from "@/models/domain/types";
import { useCatalogViewModel } from "./useCatalogViewModel";

export const ROTATIONS_KEY = ["rotations"] as const;

/** Grupo da tela de rotações: um traje (com foto) ou "todos os trajes" (uniform null). */
export interface RotationGroup {
  uniform: Uniform | null;
  rotations: Rotation[];
}

/** Rotações de todos os personagens, indexadas por personagem. */
export function useRotationsViewModel() {
  const catalog = useCatalogViewModel();
  const query = useQuery({ queryKey: ROTATIONS_KEY, queryFn: getRotations });
  const byAgent = useMemo(() => {
    const map = new Map<string, Rotation[]>();
    for (const r of query.data ?? []) map.set(r.agentId, [...(map.get(r.agentId) ?? []), r]);
    return map;
  }, [query.data]);

  /** Grupos na ordem dos trajes do personagem; "todos os trajes" primeiro. */
  const groupsOf = (agent: Agent): RotationGroup[] => {
    const rotations = byAgent.get(agent.id) ?? [];
    const general = rotations.filter((r) => !r.uniformId);
    return [
      ...(general.length ? [{ uniform: null, rotations: general }] : []),
      ...agent.uniforms.flatMap((u) => {
        const own = rotations.filter((r) => r.uniformId === u.id);
        return own.length ? [{ uniform: u, rotations: own }] : [];
      }),
    ];
  };

  return {
    catalog,
    rotationsOf: (agentId: string) => byAgent.get(agentId) ?? [],
    groupsOf,
    /** Personagens com ao menos uma rotação, em ordem alfabética. */
    agentsWithRotations: catalog.agents.filter((a) => byAgent.has(a.id)).sort((a, b) => a.name.localeCompare(b.name)),
    agentBySlug: (slug: string) => catalog.agents.find((a) => a.slug === slug) ?? null,
    isLoading: query.isLoading || catalog.isLoading,
    isError: query.isError || catalog.isError,
    retry: () => {
      query.refetch();
      catalog.refetch();
    },
  };
}
