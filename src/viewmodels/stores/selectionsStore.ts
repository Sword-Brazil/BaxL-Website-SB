import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SLOTS, type Mode, type Slot } from "@/models/domain/enums";
import { equipCtp } from "@/models/rules/ctpAssign";
import { emptySelections } from "@/models/rules/selectionsSync";
import type { TeamKey, UserSelections, UserTeam } from "@/models/schemas/selections";

interface SelectionsState {
  doc: UserSelections;
  /** updatedAt do servidor na última sincronização (null = nunca sincronizou). */
  syncBase: string | null;
  /** Conta à qual o documento local foi vinculado. */
  syncUserId: string | null;
  /** doc.updatedAt no momento da última sincronização (diferente = há mudanças locais). */
  syncedLocalAt: string | null;
  hydrated: boolean;

  toggleOwnedUniform: (uniformId: string) => void;
  setOwnedUniforms: (uniformIds: string[], owned: boolean) => void;
  /** Coloca o uniforme no slot; remove o mesmo agente de outro slot da equipe (invariante). */
  setSlot: (teamKey: TeamKey, slot: Slot, uniformId: string, agentOf: (uniformId: string) => string | undefined) => void;
  clearSlot: (teamKey: TeamKey, slot: Slot) => void;
  /** Equipa (ou remove) o CTP de um personagem do usuário. */
  equipCtp: (agentId: string, ctpId: string | null) => void;
  applyTeam: (teamKey: TeamKey, team: UserTeam) => void;
  resetMode: (mode: Mode) => void;
  replaceAll: (doc: UserSelections) => void;
  markSynced: (base: string | null, userId: string | null) => void;
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

      replaceAll: (doc) => set({ doc }),
      markSynced: (syncBase, syncUserId) => set(({ doc }) => ({ syncBase, syncUserId, syncedLocalAt: doc.updatedAt })),
    }),
    {
      name: "mff-selections",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ doc, syncBase, syncUserId, syncedLocalAt }) => ({ doc, syncBase, syncUserId, syncedLocalAt }),
      // Reidratado no cliente (src/pages/_app.tsx) para não divergir do HTML estático.
      skipHydration: true,
      // Documentos salvos antes do CTP por personagem não têm "equipment".
      merge: (persisted, current) => {
        const p = persisted as Partial<SelectionsState> | undefined;
        return { ...current, ...p, doc: { ...current.doc, ...p?.doc, equipment: p?.doc?.equipment ?? { ctpByAgent: {} } } };
      },
      onRehydrateStorage: () => () => useSelectionsStore.setState({ hydrated: true }),
    },
  ),
);
