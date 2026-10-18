import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { ApiError } from "@/models/api/client";
import { LoginSchema, type LoginInput } from "@/models/schemas/auth";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { TextField } from "@/views/shared/FormFields";

export function LoginView() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const { login, loginState } = useAuthViewModel();
  const form = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await login(values);
      toast.success(t("login.welcome"));
      const next = typeof router.query.next === "string" && router.query.next.startsWith("/") ? router.query.next : null;
      router.push(next ?? (user.role === "USER" ? "/" : "/admin"));
    } catch {
      /* erro exibido abaixo */
    }
  });

  const error = loginState.error instanceof ApiError ? loginState.error : null;

  return (
    <div className="mx-auto w-full max-w-md">
      <Card variant="panel">
        <CardHeader>
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <CardDescription>{t("login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              {error && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>{error.status === 429 ? t("login.rateLimited") : error.message}</AlertTitle>
                </Alert>
              )}
              <TextField control={form.control} name="email" label={t("fields.email")} type="email" autoComplete="email" />
              <TextField
                control={form.control}
                name="password"
                label={t("fields.password")}
                type="password"
                autoComplete="current-password"
              />
              <Button type="submit" variant="energy" size="touch" disabled={form.formState.isSubmitting}>
                {t("login.submit")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2 text-sm">
          <Link href="/recuperar-senha" className="text-muted-foreground underline-offset-4 hover:underline">
            {t("login.forgot")}
          </Link>
          <span className="text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/cadastro" className="text-energy underline-offset-4 hover:underline">
              {t("login.register")}
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
