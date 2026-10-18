import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { passwordSchema } from "@/models/schemas/common";
import { useAuthFlowsViewModel } from "@/viewmodels/useAuthFlowsViewModel";
import { TextField } from "@/views/shared/FormFields";
import { AuthCard } from "./AuthCard";

const FormSchema = z.object({ password: passwordSchema });

export function ResetPasswordView() {
  const { t } = useTranslation("auth");
  const token = String(useRouter().query.token ?? "");
  const { reset } = useAuthFlowsViewModel();
  const form = useForm<{ password: string }>({ resolver: zodResolver(FormSchema), defaultValues: { password: "" } });
  return (
    <AuthCard title={t("reset.title")}>
      {reset.isSuccess ? (
        <Alert className="border-brazil-green/40">
          <CircleCheckIcon className="text-brazil-green" />
          <AlertTitle className="whitespace-normal">
            {t("reset.done")}{" "}
            <Link href="/entrar" className="text-energy underline">
              {t("login.title")}
            </Link>
          </AlertTitle>
        </Alert>
      ) : (
        <form onSubmit={form.handleSubmit((v) => reset.mutate({ token, password: v.password }))} noValidate>
          <FieldGroup>
            {(reset.error || !token) && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("reset.invalid")}</AlertTitle>
              </Alert>
            )}
            <TextField
              control={form.control}
              name="password"
              label={t("fields.newPassword")}
              type="password"
              autoComplete="new-password"
              description={t("fields.passwordHint")}
            />
            <Button type="submit" variant="energy" size="touch" disabled={reset.isPending || !token}>
              {t("reset.submit")}
            </Button>
          </FieldGroup>
        </form>
      )}
    </AuthCard>
  );
}
