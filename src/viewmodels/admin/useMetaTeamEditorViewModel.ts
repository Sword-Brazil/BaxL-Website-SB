import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNotifyError } from "@/viewmodels/useNotify";
import { adminApi } from "@/models/api/admin";
import { ApiError } from "@/models/api/client";
import { SLOTS, type Slot } from "@/models/domain/enums";
import type { MetaTeam } from "@/models/domain/types";
import type { CtpSlot } from "@/models/rules/ctpAssign";
import type { CatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import { MetaTeamSchema, type MetaTeamInput } from "@/models/schemas/admin";
import type { MetaScopeViewModel } from "./useMetaScopeViewModel";

export interface MemberDraft {
  uniformId: string | null;
  /** CTP só desta equipe (equipes antigas); vale enquanto `ctpSlot` for null. */
  ctpId: string | null;
  /** Slot de CTP do personagem usado neste dia. */
  ctpSlot: CtpSlot | null;
  /** CTPs 1 e 2 da Meta do personagem (valem em todas as equipes dele). */
  agentCtp1Id: string | null;
  agentCtp2Id: string | null;
  /** Causador de Dano: o jogador toca na foto e vê as rotações do personagem. */
  isDamageDealer: boolean;
  /** Striker meta do Causador de Dano. */
  strikerUniformId: string | null;
}

export interface TeamDraft {
  id?: string;
  isPrimary: boolean;
  label: string;
  labelEn: string;
  notes: string;
  members: Record<Slot, MemberDraft>;
}

const emptyMember = (): MemberDraft => ({
  uniformId: null,
  ctpId: null,
  ctpSlot: 1,
  agentCtp1Id: null,
  agentCtp2Id: null,
  isDamageDealer: false,
  strikerUniformId: null,
});

/** CTPs da Meta do personagem do traje, como estão no catálogo. */
const agentCtps = (catalog: CatalogViewModel, uniformId: string | null) => {
  const agent = uniformId ? catalog.uniformById(uniformId)?.agent : undefined;
  return { agentCtp1Id: agent?.metaCtp1Id ?? null, agentCtp2Id: agent?.metaCtp2Id ?? null };
};

/**
 * Membro salvo → rascunho. Equipe antiga (CTP só dela, sem slot): o CTP ocupa o slot vazio do
 * personagem ou o slot com o mesmo CTP; se os dois slots já têm outros CTPs, fica como está até o
 * administrador escolher um slot.
 */
function memberDraft(catalog: CatalogViewModel, m: MetaTeam["members"][number]): MemberDraft {
  const base = { uniformId: m.uniformId, isDamageDealer: m.isDamageDealer, strikerUniformId: m.strikerUniformId, ...agentCtps(catalog, m.uniformId) };
  if (m.ctpSlot || !m.ctpId) return { ...base, ctpId: null, ctpSlot: m.ctpSlot ?? 1 };
  if (!base.agentCtp1Id || base.agentCtp1Id === m.ctpId) return { ...base, agentCtp1Id: m.ctpId, ctpId: null, ctpSlot: 1 };
  if (!base.agentCtp2Id || base.agentCtp2Id === m.ctpId) return { ...base, agentCtp2Id: m.ctpId, ctpId: null, ctpSlot: 2 };
  return { ...base, ctpId: m.ctpId, ctpSlot: null };
}

const emptyDraft = (isPrimary: boolean): TeamDraft => ({
  isPrimary,
  label: "",
  labelEn: "",
  notes: "",
  members: Object.fromEntries(SLOTS.map((s) => [s, emptyMember()])) as TeamDraft["members"],
});

const fromTeam = (catalog: CatalogViewModel, t: MetaTeam): TeamDraft => ({
  id: t.id,
  isPrimary: t.isPrimary,
  label: t.label ?? "",
  labelEn: t.labelEn ?? "",
  notes: t.notes ?? "",
  members: Object.fromEntries(t.members.map((m) => [m.slot, memberDraft(catalog, m)])) as TeamDraft["members"],
});

/** Criação/edição de equipes Meta do escopo selecionado. Erros 422 aparecem no formulário. */
export function useMetaTeamEditorViewModel(scopeVm: MetaScopeViewModel, messages: { saved: string; deleted: string }) {
  const qc = useQueryClient();
  const notifyError = useNotifyError();
  const { scope, mode, number, isDay, catalog } = scopeVm;
  const key = ["admin-meta-teams", scope, isDay ? mode : null, isDay ? number : null];
  const list = useQuery({
    queryKey: key,
    queryFn: () => adminApi.listMetaTeams(scope, isDay ? mode : undefined, isDay ? number : undefined),
  });

  const [draft, setDraft] = useState<TeamDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-meta-teams"] });
    // Os CTPs 1/2 do personagem ficam no catálogo.
    qc.invalidateQueries({ queryKey: ["catalog"] });
    qc.invalidateQueries({ queryKey: ["cycle"] });
    qc.invalidateQueries({ queryKey: ["day"] });
    qc.invalidateQueries({ queryKey: ["days"] });
    qc.invalidateQueries({ queryKey: ["bal-free"] });
    qc.invalidateQueries({ queryKey: ["bai"] });
  };

  const save = useMutation({
    mutationFn: async (d: TeamDraft) => {
      const input: MetaTeamInput = {
        scope,
        ...(isDay ? { mode, number } : {}),
        isPrimary: d.isPrimary,
        label: d.label || null,
        labelEn: d.labelEn || null,
        notes: d.notes || null,
        members: SLOTS.map((slot) => {
          const m = d.members[slot];
          return {
            slot,
            uniformId: m.uniformId ?? "",
            ctpSlot: m.ctpSlot,
            ctpId: m.ctpSlot ? null : m.ctpId,
            ...(m.uniformId ? { agentCtp1Id: m.agentCtp1Id, agentCtp2Id: m.agentCtp2Id } : {}),
            isDamageDealer: m.isDamageDealer,
            strikerUniformId: m.isDamageDealer ? m.strikerUniformId : null,
          };
        }),
      };
      const parsed = MetaTeamSchema.safeParse(input);
      if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Dados inválidos");
      return d.id ? adminApi.updateMetaTeam(d.id, parsed.data) : adminApi.createMetaTeam(parsed.data);
    },
    onSuccess: () => {
      invalidate();
      setDraft(null);
      toast.success(messages.saved);
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteMetaTeam(id),
    onSuccess: () => {
      invalidate();
      toast.success(messages.deleted);
    },
    onError: (e: Error) => notifyError(e),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminApi.reorderMetaTeams(ids),
    onSuccess: () => {
      invalidate();
      toast.success(messages.saved);
    },
    onError: (e: Error) => notifyError(e),
  });

  const teams = list.data ?? [];
  return {
    teams,
    isLoading: list.isLoading,
    isError: list.isError,
    retry: list.refetch,
    draft,
    error,
    isSaving: save.isPending,
    /** Sem `isPrimary`: vira principal se o escopo ainda não tem equipes. */
    startNew: (isPrimary = teams.length === 0) => {
      setError(null);
      setDraft(emptyDraft(isPrimary));
    },
    startEdit: (t: MetaTeam) => {
      setError(null);
      setDraft(fromTeam(catalog, t));
    },
    close: () => setDraft(null),
    update: (patch: Partial<TeamDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d)),
    setMember: (slot: Slot, patch: Partial<TeamDraft["members"][Slot]>) =>
      setDraft((d) => {
        if (!d) return d;
        const cur = d.members[slot];
        // Outro personagem no slot: vêm os CTPs 1/2 dele, começando pelo 1.
        const agentOf = (u: string | null) => (u ? catalog.uniformById(u)?.agent.id : undefined);
        const swap = "uniformId" in patch && agentOf(patch.uniformId ?? null) !== agentOf(cur.uniformId);
        const next = swap ? { ...cur, ...agentCtps(catalog, patch.uniformId ?? null), ctpId: null, ctpSlot: 1 as CtpSlot, ...patch } : { ...cur, ...patch };
        return { ...d, members: { ...d.members, [slot]: next } };
      }),
    submit: () => draft && save.mutate(draft),
    remove: (id: string) => remove.mutate(id),
    /** Nova ordem das alternativas de um dia (ids na ordem desejada). */
    reorder: (ids: string[]) => reorder.mutateAsync(ids),
    isReordering: reorder.isPending,
  };
}
