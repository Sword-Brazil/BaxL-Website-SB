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
 * comparação com a Meta, sugestão, cópia da Meta/Alternativa e o CTP de cada personagem neste dia
 * (arrastar e soltar, toque ou teclado). Sem CTP do dia, vale o CTP padrão do personagem (elenco).
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
  const { doc, hydrated, setSlot, clearSlot, setStriker, setSlotCtp, applyTeam, setFreePick } = useSelectionsStore();
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
  /** CTP usado pelo uniforme nesta equipe: o do dia ou, sem ele, o padrão do personagem. */
  const ctpIdOf = (uniformId: string) =>
    Object.values(team).find((p) => p?.uniformId === uniformId)?.ctpId ?? equipment[agentIdOf(uniformId) ?? ""];

  const candidates = useMemo<UniformRef[]>(
    () =>
      catalog.agents
        .filter((a) => a.active)
        .flatMap((agent) =>
          agent.uniforms
            .filter((u) => u.active && pool.has(u.id) && matchesRestriction(u, criteria, { strict: true }))
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
            equippedCtpOf: ctpIdOf,
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
    for (const m of source.members) {
      if (!pool.has(m.uniformId)) continue;
      // O Striker meta do Causador de Dano vem junto, se o jogador também tiver o Striker.
      const striker = m.isDamageDealer && m.strikerUniformId && pool.has(m.strikerUniformId) ? m.strikerUniformId : null;
      // O CTP da Meta neste dia vira o CTP do dia do jogador (sem CTP na Meta, vale o padrão).
      next[m.slot] = { uniformId: m.uniformId, ctpId: m.ctpId ?? null, strikerUniformId: striker };
    }
    applyTeam(teamKey, next);
    return Object.keys(next).length;
  };

  const equipOnSlot = (slot: Slot, ctpId: string | null) => {
    if (team[slot]) setSlotCtp(teamKey, slot, ctpId);
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
        ctp: ref ? catalog.ctpById(team[slot]?.ctpId ?? equipment[ref.agent.id]) : null,
        /** O CTP mostrado é o padrão do personagem (não há CTP próprio deste dia). */
        ctpIsDefault: !!ref && !team[slot]?.ctpId && !!equipment[ref.agent.id],
        /** Há CTP padrão: "remover" o CTP do dia volta para ele. */
        hasDefaultCtp: !!ref && !!equipment[ref.agent.id],
        striker: team[slot]?.strikerUniformId ? catalog.uniformById(team[slot]!.strikerUniformId!) : null,
        /** Striker da Meta para esta posição (quando ela é Causadora de Dano), como referência. */
        metaStriker: (() => {
          const m = meta?.members.find((x) => x.slot === slot);
          return m?.isDamageDealer && m.strikerUniformId ? catalog.uniformById(m.strikerUniformId) : null;
        })(),
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
    setStriker: (slot: Slot, strikerUniformId: string | null) => setStriker(teamKey, slot, strikerUniformId),
    /** Strikers possíveis para a posição: os mesmos personagens liberados para a equipe, menos o próprio. */
    strikerOptions: (slot: Slot): UniformRef[] => {
      const own = team[slot] ? agentIdOf(team[slot]!.uniformId) : undefined;
      return catalog.agents
        .filter((a) => a.active && a.id !== own)
        .flatMap((agent) => agent.uniforms.filter((u) => u.active && pool.has(u.id)).map((uniform) => ({ agent, uniform })));
    },
    applySuggestion: () => suggestion && applyTeam(teamKey, suggestion),
    copyTeam,

    // CTPs: um único comando para arrastar e soltar, toque e teclado; o CTP vale só neste dia.
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
