import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { LifeBuoyIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/models/api/client";
import { safeNextPath } from "@/models/rules/safeRedirect";
import { LoginSchema, type LoginFormValues, type LoginInput } from "@/models/schemas/auth";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { TextField } from "@/views/shared/FormFields";
import { Hint } from "@/views/shared/Hint";

export function LoginView() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const { login, loginState } = useAuthViewModel();
  const form = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: "", password: "", remember: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values);
      toast.success(t("login.welcome"));
      const next = safeNextPath(router.query.next);
      // Volta para onde a pessoa ia antes do login (o site é só para membros).
      router.push(next ?? "/");
    } catch {
      /* erro exibido abaixo */
    }
  });

  const error = loginState.error instanceof ApiError ? loginState.error : null;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-16rem)] w-full max-w-md items-center py-4 sm:py-8">
      <Card variant="panel" className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
          <CardDescription className="text-pretty">{t("login.subtitle")}</CardDescription>
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
              <TextField control={form.control} name="username" label={t("fields.username")} autoComplete="username" autoCapitalize="none" spellCheck={false} />
              <TextField
                control={form.control}
                name="password"
                label={t("fields.password")}
                type="password"
                autoComplete="current-password"
              />
              {/* Sem marcar, a sessão acaba ao fechar o navegador e o site pede o login de novo. */}
              <Controller
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <Field orientation="horizontal" className="w-auto self-start">
                    <Checkbox id="remember" checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                    <Hint label={t("login.rememberHint")}>
                      <FieldLabel htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                        {t("login.remember")}
                      </FieldLabel>
                    </Hint>
                  </Field>
                )}
              />
              <Button type="submit" variant="energy" size="touch" disabled={form.formState.isSubmitting}>
                {t("login.submit")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="gap-2 text-xs text-muted-foreground sm:text-sm">
          <LifeBuoyIcon className="size-4 shrink-0 text-energy" aria-hidden />
          <p className="text-pretty">{t("login.help")}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
