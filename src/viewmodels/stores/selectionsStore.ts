import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SLOTS, type Mode, type Slot } from "@/models/domain/enums";
import { equipCtp, type CtpSlot } from "@/models/rules/ctpAssign";
import { scoreKey, type ScoreMode, type ScorePhase } from "@/models/rules/scores";
import { emptySelections } from "@/models/rules/selections";
import type { TeamKey, UserSelections, UserTeam } from "@/models/schemas/selections";

/**
 * Tudo do jogador fica no aparelho (localStorage): elenco, equipes, CTPs e o nome no jogo. Logado,
 * o documento também é sincronizado com a conta (useSelectionsSyncViewModel).
 */
interface SelectionsState {
  doc: UserSelections;
  /** updatedAt do servidor na última sincronização (null = nunca sincronizou). */
  syncBase: string | null;
  /** Conta à qual o documento local foi vinculado. */
  syncUserId: string | null;
  /** doc.updatedAt no momento da última sincronização (diferente = há mudanças locais). */
  syncedLocalAt: string | null;
  hydrated: boolean;

  setNickname: (nickname: string) => void;
  toggleOwnedUniform: (uniformId: string) => void;
  setOwnedUniforms: (uniformIds: string[], owned: boolean) => void;
  /** Liga/desliga a escolha livre: todos os personagens nas equipes, sem depender do elenco. */
  setFreePick: (on: boolean) => void;
  /** Coloca o uniforme no slot; remove o mesmo agente de outro slot da equipe (invariante). */
  setSlot: (teamKey: TeamKey, slot: Slot, uniformId: string, agentOf: (uniformId: string) => string | undefined) => void;
  clearSlot: (teamKey: TeamKey, slot: Slot) => void;
  /** Striker do personagem nesta posição (null tira). */
  setStriker: (teamKey: TeamKey, slot: Slot, strikerUniformId: string | null) => void;
  /** Slot de CTP (1 ou 2) do personagem nesta equipe/dia; troca também o CTP antigo "do dia". */
  setCtpSlot: (teamKey: TeamKey, slot: Slot, ctpSlot: CtpSlot) => void;
  /** Equipa (ou remove) o CTP 1 ou 2 de um personagem do usuário (vale em todos os dias desse slot). */
  equipCtp: (agentId: string, ctpId: string | null, slot?: CtpSlot) => void;
  applyTeam: (teamKey: TeamKey, team: UserTeam) => void;
  /** A mesma equipe em vários dias de uma vez (ex.: todos os dias sem restrição). */
  applyTeamTo: (teamKeys: TeamKey[], team: UserTeam) => void;
  /** Pontuação do jogador num dia de jogo, modo e parte do dia (null apaga). */
  setScore: (date: string, mode: ScoreMode, points: number | null, phase?: ScorePhase) => void;
  resetMode: (mode: Mode) => void;
  /** Apaga todas as equipes montadas (BAX, BAL e BAI); elenco, CTPs e nome ficam. */
  resetAllTeams: () => void;
  replaceAll: (doc: UserSelections) => void;
  markSynced: (base: string | null, userId: string | null) => void;
  /** Ao sair da conta: o aparelho fica limpo (os dados continuam na conta). */
  clearDevice: () => void;
}

const touch = (doc: UserSelections, patch: Partial<UserSelections>): UserSelections => ({
  ...doc,
  ...patch,
  updatedAt: new Date().toISOString(),
});

const withTeam = (doc: UserSelections, key: TeamKey, fn: (team: UserTeam) => UserTeam) =>
  touch(doc, { teams: { ...doc.teams, [key]: fn({ ...(doc.teams[key] ?? {}) }) } });

export const useSelectionsStore = create<SelectionsState>()(
  persist(
    (set) => ({
      doc: emptySelections(),
      syncBase: null,
      syncUserId: null,
      syncedLocalAt: null,
      hydrated: false,

      setNickname: (nickname) => set(({ doc }) => ({ doc: touch(doc, { nickname: nickname.trim().slice(0, 30) }) })),

      setFreePick: (on) => set(({ doc }) => ({ doc: touch(doc, { freePick: on }) })),

      toggleOwnedUniform: (uniformId) =>
        set(({ doc }) => {
          const owned = new Set(doc.roster.ownedUniformIds);
          if (owned.has(uniformId)) owned.delete(uniformId);
          else owned.add(uniformId);
          return { doc: touch(doc, { roster: { ownedUniformIds: [...owned] } }) };
        }),

      setOwnedUniforms: (uniformIds, isOwned) =>
        set(({ doc }) => {
          const owned = new Set(doc.roster.ownedUniformIds);
          for (const id of uniformIds) {
            if (isOwned) owned.add(id);
            else owned.delete(id);
          }
          return { doc: touch(doc, { roster: { ownedUniformIds: [...owned] } }) };
        }),

      setSlot: (teamKey, slot, uniformId, agentOf) =>
        set(({ doc }) => ({
          doc: withTeam(doc, teamKey, (team) => {
            const agent = agentOf(uniformId);
            for (const other of SLOTS) {
              if (other !== slot && team[other] && agentOf(team[other]!.uniformId) === agent) delete team[other];
            }
            const same = team[slot]?.uniformId === uniformId;
            team[slot] = {
              uniformId,
              ctpId: (same ? team[slot]?.ctpId : undefined) ?? null,
              ctpSlot: (same ? team[slot]?.ctpSlot : undefined) ?? null,
              strikerUniformId: (same ? team[slot]?.strikerUniformId : undefined) ?? null,
            };
            return team;
          }),
        })),

      setStriker: (teamKey, slot, strikerUniformId) =>
        set(({ doc }) => ({
          doc: withTeam(doc, teamKey, (team) => {
            if (team[slot]) team[slot] = { ...team[slot]!, strikerUniformId };
            return team;
          }),
        })),

      setCtpSlot: (teamKey, slot, ctpSlot) =>
        set(({ doc }) => ({
          doc: withTeam(doc, teamKey, (team) => {
            if (team[slot]) team[slot] = { ...team[slot]!, ctpSlot, ctpId: null };
            return team;
          }),
        })),

      clearSlot: (teamKey, slot) =>
        set(({ doc }) => ({
          doc: withTeam(doc, teamKey, (team) => {
            delete team[slot];
            return team;
          }),
        })),

      equipCtp: (agentId, ctpId, slot = 1) =>
        set(({ doc }) => ({
          doc: touch(doc, { equipment: equipCtp(doc.equipment ?? { ctpByAgent: {} }, agentId, ctpId, slot) }),
        })),

      applyTeam: (teamKey, team) => set(({ doc }) => ({ doc: withTeam(doc, teamKey, () => ({ ...team })) })),

      applyTeamTo: (teamKeys, team) =>
        set(({ doc }) => ({
          doc: touch(doc, { teams: { ...doc.teams, ...Object.fromEntries(teamKeys.map((k) => [k, structuredClone(team)])) } }),
        })),

      setScore: (date, mode, points, phase = "post") =>
        set(({ doc }) => {
          const scores = { ...(doc.scores ?? {}) };
          if (points === null) delete scores[scoreKey(date, mode, phase)];
          else scores[scoreKey(date, mode, phase)] = points;
          return { doc: touch(doc, { scores }) };
        }),

      resetMode: (mode) =>
        set(({ doc }) => ({
          doc: touch(doc, {
            teams: Object.fromEntries(
              Object.entries(doc.teams).filter(([key]) => (mode === "BAI" ? key !== "BAI" : !key.startsWith(`${mode}-`))),
            ),
          }),
        })),

      resetAllTeams: () => set(({ doc }) => ({ doc: touch(doc, { teams: {} }) })),

      replaceAll: (doc) => set({ doc }),
      markSynced: (syncBase, syncUserId) => set(({ doc }) => ({ syncBase, syncUserId, syncedLocalAt: doc.updatedAt })),
      clearDevice: () => set({ doc: emptySelections(), syncBase: null, syncUserId: null, syncedLocalAt: null }),
    }),
    {
      name: "mff-selections",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ doc, syncBase, syncUserId, syncedLocalAt }) => ({ doc, syncBase, syncUserId, syncedLocalAt }),
      // Reidratado no cliente (src/pages/_app.tsx) para não divergir do HTML estático.
      skipHydration: true,
      // Documentos antigos não têm "equipment" (CTP por personagem), "nickname" nem "freePick".
      merge: (persisted, current) => {
        const p = persisted as Partial<SelectionsState> | undefined;
        return {
          ...current,
          syncBase: p?.syncBase ?? null,
          syncUserId: p?.syncUserId ?? null,
          syncedLocalAt: p?.syncedLocalAt ?? null,
          doc: { ...current.doc, ...p?.doc, equipment: p?.doc?.equipment ?? { ctpByAgent: {} }, nickname: p?.doc?.nickname ?? "", freePick: p?.doc?.freePick ?? false },
        };
      },
      onRehydrateStorage: () => () => useSelectionsStore.setState({ hydrated: true }),
    },
  ),
);
