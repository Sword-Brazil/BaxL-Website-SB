import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import type { PriorityRole } from "@/models/domain/enums";
import type { PriorityLists } from "@/models/domain/types";
import type { PriorityTarget } from "@/models/schemas/admin";

type Item = { uniformId: string; ctpId: string | null };
type Lists = Record<PriorityRole, Item[]>;

const toLists = (p: PriorityLists): Lists => ({
  SOLO: p.solo.map(({ uniformId, ctpId }) => ({ uniformId, ctpId })),
  SUPPORT: p.support.map(({ uniformId, ctpId }) => ({ uniformId, ctpId })),
});

/**
 * Reservas de um dia (ou da BAI): personagens além das equipes, usados na sugestão depois da Meta
 * e das Alternativas. Rascunho local até salvar; sem rascunho, vale o que veio do ciclo.
 */
export function useReservesEditorViewModel(target: PriorityTarget, saved: PriorityLists, messages: { saved: string }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Lists | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lists = draft ?? toLists(saved);

  const edit = (role: PriorityRole, fn: (list: Item[]) => Item[]) => setDraft({ ...lists, [role]: fn(lists[role]) });

  const save = useMutation({
    mutationFn: () => adminApi.savePriority(target, { solo: lists.SOLO, support: lists.SUPPORT }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cycle"] });
      // Num dia livre, o servidor recria as equipes dos outros dias livres e da BAI.
      qc.invalidateQueries({ queryKey: ["admin-meta-teams"] });
      qc.invalidateQueries({ queryKey: ["day"] });
      qc.invalidateQueries({ queryKey: ["bai"] });
      setDraft(null);
      setError(null);
      toast.success(messages.saved);
    },
    onError: (e: Error) => setError(e.message),
  });

  return {
    lists,
    count: lists.SOLO.length + lists.SUPPORT.length,
    dirty: draft !== null,
    error,
    isSaving: save.isPending,
    add: (role: PriorityRole, uniformId: string) => edit(role, (l) => [...l, { uniformId, ctpId: null }]),
    remove: (role: PriorityRole, index: number) => edit(role, (l) => l.filter((_, i) => i !== index)),
    move: (role: PriorityRole, from: number, to: number) =>
      edit(role, (l) => {
        if (to < 0 || to >= l.length) return l;
        const next = [...l];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      }),
    setCtp: (role: PriorityRole, index: number, ctpId: string | null) =>
      edit(role, (l) => l.map((item, i) => (i === index ? { ...item, ctpId } : item))),
    reset: () => {
      setDraft(null);
      setError(null);
    },
    save: () => save.mutate(),
  };
}
