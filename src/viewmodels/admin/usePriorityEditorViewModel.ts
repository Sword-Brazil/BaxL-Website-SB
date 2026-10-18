import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import type { PriorityRole } from "@/models/domain/enums";
import type { PriorityInput } from "@/models/schemas/admin";
import type { MetaScopeViewModel } from "./useMetaScopeViewModel";

type Item = { uniformId: string; ctpId: string | null };
type Lists = Record<PriorityRole, Item[]>;

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** Listas ordenadas de Soladores e Suportes de um dia (ou da BAI) para as sugestões. */
export function usePriorityEditorViewModel(scopeVm: MetaScopeViewModel, messages: { saved: string }) {
  const qc = useQueryClient();
  const target = scopeVm.target;
  const key = ["admin-priority", JSON.stringify(target)];
  const query = useQuery({ queryKey: key, queryFn: () => adminApi.getPriority(target!), enabled: !!target });
  // Rascunho local por escopo; sem rascunho, vale o que veio do servidor.
  const [drafts, setDrafts] = useState<Record<string, Lists>>({});
  const [error, setError] = useState<string | null>(null);
  const draftKey = key[1];
  const strip = (xs: { uniformId: string; ctpId: string | null }[] = []) => xs.map(({ uniformId, ctpId }) => ({ uniformId, ctpId }));
  const server: Lists = { SOLO: strip(query.data?.solo), SUPPORT: strip(query.data?.support) };
  const lists = drafts[draftKey] ?? server;
  const dirty = !!drafts[draftKey];

  const edit = (role: PriorityRole, fn: (list: Item[]) => Item[]) =>
    setDrafts((all) => {
      const current = all[draftKey] ?? server;
      return { ...all, [draftKey]: { ...current, [role]: fn(current[role]) } };
    });

  const save = useMutation({
    mutationFn: () => {
      const body: PriorityInput = { solo: lists.SOLO, support: lists.SUPPORT };
      return adminApi.savePriority(target!, body);
    },
    onSuccess: () => {
      setDrafts((all) => {
        const next = { ...all };
        delete next[draftKey];
        return next;
      });
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin-priority"] });
      qc.invalidateQueries({ queryKey: ["cycle"] });
      qc.invalidateQueries({ queryKey: ["day"] });
      qc.invalidateQueries({ queryKey: ["bai"] });
      toast.success(messages.saved);
    },
    onError: (e: Error) => setError(e.message),
  });

  return {
    enabled: !!target,
    lists,
    dirty,
    error,
    isSaving: save.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
    add: (role: PriorityRole, uniformId: string) =>
      edit(role, (l) => (l.some((i) => i.uniformId === uniformId) ? l : [...l, { uniformId, ctpId: null }])),
    remove: (role: PriorityRole, index: number) => edit(role, (l) => l.filter((_, i) => i !== index)),
    move: (role: PriorityRole, from: number, to: number) =>
      to < 0 || to >= lists[role].length || from === to ? undefined : edit(role, (l) => move(l, from, to)),
    setCtp: (role: PriorityRole, index: number, ctpId: string | null) =>
      edit(role, (l) => l.map((i, idx) => (idx === index ? { ...i, ctpId } : i))),
    save: () => save.mutate(),
  };
}
