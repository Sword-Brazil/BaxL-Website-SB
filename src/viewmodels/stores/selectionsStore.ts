import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SLOTS, type Mode, type Slot } from "@/models/domain/enums";
import { equipCtp } from "@/models/rules/ctpAssign";
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
  /** Coloca o uniforme no slot; remove o mesmo agente de outro slot da equipe (invariante). */
  setSlot: (teamKey: TeamKey, slot: Slot, uniformId: string, agentOf: (uniformId: string) => string | undefined) => void;
  clearSlot: (teamKey: TeamKey, slot: Slot) => void;
  /** Equipa (ou remove) o CTP de um personagem do usuário. */
  equipCtp: (agentId: string, ctpId: string | null) => void;
  applyTeam: (teamKey: TeamKey, team: UserTeam) => void;
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
            const keepCtp = team[slot]?.uniformId === uniformId ? team[slot]?.ctpId : undefined;
            team[slot] = { uniformId, ctpId: keepCtp ?? null };
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

      equipCtp: (agentId, ctpId) =>
        set(({ doc }) => ({
          doc: touch(doc, { equipment: equipCtp(doc.equipment ?? { ctpByAgent: {} }, agentId, ctpId) }),
        })),

      applyTeam: (teamKey, team) => set(({ doc }) => ({ doc: withTeam(doc, teamKey, () => ({ ...team })) })),

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
      // Documentos antigos não têm "equipment" (CTP por personagem) nem "nickname".
      merge: (persisted, current) => {
        const p = persisted as Partial<SelectionsState> | undefined;
        return {
          ...current,
          syncBase: p?.syncBase ?? null,
          syncUserId: p?.syncUserId ?? null,
          syncedLocalAt: p?.syncedLocalAt ?? null,
          doc: { ...current.doc, ...p?.doc, equipment: p?.doc?.equipment ?? { ctpByAgent: {} }, nickname: p?.doc?.nickname ?? "" },
        };
      },
      onRehydrateStorage: () => () => useSelectionsStore.setState({ hydrated: true }),
    },
  ),
);
