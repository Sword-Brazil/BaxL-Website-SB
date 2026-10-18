import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleCheckIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { ForgotPasswordSchema } from "@/models/schemas/auth";
import { useAuthFlowsViewModel } from "@/viewmodels/useAuthFlowsViewModel";
import { TextField } from "@/views/shared/FormFields";
import { AuthCard } from "./AuthCard";

export function ForgotPasswordView() {
  const { t } = useTranslation("auth");
  const { forgot } = useAuthFlowsViewModel();
  const form = useForm<{ email: string }>({ resolver: zodResolver(ForgotPasswordSchema), defaultValues: { email: "" } });
  return (
    <AuthCard
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      footer={
        <Link href="/entrar" className="text-muted-foreground underline-offset-4 hover:underline">
          {t("login.title")}
        </Link>
      }
    >
      {forgot.isSuccess ? (
        <Alert className="border-brazil-green/40">
          <CircleCheckIcon className="text-brazil-green" />
          <AlertTitle className="whitespace-normal">{t("forgot.done")}</AlertTitle>
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit((v) => forgot.mutate(v.email))} noValidate>
          <FieldGroup>
            <TextField control={form.control} name="email" label={t("fields.email")} type="email" autoComplete="email" />
            <Button type="submit" variant="energy" size="touch" disabled={forgot.isPending}>
              {t("forgot.submit")}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  );
}
