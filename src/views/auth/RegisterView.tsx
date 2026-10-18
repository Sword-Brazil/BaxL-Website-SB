import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { RegisterSchema, type RegisterInput } from "@/models/schemas/auth";
import { useAuthFlowsViewModel } from "@/viewmodels/useAuthFlowsViewModel";
import { TextField } from "@/views/shared/FormFields";
import { AuthCard } from "./AuthCard";

export function RegisterView() {
  const { t } = useTranslation("auth");
  const { register } = useAuthFlowsViewModel();
  const form = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema), defaultValues: { email: "", password: "", nickname: "" } });

  return (
    <AuthCard
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      footer={
        <span className="text-muted-foreground">
          {t("register.haveAccount")}{" "}
          <Link href="/entrar" className="text-energy underline-offset-4 hover:underline">
            {t("login.title")}
          </Link>
        </span>
      }
    >
      {register.isSuccess ? (
        <Alert className="border-brazil-green/40">
          <CircleCheckIcon className="text-brazil-green" />
          <AlertTitle className="whitespace-normal">{t("register.done")}</AlertTitle>
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit((v) => register.mutate(v))} noValidate>
          <FieldGroup>
            {register.error && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{register.error.message}</AlertTitle>
              </Alert>
            )}
            <TextField control={form.control} name="email" label={t("fields.email")} type="email" autoComplete="email" />
            <TextField
              control={form.control}
              name="password"
              label={t("fields.password")}
              type="password"
              autoComplete="new-password"
              description={t("fields.passwordHint")}
            />
            <TextField control={form.control} name="nickname" label={t("fields.nickname")} autoComplete="nickname" />
            <Button type="submit" variant="energy" size="touch" disabled={register.isPending}>
              {t("register.submit")}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  );
}
