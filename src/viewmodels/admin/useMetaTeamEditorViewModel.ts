import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import { ApiError } from "@/models/api/client";
import { SLOTS, type Slot } from "@/models/domain/enums";
import type { MetaTeam } from "@/models/domain/types";
import { MetaTeamSchema, type MetaTeamInput } from "@/models/schemas/admin";
import type { MetaScopeViewModel } from "./useMetaScopeViewModel";

export interface MemberDraft {
  uniformId: string | null;
  ctpId: string | null;
  /** Causador de Dano: o jogador toca na foto e vê as rotações do personagem. */
  isDamageDealer: boolean;
}

export interface TeamDraft {
  id?: string;
  isPrimary: boolean;
  label: string;
  notes: string;
  members: Record<Slot, MemberDraft>;
}

const emptyMember = (): MemberDraft => ({ uniformId: null, ctpId: null, isDamageDealer: false });

const emptyDraft = (isPrimary: boolean): TeamDraft => ({
  isPrimary,
  label: "",
  notes: "",
  members: Object.fromEntries(SLOTS.map((s) => [s, emptyMember()])) as TeamDraft["members"],
});

const fromTeam = (t: MetaTeam): TeamDraft => ({
  id: t.id,
  isPrimary: t.isPrimary,
  label: t.label ?? "",
  notes: t.notes ?? "",
  members: Object.fromEntries(
    t.members.map((m) => [
      m.slot,
      {
        uniformId: m.uniformId,
        ctpId: m.ctpId,
        isDamageDealer: m.isDamageDealer,
      },
    ]),
  ) as TeamDraft["members"],
});

/** Criação/edição de equipes Meta do escopo selecionado. Erros 422 aparecem no formulário. */
export function useMetaTeamEditorViewModel(scopeVm: MetaScopeViewModel, messages: { saved: string; deleted: string }) {
  const qc = useQueryClient();
  const { scope, mode, number, isDay } = scopeVm;
  const key = ["admin-meta-teams", scope, isDay ? mode : null, isDay ? number : null];
  const list = useQuery({
    queryKey: key,
    queryFn: () => adminApi.listMetaTeams(scope, isDay ? mode : undefined, isDay ? number : undefined),
  });

  const [draft, setDraft] = useState<TeamDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-meta-teams"] });
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
        notes: d.notes || null,
        members: SLOTS.map((slot) => {
          const m = d.members[slot];
          return {
            slot,
            uniformId: m.uniformId ?? "",
            ctpId: m.ctpId ?? null,
            isDamageDealer: m.isDamageDealer,
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
    onError: (e: Error) => toast.error(e.message),
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
      setDraft(fromTeam(t));
    },
    close: () => setDraft(null),
    update: (patch: Partial<TeamDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d)),
    setMember: (slot: Slot, patch: Partial<TeamDraft["members"][Slot]>) =>
      setDraft((d) => (d ? { ...d, members: { ...d.members, [slot]: { ...d.members[slot], ...patch } } } : d)),
    submit: () => draft && save.mutate(draft),
    remove: (id: string) => remove.mutate(id),
  };
}
