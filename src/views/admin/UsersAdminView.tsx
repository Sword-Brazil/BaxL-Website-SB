import { useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { Controller } from "react-hook-form";
import { KeyRoundIcon, PlusIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES, type Role } from "@/models/domain/enums";
import { displayName } from "@/models/domain/types";
import { useUsersAdminViewModel } from "@/viewmodels/admin/useUsersAdminViewModel";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { QueryState } from "@/views/shared/QueryState";
import { TextField } from "@/views/shared/FormFields";

export function UsersAdminView() {
  const { t } = useTranslation(["admin", "auth"]);
  const { user: me } = useAuthViewModel();
  const vm = useUsersAdminViewModel({
    created: t("admin:users.created"),
    saved: t("admin:common.saved"),
    passwordReset: t("admin:users.passwordReset"),
    lastAdmin: t("admin:users.lastAdmin"),
  });
  const [pendingRole, setPendingRole] = useState<{ id: string; name: string; role: Role } | null>(null);
  const createError = vm.createForm.formState.errors.root?.message;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <InputGroup className="w-full sm:max-w-sm">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t("admin:users.search")}
            value={vm.q}
            onChange={(e) => vm.setQ(e.target.value)}
            aria-label={t("admin:users.search")}
          />
        </InputGroup>
        <Button variant="energy" className="w-full sm:w-auto" onClick={() => vm.setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          {t("admin:users.newUser")}
        </Button>
      </div>

      <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
        <ul className="flex flex-col divide-y divide-foreground/10 rounded-xl ring-1 ring-foreground/10">
          {vm.users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
              <div className="flex min-w-0 flex-1 basis-56 flex-col">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">@{u.username}</span>
                  {u.nickname && <span className="truncate text-sm text-muted-foreground">{u.nickname}</span>}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={u.role === "USER" ? "outline" : "brazil"}>{t(`admin:users.roles.${u.role}`)}</Badge>
                </span>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Select value={u.role} onValueChange={(role) => setPendingRole({ id: u.id, name: displayName(u), role: role as Role })}>
                  <SelectTrigger className="min-w-32 flex-1 sm:w-40 sm:flex-none" aria-label={`${t("admin:users.role")} · ${displayName(u)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`admin:users.roles.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => vm.setResetUserId(u.id)} disabled={u.id === me?.id}>
                  <KeyRoundIcon data-icon="inline-start" />
                  {t("admin:users.resetPassword")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {vm.pageCount > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button size="sm" variant="outline" disabled={vm.page <= 1} onClick={() => vm.setPage(vm.page - 1)}>
              ‹
            </Button>
            <span>
              {vm.page}/{vm.pageCount}
            </span>
            <Button size="sm" variant="outline" disabled={vm.page >= vm.pageCount} onClick={() => vm.setPage(vm.page + 1)}>
              ›
            </Button>
          </div>
        )}
      </QueryState>

      <AlertDialog open={!!pendingRole} onOpenChange={(open) => !open && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin:users.role")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRole &&
                t("admin:users.changeRoleConfirm", { name: pendingRole.name, role: t(`admin:users.roles.${pendingRole.role}`) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin:common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingRole && vm.changeRole(pendingRole.id, pendingRole.role)}>
              {t("admin:common.save")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={vm.createOpen} onOpenChange={vm.setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin:users.newUser")}</DialogTitle>
            <DialogDescription>{t("admin:users.help")}</DialogDescription>
          </DialogHeader>
          <form id="user-form" onSubmit={vm.submitCreate} noValidate>
            <FieldGroup>
              {createError && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>{createError}</AlertTitle>
                </Alert>
              )}
              <Controller
                control={vm.createForm.control}
                name="role"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{t("admin:users.role")}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {t(`admin:users.roles.${r}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <TextField
                control={vm.createForm.control}
                name="username"
                label={t("admin:users.username")}
                description={t("admin:users.usernameHint")}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <TextField
                control={vm.createForm.control}
                name="password"
                label={t("auth:fields.password")}
                type="password"
                autoComplete="new-password"
                strength
                description={t("auth:fields.passwordHint")}
              />
              <TextField control={vm.createForm.control} name="nickname" label={t("auth:fields.nickname")} />
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => vm.setCreateOpen(false)}>
              {t("admin:common.cancel")}
            </Button>
            <Button type="submit" form="user-form" variant="energy" disabled={vm.isCreating}>
              {t("admin:common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!vm.resetUserId} onOpenChange={(open) => !open && vm.setResetUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin:users.resetPassword")}</DialogTitle>
            <DialogDescription>{t("admin:users.resetHelp")}</DialogDescription>
          </DialogHeader>
          <form id="reset-form" onSubmit={vm.submitReset} noValidate>
            <TextField
              control={vm.resetForm.control}
              name="password"
              label={t("auth:fields.newPassword")}
              type="password"
              autoComplete="new-password"
              strength
              description={t("auth:fields.passwordHint")}
            />
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => vm.setResetUserId(null)}>
              {t("admin:common.cancel")}
            </Button>
            <Button type="submit" form="reset-form" variant="energy">
              {t("admin:common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
