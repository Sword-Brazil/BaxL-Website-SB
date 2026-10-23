import { useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { getCatalog } from "@/models/api/catalog";
import type { Agent, Ctp, Uniform } from "@/models/domain/types";
import { contentLang, pick } from "@/models/rules/localize";

export interface UniformRef {
  agent: Agent;
  uniform: Uniform;
}

/** Nomes para a busca: o do idioma da tela, o em inglês e o identificador (vem do nome em português). */
export const searchNames = (item: { name: string; nameEn: string | null; slug: string }) => [item.name, item.nameEn ?? "", item.slug.replace(/-/g, " ")];

/**
 * Catálogo com índices por id (uniforme → agente, CTP). Os nomes vêm no idioma da tela (o
 * espanhol usa o inglês); `raw` mantém os nomes como cadastrados, para o editor do catálogo.
 */
export function useCatalogViewModel({ raw = false }: { raw?: boolean } = {}) {
  const query = useQuery({ queryKey: ["catalog"], queryFn: getCatalog, staleTime: 10 * 60_000 });
  const { locale } = useRouter();
  const lang = raw ? "pt" : contentLang(locale);

  const agents = useMemo(
    () =>
      lang === "pt"
        ? (query.data?.agents ?? [])
        : (query.data?.agents ?? []).map((a) => ({
            ...a,
            name: pick(a.name, a.nameEn, lang),
            uniforms: a.uniforms.map((u) => ({ ...u, name: pick(u.name, u.nameEn, lang) })),
          })),
    [query.data, lang],
  );

  const index = useMemo(() => {
    const uniforms = new Map<string, UniformRef>();
    const ctps = new Map<string, Ctp>();
    for (const agent of agents) {
      for (const uniform of agent.uniforms) uniforms.set(uniform.id, { agent, uniform });
    }
    for (const ctp of query.data?.ctps ?? []) ctps.set(ctp.id, ctp);
    return { uniforms, ctps };
  }, [agents, query.data]);

  return {
    agents,
    ctps: query.data?.ctps ?? [],
    uniformById: (id: string) => index.uniforms.get(id) ?? null,
    ctpById: (id: string | null | undefined) => (id ? (index.ctps.get(id) ?? null) : null),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export type CatalogViewModel = ReturnType<typeof useCatalogViewModel>;
