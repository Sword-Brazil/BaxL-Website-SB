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
  const form = useForm<LoginInput>({ resolver: zodResolver(LoginSchema), defaultValues: { login: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await login(values);
      toast.success(t("login.welcome"));
      const next = typeof router.query.next === "string" && router.query.next.startsWith("/") ? router.query.next : null;
      // Jogador volta para o elenco; a curadoria, para a administração.
      router.push(next ?? (user.role === "USER" ? "/meu-elenco" : "/admin"));
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
              <TextField control={form.control} name="login" label={t("fields.login")} autoComplete="username" autoCapitalize="none" spellCheck={false} />
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
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          <p>{t("login.forgot")}</p>
          <p>{t("login.noAccount")}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
