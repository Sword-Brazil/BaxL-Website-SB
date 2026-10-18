import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import { SettingsSchema } from "@/models/schemas/admin";

type FormValues = { anchorLocal: string; dayTurnoverHour: number; weeklyResetHour: number };

/** "YYYY-MM-DDTHH:mm" no horário de Brasília (UTC-3) ↔ ISO UTC. */
const toBrtLocal = (iso: string) => new Date(Date.parse(iso) - 3 * 3_600_000).toISOString().slice(0, 16);
const fromBrtLocal = (local: string) => new Date(`${local}:00-03:00`).toISOString();

export function useSettingsViewModel(messages: { saved: string }) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin-settings"], queryFn: adminApi.getSettings });
  const form = useForm<FormValues>({ defaultValues: { anchorLocal: "", dayTurnoverHour: 12, weeklyResetHour: 22 } });

  useEffect(() => {
    if (query.data) {
      form.reset({
        anchorLocal: toBrtLocal(query.data.cycleAnchor),
        dayTurnoverHour: query.data.dayTurnoverHour,
        weeklyResetHour: query.data.weeklyResetHour,
      });
    }
  }, [query.data, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const parsed = SettingsSchema.safeParse({
        cycleAnchor: v.anchorLocal ? fromBrtLocal(v.anchorLocal) : "",
        dayTurnoverHour: Number(v.dayTurnoverHour),
        weeklyResetHour: Number(v.weeklyResetHour),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return adminApi.saveSettings(parsed.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["clock"] });
      toast.success(messages.saved);
    },
    onError: (e: Error) => form.setError("root", { message: e.message }),
  });

  return {
    form,
    submit: form.handleSubmit((v) => save.mutate(v)),
    isSaving: save.isPending,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
  };
}
