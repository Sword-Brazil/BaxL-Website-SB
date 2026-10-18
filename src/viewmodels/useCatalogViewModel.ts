import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCatalog } from "@/models/api/catalog";
import type { Agent, Ctp, Uniform } from "@/models/domain/types";

export interface UniformRef {
  agent: Agent;
  uniform: Uniform;
}

/** Catálogo com índices por id (uniforme → agente, CTP). */
export function useCatalogViewModel() {
  const query = useQuery({ queryKey: ["catalog"], queryFn: getCatalog, staleTime: 10 * 60_000 });

  const index = useMemo(() => {
    const uniforms = new Map<string, UniformRef>();
    const ctps = new Map<string, Ctp>();
    for (const agent of query.data?.agents ?? []) {
      for (const uniform of agent.uniforms) uniforms.set(uniform.id, { agent, uniform });
    }
    for (const ctp of query.data?.ctps ?? []) ctps.set(ctp.id, ctp);
    return { uniforms, ctps };
  }, [query.data]);

  return {
    agents: query.data?.agents ?? [],
    ctps: query.data?.ctps ?? [],
    uniformById: (id: string) => index.uniforms.get(id) ?? null,
    ctpById: (id: string | null | undefined) => (id ? (index.ctps.get(id) ?? null) : null),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export type CatalogViewModel = ReturnType<typeof useCatalogViewModel>;
