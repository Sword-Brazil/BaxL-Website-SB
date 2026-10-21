import { useMemo, useState } from "react";
import { DISPLAY_SLOTS, type Slot } from "@/models/domain/enums";
import type { Criterion, MetaTeam, PriorityLists } from "@/models/domain/types";
import { compareWithMeta } from "@/models/rules/compare";
import { matchesRestriction } from "@/models/rules/restriction";
import { suggestTeam } from "@/models/rules/suggest";
import type { TeamKey, UserTeam } from "@/models/schemas/selections";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useCatalogViewModel, type UniformRef } from "./useCatalogViewModel";

/**
 * Equipe pessoal de um dia (ou da BAI): candidatos do elenco (ou, na escolha livre, de todo o
 * catálogo) que atendem à restrição,
 * comparação com a Meta, sugestão, cópia da Meta/Alternativa e CTPs equipados nos personagens
 * (arrastar e soltar, toque ou teclado).
 */
export function useTeamBuilderViewModel({
  teamKey,
  criteria,
  metaTeams,
  priority,
}: {
  teamKey: TeamKey;
  criteria: Criterion[];
  /** Meta (principal) primeiro, depois alternativas. */
  metaTeams: MetaTeam[];
  priority: PriorityLists;
}) {
  const catalog = useCatalogViewModel();
  const { doc, hydrated, setSlot, clearSlot, equipCtp, applyTeam, setFreePick } = useSelectionsStore();
  const [armedCtp, setArmedCtp] = useState<string | null>(null);

  const owned = useMemo(() => new Set(doc.roster.ownedUniformIds), [doc.roster.ownedUniformIds]);
  const freePick = !!doc.freePick;
  // Personagens que podem entrar na equipe: o elenco ou, na escolha livre, todo traje ativo.
  const pool = useMemo(
    () =>
      freePick
        ? new Set(catalog.agents.filter((a) => a.active).flatMap((a) => a.uniforms.filter((u) => u.active).map((u) => u.id)))
        : owned,
    [freePick, owned, catalog.agents],
  );
  const equipment = useMemo(() => doc.equipment?.ctpByAgent ?? {}, [doc.equipment]);
  const agentIdOf = (uniformId: string) => catalog.uniformById(uniformId)?.agent.id;
  const team = useMemo(() => doc.teams[teamKey] ?? {}, [doc.teams, teamKey]);
  const meta = metaTeams.find((t) => t.isPrimary) ?? metaTeams[0] ?? null;

  const candidates = useMemo<UniformRef[]>(
    () =>
      catalog.agents
        .filter((a) => a.active)
        .flatMap((agent) =>
          agent.uniforms
            .filter((u) => u.active && pool.has(u.id) && matchesRestriction(u, criteria))
            .map((uniform) => ({ agent, uniform })),
        ),
    [catalog.agents, criteria, pool],
  );

  const comparison = useMemo(
    () =>
      meta
        ? compareWithMeta(team, meta, {
            ownedUniformIds: pool,
            agentOf: (u) => catalog.uniformById(u)?.agent.id,
            ctpTypeOf: (c) => catalog.ctpById(c)?.type,
            equippedCtpOf: (u) => equipment[catalog.uniformById(u)?.agent.id ?? ""],
          })
        : null,
    // catalog.* são derivados de catalog.agents/ctps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [team, meta, pool, equipment, catalog.agents, catalog.ctps],
  );

  const suggestion = useMemo(
    () => suggestTeam(pool, priority, criteria, (u) => catalog.uniformById(u)?.agent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, priority, criteria, catalog.agents],
  );

  /** Copia uma equipe Meta/Alternativa mantendo só o que o usuário possui (na escolha livre, tudo). */
  const copyTeam = (source: MetaTeam) => {
    const next: UserTeam = {};
    for (const m of source.members) if (pool.has(m.uniformId)) next[m.slot] = { uniformId: m.uniformId, ctpId: null };
    applyTeam(teamKey, next);
    return Object.keys(next).length;
  };

  const equipOnSlot = (slot: Slot, ctpId: string | null) => {
    const agentId = team[slot] ? agentIdOf(team[slot]!.uniformId) : undefined;
    if (agentId) equipCtp(agentId, ctpId);
  };

  return {
    catalog,
    team,
    metaTeams,
    /** Na ordem da tela: Esquerda · Líder · Direita. */
    slots: DISPLAY_SLOTS.map((slot) => {
      const ref = team[slot] ? catalog.uniformById(team[slot]!.uniformId) : null;
      return {
        slot,
        pick: team[slot] ?? null,
        ref,
        ctp: ref ? catalog.ctpById(equipment[ref.agent.id]) : null,
        comparison: comparison?.[slot] ?? null,
        metaRef: meta ? catalog.uniformById(meta.members.find((m) => m.slot === slot)?.uniformId ?? "") : null,
      };
    }),
    candidates,
    hasRoster: owned.size > 0,
    /** Escolha livre: todos os personagens, só com a restrição do dia (sem preencher o elenco). */
    freePick,
    setFreePick,
    isOwned: (uniformId: string) => owned.has(uniformId),
    suggestion,
    hydrated,
    setSlot: (slot: Slot, uniformId: string) => setSlot(teamKey, slot, uniformId, agentIdOf),
    clearSlot: (slot: Slot) => clearSlot(teamKey, slot),
    applySuggestion: () => suggestion && applyTeam(teamKey, suggestion),
    copyTeam,

    // CTPs: um único comando para arrastar e soltar, toque e teclado; o CTP fica no personagem.
    armedCtp,
    armCtp: (ctpId: string | null) => setArmedCtp((cur) => (cur === ctpId ? null : ctpId)),
    dropCtp: (slot: Slot, ctpId: string) => equipOnSlot(slot, ctpId),
    tapSlot: (slot: Slot) => {
      if (armedCtp && team[slot]) {
        equipOnSlot(slot, armedCtp);
        setArmedCtp(null);
      }
    },
    removeCtp: (slot: Slot) => equipOnSlot(slot, null),
  };
}

export type TeamBuilderViewModel = ReturnType<typeof useTeamBuilderViewModel>;
