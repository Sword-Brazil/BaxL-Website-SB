import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import { BaiBossesSchema } from "@/models/schemas/admin";

type BossDraft = { name: string; imagePath: string; tips: string };

/** Sequência única de chefes da BAI. A posição vem da ordem da lista. */
export function useBaiEditorViewModel(messages: { saved: string }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin-bai-bosses"], queryFn: adminApi.getBosses });
  // Rascunho local; sem rascunho, vale a lista do servidor.
  const [draft, setDraft] = useState<BossDraft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const server = (query.data ?? []).map((b) => ({ name: b.name, imagePath: b.imagePath ?? "", tips: b.tips ?? "" }));
  const bosses = draft ?? server;
  const dirty = draft !== null;

  const edit = (fn: (l: BossDraft[]) => BossDraft[]) => setDraft((d) => fn(d ?? server));

  const save = useMutation({
    mutationFn: () => {
      const parsed = BaiBossesSchema.safeParse(
        bosses.map((b, i) => ({ position: i + 1, name: b.name, imagePath: b.imagePath || null, tips: b.tips || null })),
      );
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return adminApi.saveBosses(parsed.data);
    },
    onSuccess: () => {
      setDraft(null);
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin-bai-bosses"] });
      qc.invalidateQueries({ queryKey: ["cycle"] });
      qc.invalidateQueries({ queryKey: ["bai"] });
      toast.success(messages.saved);
    },
    onError: (e: Error) => setError(e.message),
  });

  return {
    bosses,
    dirty,
    error,
    isSaving: save.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
    add: () => edit((l) => [...l, { name: "", imagePath: "", tips: "" }]),
    update: (i: number, patch: Partial<BossDraft>) => edit((l) => l.map((b, idx) => (idx === i ? { ...b, ...patch } : b))),
    remove: (i: number) => edit((l) => l.filter((_, idx) => idx !== i)),
    move: (from: number, to: number) =>
      to < 0 || to >= bosses.length
        ? undefined
        : edit((l) => {
            const next = [...l];
            const [b] = next.splice(from, 1);
            next.splice(to, 0, b);
            return next;
          }),
    save: () => save.mutate(),
  };
}
