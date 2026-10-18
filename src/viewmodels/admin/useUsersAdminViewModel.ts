import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import { ApiError } from "@/models/api/client";
import type { Role } from "@/models/domain/enums";
import { AdminResetPasswordSchema, CreateStaffSchema, type CreateStaffInput } from "@/models/schemas/admin";

/** Gestão de contas: busca, novos administradores/curadores (Zod), troca de papel e reset de senha. */
export function useUsersAdminViewModel(messages: { created: string; saved: string; passwordReset: string; lastAdmin: string }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin-users", q, page],
    queryFn: () => adminApi.listUsers(q, page),
    placeholderData: keepPreviousData,
  });

  const createForm = useForm<CreateStaffInput>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: { email: "", password: "", nickname: "", role: "CURATOR" },
  });
  const [createOpen, setCreateOpen] = useState(false);

  const create = useMutation({
    mutationFn: adminApi.createStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateOpen(false);
      createForm.reset();
      toast.success(messages.created);
    },
    onError: (e: Error) =>
      e instanceof ApiError && e.status === 409
        ? createForm.setError("email", { message: e.message })
        : createForm.setError("root", { message: e.message }),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminApi.changeRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success(messages.saved);
    },
    onError: (e: Error) => toast.error(e instanceof ApiError && e.status === 409 ? messages.lastAdmin : e.message),
  });

  const resetForm = useForm<{ password: string }>({ resolver: zodResolver(AdminResetPasswordSchema), defaultValues: { password: "" } });
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminApi.resetPassword(id, password),
    onSuccess: () => {
      setResetUserId(null);
      resetForm.reset();
      toast.success(messages.passwordReset);
    },
    onError: (e: Error) => resetForm.setError("password", { message: e.message }),
  });

  const data = query.data;
  return {
    users: data?.users ?? [],
    total: data?.total ?? 0,
    page,
    pageCount: data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1,
    setPage,
    q,
    setQ: (v: string) => {
      setQ(v);
      setPage(1);
    },
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
    createForm,
    createOpen,
    setCreateOpen,
    submitCreate: createForm.handleSubmit((v) => create.mutate(v)),
    isCreating: create.isPending,
    changeRole: (id: string, role: Role) => changeRole.mutate({ id, role }),
    resetForm,
    resetUserId,
    setResetUserId,
    submitReset: resetForm.handleSubmit((v) => resetUserId && resetPassword.mutate({ id: resetUserId, password: v.password })),
  };
}
