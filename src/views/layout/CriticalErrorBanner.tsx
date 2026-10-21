import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useQueryClient } from "@tanstack/react-query";
import { CloudOffIcon, DatabaseIcon, LockKeyholeIcon, ServerCrashIcon, ShieldAlertIcon, XIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AppErrorKind } from "@/models/domain/appErrors";
import { useCriticalErrorStore } from "@/viewmodels/stores/criticalErrorStore";

const ICONS: Partial<Record<AppErrorKind, typeof CloudOffIcon>> = {
  NETWORK: CloudOffIcon,
  DATABASE: DatabaseIcon,
  SERVER: ServerCrashIcon,
  FORBIDDEN: ShieldAlertIcon,
  SESSION_EXPIRED: LockKeyholeIcon,
};

/**
 * Alerta fixo dos erros graves (sem conexão, banco fora do ar, erro no servidor, acesso negado,
 * sessão encerrada): fica na tela até a pessoa agir. Os erros leves são só notificações.
 */
export function CriticalErrorBanner() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const qc = useQueryClient();
  const { kind, clear } = useCriticalErrorStore();
  if (!kind) return null;
  const Icon = ICONS[kind] ?? ServerCrashIcon;

  const action =
    kind === "SESSION_EXPIRED"
      ? { label: t("errors.actions.signIn"), run: () => router.pathname !== "/entrar" && router.push("/entrar") }
      : kind === "FORBIDDEN"
        ? { label: t("errors.actions.goHome"), run: () => router.push("/") }
        : { label: t("actions.retry"), run: () => qc.refetchQueries({ type: "active" }) };
  const showAction = !(kind === "SESSION_EXPIRED" && router.pathname === "/entrar");

  return (
    <Alert variant="destructive" role="alert" className="mb-4 border-destructive/50 bg-destructive/10">
      <Icon />
      <AlertTitle>{t(`errors.${kind}.title`)}</AlertTitle>
      <AlertDescription>{t(`errors.${kind}.text`)}</AlertDescription>
      <AlertAction className="flex gap-1">
        {showAction && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              clear();
              void action.run();
            }}
          >
            {action.label}
          </Button>
        )}
        <Button size="icon-sm" variant="ghost" aria-label={t("errors.actions.dismiss")} onClick={clear}>
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
