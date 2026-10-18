import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import { getDays } from "@/models/api/days";
import { CRITERION_ATTRIBUTES, type CriterionAttribute, type DayMode } from "@/models/domain/enums";
import type { Criterion } from "@/models/domain/types";

export const ANY = "ANY";
export type Draft = Record<CriterionAttribute, string>;

const toDraft = (criteria: Criterion[]): Draft =>
  Object.fromEntries(
    CRITERION_ATTRIBUTES.map((a) => [a, criteria.find((c) => c.attribute === a)?.value ?? ANY]),
  ) as Draft;

const without = <T,>(record: Record<number, T>, key: number) => {
  const next = { ...record };
  delete next[key];
  return next;
};

const toCriteria = (draft: Draft): Criterion[] =>
  CRITERION_ATTRIBUTES.filter((a) => draft[a] !== ANY).map((a) => ({ attribute: a, value: draft[a] }));

/** Edição manual da restrição de cada dia (combinação "E" de critérios). */
export function useRestrictionEditorViewModel(mode: DayMode, messages: { saved: string; error: string }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["days", mode], queryFn: () => getDays(mode) });
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  const save = useMutation({
    mutationFn: ({ number, draft }: { number: number; draft: Draft }) => adminApi.setRestriction(mode, number, toCriteria(draft)),
    onSuccess: (_r, { number }) => {
      setDrafts((all) => without(all, number));
      qc.invalidateQueries({ queryKey: ["cycle"] });
      qc.invalidateQueries({ queryKey: ["days"] });
      qc.invalidateQueries({ queryKey: ["day"] });
      toast.success(messages.saved);
    },
    onError: (e: Error) => toast.error(`${messages.error}: ${e.message}`),
  });

  const rows = (query.data ?? []).map((d) => {
    const original = toDraft(d.criteria);
    const draft = drafts[d.number] ?? original;
    return {
      number: d.number,
      weekday: d.weekday,
      draft,
      dirty: CRITERION_ATTRIBUTES.some((a) => draft[a] !== original[a]),
      setValue: (attribute: CriterionAttribute, value: string) =>
        setDrafts((all) => ({ ...all, [d.number]: { ...(all[d.number] ?? original), [attribute]: value } })),
      reset: () => setDrafts((all) => without(all, d.number)),
      save: () => save.mutate({ number: d.number, draft }),
    };
  });

  return {
    rows,
    savingDay: save.isPending ? save.variables?.number : null,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
  };
}
