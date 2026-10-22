import type { ReactNode } from "react";
import { useTranslation } from "next-i18next/pages";
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingState } from "./LoadingState";

/** Estados de carregamento (aviso + Skeleton) e erro (Alert com "tentar novamente"). */
export function QueryState({
  isLoading,
  isError,
  retry,
  skeleton,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  retry: () => unknown;
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation("common");
  if (isError) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>{t("states.error")}</AlertTitle>
        <AlertAction>
          <Button size="sm" variant="outline" onClick={() => retry()}>
            {t("actions.retry")}
          </Button>
        </AlertAction>
      </Alert>
    );
  }
  if (isLoading) return <LoadingState>{skeleton ?? <Skeleton className="h-48 w-full" />}</LoadingState>;
  return <>{children}</>;
}
