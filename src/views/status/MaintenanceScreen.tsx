import { useTranslation } from "next-i18next/pages";
import { HammerIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMaintenanceViewModel } from "@/viewmodels/useMaintenanceViewModel";

/**
 * Site em manutenção: o banco de produção está numa versão diferente da do código (algo maior
 * sendo desenvolvido). Ocupa a página no lugar do conteúdo e sai sozinha quando o banco volta.
 */
export function MaintenanceScreen() {
  const { t } = useTranslation("common");
  const { checking, check } = useMaintenanceViewModel();
  return (
    <div className="flex min-h-[60dvh] items-center justify-center py-8">
      <Card variant="panel" className="w-full max-w-lg text-center">
        <CardContent className="flex flex-col items-center gap-4 py-6" role="alert" aria-live="polite">
          <HammerIcon className="size-16 text-energy/80 sm:size-20" aria-hidden />
          <h1 className="font-heading text-2xl font-bold text-balance sm:text-3xl">{t("errors.MAINTENANCE.title")}</h1>
          <p className="text-sm text-pretty text-muted-foreground">{t("errors.MAINTENANCE.text")}</p>
          <p className="text-xs text-pretty text-muted-foreground">{t("maintenance.autoCheck")}</p>
          <Button variant="energy" size="touch" className="w-full sm:w-auto" loading={checking} onClick={() => void check()}>
            <RefreshCwIcon data-icon="inline-start" />
            {checking ? t("maintenance.checking") : t("maintenance.retry")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
